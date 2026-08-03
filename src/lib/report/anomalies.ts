import type { Anomaly, SolanaReport } from "@/types/report";

type Inputs = Pick<SolanaReport, "network" | "validators" | "market"> & {
  failedSourceCount: number;
  tpsSamples: number[];
};

export function detectAnomalies(input: Inputs): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const add = (anomaly: Anomaly): void => {
    anomalies.push(anomaly);
  };

  if (input.network.slotTimeMs !== null && input.network.slotTimeMs > 600) {
    add({
      id: "slow-slot-time",
      severity: input.network.slotTimeMs > 800 ? "critical" : "warning",
      metric: "slotTimeMs",
      title: "Slot production is slower than target",
      detail: `The recent sample averaged ${Math.round(input.network.slotTimeMs)} ms per slot.`,
      observed: input.network.slotTimeMs,
      threshold: 600,
    });
  }

  if (
    input.validators.delinquentStakePct !== null &&
    input.validators.delinquentStakePct > 1
  ) {
    add({
      id: "delinquent-stake",
      severity:
        input.validators.delinquentStakePct > 3 ? "critical" : "warning",
      metric: "delinquentStakePct",
      title: "Elevated delinquent validator stake",
      detail: `${input.validators.delinquentStakePct.toFixed(2)}% of observed validator stake is delinquent.`,
      observed: input.validators.delinquentStakePct,
      threshold: 1,
    });
  }

  const marketChecks: Array<{
    id: string;
    value: number | null;
    threshold: number;
    metric: string;
    title: string;
  }> = [
    {
      id: "sol-price-move",
      value: input.market.solChange24hPct,
      threshold: 8,
      metric: "solChange24hPct",
      title: "Large SOL price move",
    },
    {
      id: "dex-volume-move",
      value: input.market.dexChange1dPct,
      threshold: 30,
      metric: "dexChange1dPct",
      title: "Large DEX volume change",
    },
    {
      id: "tvl-move",
      value: input.market.tvlChange1dPct,
      threshold: 5,
      metric: "tvlChange1dPct",
      title: "Large TVL change",
    },
  ];

  for (const check of marketChecks) {
    if (check.value !== null && Math.abs(check.value) >= check.threshold) {
      add({
        id: check.id,
        severity:
          Math.abs(check.value) >= check.threshold * 2
            ? "critical"
            : "warning",
        metric: check.metric,
        title: check.title,
        detail: `Observed 24-hour change: ${check.value.toFixed(2)}%.`,
        observed: check.value,
        threshold: check.threshold,
      });
    }
  }

  if (input.tpsSamples.length >= 4 && input.network.totalTps !== null) {
    const baseline = input.tpsSamples.slice(1);
    const mean =
      baseline.reduce((sum, value) => sum + value, 0) / baseline.length;
    const variance =
      baseline.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      baseline.length;
    const deviation = Math.sqrt(variance);
    const zScore =
      deviation === 0 ? 0 : (input.network.totalTps - mean) / deviation;

    if (Math.abs(zScore) >= 2.5) {
      add({
        id: "tps-outlier",
        severity: Math.abs(zScore) >= 4 ? "critical" : "warning",
        metric: "totalTps",
        title: zScore < 0 ? "TPS dropped below baseline" : "TPS spiked",
        detail: `Current TPS is ${Math.abs(zScore).toFixed(1)} standard deviations from the recent baseline.`,
        observed: input.network.totalTps,
        threshold: Math.round(mean),
      });
    }
  }

  if (input.failedSourceCount > 0) {
    add({
      id: "source-degradation",
      severity: input.failedSourceCount >= 3 ? "warning" : "info",
      metric: "sources",
      title: "One or more data sources are unavailable",
      detail: `${input.failedSourceCount} collector${input.failedSourceCount === 1 ? "" : "s"} failed. Missing values remain null.`,
      observed: input.failedSourceCount,
      threshold: 0,
    });
  }

  return anomalies.sort((a, b) => {
    const rank = { critical: 0, warning: 1, info: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}
