import type { DataSource, Validator } from "@/types/report";
import { FETCH_TIMEOUT_MS, RPC_ENDPOINTS } from "./config";
import {
  cleanError,
  LAMPORTS_PER_SOL,
  median,
  round,
} from "./utils";

interface RpcEnvelope<T> {
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

interface PerformanceSample {
  numSlots: number;
  numTransactions: number;
  numNonVoteTransactions: number;
  samplePeriodSecs: number;
  slot: number;
}

interface EpochInfo {
  absoluteSlot: number;
  blockHeight: number;
  epoch: number;
  slotIndex: number;
  slotsInEpoch: number;
  transactionCount: number | null;
}

interface VoteAccount {
  activatedStake: number;
  commission: number;
  epochVoteAccount: boolean;
  lastVote: number;
  nodePubkey: string;
  votePubkey: string;
}

interface VoteAccounts {
  current: VoteAccount[];
  delinquent: VoteAccount[];
}

interface Supply {
  value: {
    circulating: number;
    total: number;
  };
}

interface PriorityFee {
  prioritizationFee: number;
  slot: number;
}

interface BlockAccount {
  pubkey: string;
  signer: boolean;
}

interface BlockTransaction {
  meta: {
    fee: number;
  } | null;
  transaction: {
    accountKeys: BlockAccount[];
  };
}

interface BlockResult {
  transactions: BlockTransaction[];
}

interface BatchResults {
  health: string | null;
  slot: number | null;
  blockHeight: number | null;
  epochInfo: EpochInfo;
  performance: PerformanceSample[];
  voteAccounts: VoteAccounts | null;
  supply: Supply | null;
  priorityFees: PriorityFee[];
}

export interface RpcCollection {
  source: DataSource;
  network: {
    health: "ok" | "degraded" | "unknown";
    slot: number | null;
    blockHeight: number | null;
    transactionCount: number | null;
    totalTps: number | null;
    nonVoteTps: number | null;
    slotTimeMs: number | null;
    epoch: number | null;
    epochProgressPct: number | null;
    slotsRemaining: number | null;
    medianTransactionFeeLamports: number | null;
    medianPriorityFeeMicroLamports: number | null;
    circulatingSupplySol: number | null;
    totalSupplySol: number | null;
    sampledActiveSigners: number | null;
    sampleWindowSlots: number | null;
  };
  validators: {
    activeCount: number | null;
    delinquentCount: number | null;
    delinquentStakePct: number | null;
    activeStakeSol: number | null;
    delinquentStakeSol: number | null;
    top10StakePct: number | null;
    superminorityValidatorCount: number | null;
    weightedCommissionPct: number | null;
    top: Validator[];
  };
  tpsSamples: number[];
}

const request = (id: number, method: string, params: unknown[] = []) => ({
  jsonrpc: "2.0",
  id,
  method,
  params,
});

async function rpcPost<T>(
  endpoint: string,
  body: object | object[],
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RPC returned HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

const resultById = <T>(
  responses: RpcEnvelope<unknown>[],
  id: number,
): T | null => {
  const response = responses.find((item) => item.id === id);
  return response?.result === undefined ? null : (response.result as T);
};

async function fetchBatch(endpoint: string): Promise<BatchResults> {
  const responses = await rpcPost<RpcEnvelope<unknown>[]>(endpoint, [
    request(1, "getHealth"),
    request(2, "getSlot", [{ commitment: "finalized" }]),
    request(3, "getBlockHeight", [{ commitment: "finalized" }]),
    request(4, "getEpochInfo", [{ commitment: "finalized" }]),
    request(5, "getRecentPerformanceSamples", [12]),
    request(6, "getVoteAccounts", [{ commitment: "finalized" }]),
    request(7, "getSupply", [{ commitment: "finalized" }]),
    request(8, "getRecentPrioritizationFees"),
  ]);

  if (!Array.isArray(responses)) {
    throw new Error("RPC endpoint did not return a batch response");
  }

  const epochInfo = resultById<EpochInfo>(responses, 4);
  const performance = resultById<PerformanceSample[]>(responses, 5) ?? [];
  const voteAccounts = resultById<VoteAccounts>(responses, 6);

  if (!epochInfo || performance.length === 0 || !voteAccounts) {
    throw new Error("RPC response is missing required network fields");
  }

  return {
    health: resultById<string>(responses, 1),
    slot: resultById<number>(responses, 2),
    blockHeight: resultById<number>(responses, 3),
    epochInfo,
    performance,
    voteAccounts,
    supply: resultById<Supply>(responses, 7),
    priorityFees: resultById<PriorityFee[]>(responses, 8) ?? [],
  };
}

async function fetchBlockSample(
  endpoint: string,
  finalizedSlot: number,
): Promise<{
  medianFeeLamports: number | null;
  activeSigners: number | null;
}> {
  for (let offset = 2; offset <= 12; offset += 1) {
    const response = await rpcPost<RpcEnvelope<BlockResult>>(endpoint, request(
      20 + offset,
      "getBlock",
      [
        finalizedSlot - offset,
        {
          commitment: "finalized",
          encoding: "json",
          transactionDetails: "accounts",
          rewards: false,
          maxSupportedTransactionVersion: 0,
        },
      ],
    ));

    if (!response.result) continue;

    const fees = response.result.transactions
      .map((transaction) => transaction.meta?.fee)
      .filter((fee): fee is number => typeof fee === "number");
    const signers = new Set(
      response.result.transactions.flatMap((transaction) =>
        transaction.transaction.accountKeys
          .filter((account) => account.signer)
          .map((account) => account.pubkey),
      ),
    );

    return {
      medianFeeLamports: median(fees),
      activeSigners: signers.size,
    };
  }

  return { medianFeeLamports: null, activeSigners: null };
}

function buildValidatorSummary(voteAccounts: VoteAccounts | null) {
  if (!voteAccounts) {
    return {
      activeCount: null,
      delinquentCount: null,
      delinquentStakePct: null,
      activeStakeSol: null,
      delinquentStakeSol: null,
      top10StakePct: null,
      superminorityValidatorCount: null,
      weightedCommissionPct: null,
      top: [],
    };
  }

  const activeStakeLamports = voteAccounts.current.reduce(
    (sum, validator) => sum + validator.activatedStake,
    0,
  );
  const delinquentStakeLamports = voteAccounts.delinquent.reduce(
    (sum, validator) => sum + validator.activatedStake,
    0,
  );
  const totalStakeLamports = activeStakeLamports + delinquentStakeLamports;
  const sorted = [...voteAccounts.current].sort(
    (a, b) => b.activatedStake - a.activatedStake,
  );
  const top10Stake = sorted
    .slice(0, 10)
    .reduce((sum, validator) => sum + validator.activatedStake, 0);

  let cumulativeStake = 0;
  let superminorityValidatorCount = 0;
  for (const validator of sorted) {
    cumulativeStake += validator.activatedStake;
    superminorityValidatorCount += 1;
    if (cumulativeStake >= activeStakeLamports / 3) break;
  }

  const weightedCommission =
    activeStakeLamports === 0
      ? null
      : sorted.reduce(
          (sum, validator) =>
            sum + validator.commission * validator.activatedStake,
          0,
        ) / activeStakeLamports;

  const toValidator = (
    validator: VoteAccount,
    delinquent: boolean,
  ): Validator => ({
    voteAccount: validator.votePubkey,
    identity: validator.nodePubkey,
    stakeSol: round(validator.activatedStake / LAMPORTS_PER_SOL),
    stakeSharePct:
      activeStakeLamports === 0
        ? 0
        : round((validator.activatedStake / activeStakeLamports) * 100, 3),
    commissionPct: validator.commission,
    lastVote: validator.lastVote,
    delinquent,
  });

  return {
    activeCount: voteAccounts.current.length,
    delinquentCount: voteAccounts.delinquent.length,
    delinquentStakePct:
      totalStakeLamports === 0
        ? 0
        : round((delinquentStakeLamports / totalStakeLamports) * 100, 3),
    activeStakeSol: round(activeStakeLamports / LAMPORTS_PER_SOL),
    delinquentStakeSol: round(delinquentStakeLamports / LAMPORTS_PER_SOL),
    top10StakePct:
      activeStakeLamports === 0
        ? 0
        : round((top10Stake / activeStakeLamports) * 100, 2),
    superminorityValidatorCount,
    weightedCommissionPct:
      weightedCommission === null ? null : round(weightedCommission, 2),
    top: sorted.slice(0, 12).map((validator) => toValidator(validator, false)),
  };
}

const emptyCollection = (source: DataSource): RpcCollection => ({
  source,
  network: {
    health: "unknown",
    slot: null,
    blockHeight: null,
    transactionCount: null,
    totalTps: null,
    nonVoteTps: null,
    slotTimeMs: null,
    epoch: null,
    epochProgressPct: null,
    slotsRemaining: null,
    medianTransactionFeeLamports: null,
    medianPriorityFeeMicroLamports: null,
    circulatingSupplySol: null,
    totalSupplySol: null,
    sampledActiveSigners: null,
    sampleWindowSlots: null,
  },
  validators: buildValidatorSummary(null),
  tpsSamples: [],
});

export async function collectRpc(): Promise<RpcCollection> {
  const startedAt = Date.now();
  let lastError: unknown = new Error("No RPC endpoints configured");

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const batch = await fetchBatch(endpoint);
      const latestSample = batch.performance[0];
      const totalTpsSamples = batch.performance.map(
        (sample) => sample.numTransactions / sample.samplePeriodSecs,
      );
      const totalTps =
        latestSample.numTransactions / latestSample.samplePeriodSecs;
      const nonVoteTps =
        latestSample.numNonVoteTransactions / latestSample.samplePeriodSecs;
      const sampleSlots = batch.performance.reduce(
        (sum, sample) => sum + sample.numSlots,
        0,
      );
      const sampleSeconds = batch.performance.reduce(
        (sum, sample) => sum + sample.samplePeriodSecs,
        0,
      );
      const blockSample =
        batch.slot === null
          ? { medianFeeLamports: null, activeSigners: null }
          : await fetchBlockSample(endpoint, batch.slot).catch(() => ({
              medianFeeLamports: null,
              activeSigners: null,
            }));
      const epochInfo = batch.epochInfo;

      return {
        source: {
          id: "solana-rpc",
          label: "Solana JSON-RPC",
          url: endpoint,
          state:
            blockSample.medianFeeLamports === null ? "degraded" : "ok",
          fetchedAt: new Date().toISOString(),
          latencyMs: Date.now() - startedAt,
          error:
            blockSample.medianFeeLamports === null
              ? "Block fee sample was unavailable"
              : null,
        },
        network: {
          health: batch.health === "ok" ? "ok" : "degraded",
          slot: batch.slot,
          blockHeight: batch.blockHeight ?? epochInfo.blockHeight,
          transactionCount: epochInfo.transactionCount,
          totalTps: round(totalTps),
          nonVoteTps: round(nonVoteTps),
          slotTimeMs:
            sampleSlots === 0
              ? null
              : round((sampleSeconds / sampleSlots) * 1000),
          epoch: epochInfo.epoch,
          epochProgressPct: round(
            (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
          ),
          slotsRemaining: epochInfo.slotsInEpoch - epochInfo.slotIndex,
          medianTransactionFeeLamports: blockSample.medianFeeLamports,
          medianPriorityFeeMicroLamports: median(
            batch.priorityFees.map((fee) => fee.prioritizationFee),
          ),
          circulatingSupplySol: batch.supply
            ? round(batch.supply.value.circulating / LAMPORTS_PER_SOL)
            : null,
          totalSupplySol: batch.supply
            ? round(batch.supply.value.total / LAMPORTS_PER_SOL)
            : null,
          sampledActiveSigners: blockSample.activeSigners,
          sampleWindowSlots: sampleSlots,
        },
        validators: buildValidatorSummary(batch.voteAccounts),
        tpsSamples: totalTpsSamples,
      };
    } catch (error) {
      lastError = error;
    }
  }

  return emptyCollection({
    id: "solana-rpc",
    label: "Solana JSON-RPC",
    url: RPC_ENDPOINTS[0] ?? "https://solana.com/docs/rpc",
    state: "unavailable",
    fetchedAt: null,
    latencyMs: Date.now() - startedAt,
    error: cleanError(lastError),
  });
}
