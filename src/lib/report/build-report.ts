import "server-only";

import type { SolanaReport, SourceState } from "@/types/report";
import { detectAnomalies } from "./anomalies";
import {
  collectDefi,
  collectNews,
  collectPrice,
  collectUpgrades,
} from "./collectors";
import { REPORT_REFRESH_SECONDS } from "./config";
import { collectRpc } from "./rpc";

let cachedReport: SolanaReport | null = null;
let cachedAt = 0;
let pendingReport: Promise<SolanaReport> | null = null;

const build = async (): Promise<SolanaReport> => {
  const startedAt = Date.now();
  const [rpc, price, defi, news, upgrades] = await Promise.all([
    collectRpc(),
    collectPrice(),
    collectDefi(),
    collectNews(),
    collectUpgrades(),
  ]);
  const sources = [
    rpc.source,
    price.source,
    defi.source,
    news.source,
    upgrades.source,
  ];
  const unavailableCount = sources.filter(
    (item) => item.state === "unavailable",
  ).length;
  const degradedCount = sources.filter(
    (item) => item.state === "degraded",
  ).length;
  const overallState: SourceState =
    unavailableCount >= 2
      ? "unavailable"
      : unavailableCount > 0 || degradedCount > 0
        ? "degraded"
        : "ok";

  const market: SolanaReport["market"] = {
    solPriceUsd: price.data?.priceUsd ?? null,
    solChange24hPct: price.data?.change24hPct ?? null,
    solMarketCapUsd: price.data?.marketCapUsd ?? null,
    solVolume24hUsd: price.data?.volume24hUsd ?? null,
    tvlUsd: defi.data?.tvlUsd ?? null,
    tvlChange1dPct: defi.data?.tvlChange1dPct ?? null,
    stablecoinSupplyUsd: defi.data?.stablecoinSupplyUsd ?? null,
    dexVolume24hUsd: defi.data?.dexVolume24hUsd ?? null,
    dexChange1dPct: defi.data?.dexChange1dPct ?? null,
    ecosystemFees24hUsd: defi.data?.ecosystemFees24hUsd ?? null,
    networkFees24hUsd: defi.data?.networkFees24hUsd ?? null,
    mevTips24hUsd: defi.data?.mevTips24hUsd ?? null,
    realEconomicValue24hUsd:
      defi.data?.realEconomicValue24hUsd ?? null,
    rwaTvlUsd: defi.data?.rwaTvlUsd ?? null,
    tokenizedEquitiesTvlUsd:
      defi.data?.tokenizedEquitiesTvlUsd ?? null,
  };

  const report: SolanaReport = {
    meta: {
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      refreshIntervalSeconds: REPORT_REFRESH_SECONDS,
      buildDurationMs: Date.now() - startedAt,
      overallState,
    },
    network: rpc.network,
    validators: rpc.validators,
    market,
    ecosystem: {
      topProtocols: defi.data?.topProtocols ?? [],
      rwaProtocols: defi.data?.rwaProtocols ?? [],
      news: news.data ?? [],
      upgrades: upgrades.data ?? [],
    },
    history: {
      tvl: defi.data?.tvlHistory ?? [],
    },
    anomalies: [],
    sources,
    limitations: [
      "Daily active addresses require an indexed transaction dataset. Public RPC cannot calculate a full-day unique count within a low-maintenance request budget, so the report exposes sampled active signers instead.",
      "Automated Dune extraction and X sentiment require credentials or a licensed data feed. Both remain optional integrations and never block the keyless report.",
      "Tokenized equity activity uses xStocks TVL as a public proxy. Trade volume by tokenized equity requires a dedicated indexer.",
      "Validator commission values are current snapshots. Persistent commission-change history requires durable storage or scheduled report archives.",
    ],
  };

  report.anomalies = detectAnomalies({
    network: report.network,
    validators: report.validators,
    market: report.market,
    failedSourceCount: unavailableCount,
    tpsSamples: rpc.tpsSamples,
  });

  return report;
};

export async function getSolanaReport(
  forceRefresh = false,
): Promise<SolanaReport> {
  const isFresh =
    cachedReport !== null &&
    Date.now() - cachedAt < REPORT_REFRESH_SECONDS * 1000;
  if (!forceRefresh && isFresh && cachedReport) return cachedReport;
  if (pendingReport) return pendingReport;

  pendingReport = build()
    .then((report) => {
      cachedReport = report;
      cachedAt = Date.now();
      return report;
    })
    .finally(() => {
      pendingReport = null;
    });

  return pendingReport;
}
