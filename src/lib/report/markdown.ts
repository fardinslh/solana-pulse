import type { SolanaReport } from "@/types/report";

const currency = (value: number | null): string =>
  value === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);

const number = (value: number | null): string =>
  value === null ? "Unavailable" : value.toLocaleString("en-US");

const percent = (value: number | null): string =>
  value === null ? "Unavailable" : `${value.toFixed(2)}%`;

const escapeCell = (value: string): string => value.replace(/\|/g, "\\|");

export function reportToMarkdown(report: SolanaReport): string {
  const lines = [
    "# Solana Ecosystem State Report",
    "",
    `Generated: ${report.meta.generatedAt}`,
    "",
    `Overall collector state: **${report.meta.overallState.toUpperCase()}**`,
    "",
    "## Executive metrics",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| SOL price | ${currency(report.market.solPriceUsd)} |`,
    `| SOL 24h change | ${percent(report.market.solChange24hPct)} |`,
    `| Solana TVL | ${currency(report.market.tvlUsd)} |`,
    `| Stablecoin supply | ${currency(report.market.stablecoinSupplyUsd)} |`,
    `| DEX volume, 24h | ${currency(report.market.dexVolume24hUsd)} |`,
    `| Real Economic Value, 24h | ${currency(report.market.realEconomicValue24hUsd)} |`,
    `| RWA TVL | ${currency(report.market.rwaTvlUsd)} |`,
    `| Tokenized equities TVL proxy | ${currency(report.market.tokenizedEquitiesTvlUsd)} |`,
    "",
    "## Network",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Health | ${report.network.health} |`,
    `| Total TPS | ${number(report.network.totalTps)} |`,
    `| Non-vote TPS | ${number(report.network.nonVoteTps)} |`,
    `| Average slot time | ${report.network.slotTimeMs === null ? "Unavailable" : `${report.network.slotTimeMs.toFixed(0)} ms`} |`,
    `| Slot | ${number(report.network.slot)} |`,
    `| Block height | ${number(report.network.blockHeight)} |`,
    `| Epoch | ${number(report.network.epoch)} |`,
    `| Epoch progress | ${percent(report.network.epochProgressPct)} |`,
    `| Median sampled transaction fee | ${report.network.medianTransactionFeeLamports === null ? "Unavailable" : `${number(report.network.medianTransactionFeeLamports)} lamports`} |`,
    "",
    "## Validators",
    "",
    `- Active: ${number(report.validators.activeCount)}`,
    `- Delinquent: ${number(report.validators.delinquentCount)}`,
    `- Delinquent stake: ${percent(report.validators.delinquentStakePct)}`,
    `- Top 10 stake concentration: ${percent(report.validators.top10StakePct)}`,
    `- Validators forming one-third of active stake: ${number(report.validators.superminorityValidatorCount)}`,
    "",
    "| Rank | Vote account | Stake | Share | Commission |",
    "| ---: | --- | ---: | ---: | ---: |",
    ...report.validators.top.map(
      (validator, index) =>
        `| ${index + 1} | \`${validator.voteAccount}\` | ${number(validator.stakeSol)} SOL | ${percent(validator.stakeSharePct)} | ${percent(validator.commissionPct)} |`,
    ),
    "",
    "## Anomalies",
    "",
    ...(report.anomalies.length === 0
      ? ["No configured anomaly threshold was breached."]
      : report.anomalies.map(
          (item) =>
            `- **${item.severity.toUpperCase()}: ${item.title}.** ${item.detail}`,
        )),
    "",
    "## Top protocols",
    "",
    "| Protocol | Category | Solana TVL | 24h |",
    "| --- | --- | ---: | ---: |",
    ...report.ecosystem.topProtocols.map(
      (protocol) =>
        `| [${escapeCell(protocol.name)}](${protocol.url}) | ${escapeCell(protocol.category)} | ${currency(protocol.tvlUsd)} | ${percent(protocol.change1dPct)} |`,
    ),
    "",
    "## Ecosystem news",
    "",
    ...report.ecosystem.news.map(
      (item) =>
        `- [${item.title}](${item.url}) · ${item.category} · ${item.publishedAt.slice(0, 10)}`,
    ),
    "",
    "## Upgrades",
    "",
    ...report.ecosystem.upgrades.map(
      (upgrade) =>
        `- **[${upgrade.id}: ${upgrade.title}](${upgrade.url})** · ${upgrade.status}. ${upgrade.summary}`,
    ),
    "",
    "## Data sources",
    "",
    "| Source | State | Fetched |",
    "| --- | --- | --- |",
    ...report.sources.map(
      (item) =>
        `| [${item.label}](${item.url}) | ${item.state} | ${item.fetchedAt ?? "Unavailable"} |`,
    ),
    "",
    "## Known limitations",
    "",
    ...report.limitations.map((item) => `- ${item}`),
    "",
  ];

  return lines.join("\n");
}
