export type SourceState = "ok" | "degraded" | "unavailable";
export type Severity = "info" | "warning" | "critical";

export interface DataSource {
  id: string;
  label: string;
  url: string;
  state: SourceState;
  fetchedAt: string | null;
  latencyMs: number | null;
  error: string | null;
}

export interface Anomaly {
  id: string;
  severity: Severity;
  metric: string;
  title: string;
  detail: string;
  observed: number | null;
  threshold: number | null;
}

export interface TvlPoint {
  timestamp: number;
  date: string;
  tvlUsd: number;
}

export interface Protocol {
  name: string;
  category: string;
  tvlUsd: number;
  change1dPct: number | null;
  change7dPct: number | null;
  url: string;
}

export interface Validator {
  voteAccount: string;
  identity: string;
  stakeSol: number;
  stakeSharePct: number;
  commissionPct: number;
  lastVote: number;
  delinquent: boolean;
}

export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  category: string;
}

export interface Upgrade {
  id: string;
  title: string;
  status: string;
  summary: string;
  url: string;
  updatedAt: string | null;
}

export interface SolanaReport {
  meta: {
    schemaVersion: "1.0";
    generatedAt: string;
    refreshIntervalSeconds: number;
    buildDurationMs: number;
    overallState: SourceState;
  };
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
  market: {
    solPriceUsd: number | null;
    solChange24hPct: number | null;
    solMarketCapUsd: number | null;
    solVolume24hUsd: number | null;
    tvlUsd: number | null;
    tvlChange1dPct: number | null;
    stablecoinSupplyUsd: number | null;
    dexVolume24hUsd: number | null;
    dexChange1dPct: number | null;
    ecosystemFees24hUsd: number | null;
    networkFees24hUsd: number | null;
    mevTips24hUsd: number | null;
    realEconomicValue24hUsd: number | null;
    rwaTvlUsd: number | null;
    tokenizedEquitiesTvlUsd: number | null;
  };
  ecosystem: {
    topProtocols: Protocol[];
    rwaProtocols: Protocol[];
    news: NewsItem[];
    upgrades: Upgrade[];
  };
  history: {
    tvl: TvlPoint[];
  };
  anomalies: Anomaly[];
  sources: DataSource[];
  limitations: string[];
}
