# Solana Ecosystem State Report

Generated: 2026-08-18T13:12:32.848Z

Overall collector state: **DEGRADED**

## Executive metrics

| Metric | Value |
| --- | ---: |
| SOL price | $76.1 |
| SOL 24h change | 1.02% |
| Solana TVL | $4.86B |
| Stablecoin supply | $15.32B |
| DEX volume, 24h | $1.47B |
| Real Economic Value, 24h | $860.56K |
| RWA TVL | $1.88B |
| Tokenized equities TVL proxy | $384.09M |

## Network

| Metric | Value |
| --- | ---: |
| Health | unknown |
| Total TPS | Unavailable |
| Non-vote TPS | Unavailable |
| Average slot time | Unavailable |
| Slot | Unavailable |
| Block height | Unavailable |
| Epoch | Unavailable |
| Epoch progress | Unavailable |
| Median sampled transaction fee | Unavailable |

## Validators

- Active: Unavailable
- Delinquent: Unavailable
- Delinquent stake: Unavailable
- Top 10 stake concentration: Unavailable
- Validators forming one-third of active stake: Unavailable

| Rank | Vote account | Stake | Share | Commission |
| ---: | --- | ---: | ---: | ---: |

## Anomalies

- **WARNING: Large DEX volume change.** Observed 24-hour change: 39.75%.
- **INFO: One or more data sources are unavailable.** 1 collector failed. Missing values remain null.

## Top protocols

| Protocol | Category | Solana TVL | 24h |
| --- | --- | ---: | ---: |
| [Sanctum Validator LSTs](https://www.sanctum.so) | Liquid Staking | $1.14B | 0.29% |
| [Kamino Lend](https://kamino.com/) | Lending | $1.06B | 1.15% |
| [Jupiter Lend](https://jup.ag/?ref=f6y1ryr2snn3) | Lending | $947.63M | 1.19% |
| [Raydium AMM](https://raydium.io) | Dexs | $848.03M | 0.34% |
| [Binance Staked SOL](https://www.binance.com/en/solana-staking) | Liquid Staking | $770.54M | 0.21% |
| [Jito Liquid Staking](https://jito.network) | Liquid Staking | $759.49M | 0.86% |
| [BlackRock BUIDL](https://securitize.io/) | RWA | $741.35M | 0.03% |
| [Jupiter Perpetual Exchange](https://jup.ag/?ref=f6y1ryr2snn3) | Derivatives | $681.52M | 0.18% |
| [Solstice](https://solstice.finance/) | Basis Trading | $506.06M | 0.02% |
| [Jupiter Staked SOL](https://jup.ag/?ref=f6y1ryr2snn3) | Liquid Staking | $392.79M | 0.20% |
| [xStocks](https://defi.xstocks.fi) | RWA | $384.09M | 0.89% |
| [Sentora](https://sentora.com/) | Risk Curators | $367.25M | -0.43% |
| [OnRe](https://app.onre.finance) | RWA | $267.85M | 2.10% |
| [PumpSwap](https://swap.pump.fun) | Dexs | $252.7M | 0.47% |
| [Orca DEX](https://www.orca.so) | Dexs | $244.3M | 1.86% |

## Ecosystem news

- [Transaction v1 and the ALT Trade-off](https://solana.com/news/transaction-v1-and-the-alt-trade-off) · Ecosystem · 2026-08-17
- [Solana Changelog: August 13, 2026](https://solana.com/news/solana-changelog-august-13-2026) · Ecosystem · 2026-08-13
- [Why Asia Is Ahead on Stablecoins, According to Reap's Daren Guo](https://solana.com/news/bits-to-bricks-asia-ahead-stablecoins-daren-guo-reap) · Ecosystem · 2026-08-12
- [MoneyGram Ramps launches on Solana](https://solana.com/news/moneygram-ramps) · Ecosystem · 2026-08-11
- [Solana Changelog: August 6, 2026](https://solana.com/news/solana-changelog-august-6-2026) · Ecosystem · 2026-08-06
- [Webinar Recap: Giving AI agents a native way to pay with x402](https://solana.com/news/webinar-recap-agentic-payments) · Ecosystem · 2026-08-05
- [Solana Ecosystem Roundup: July 2026](https://solana.com/news/solana-ecosystem-roundup-july-2026) · Ecosystem · 2026-08-05
- [Breakpoint 2026: The Token Supercycle](https://solana.com/news/the-token-supercycle) · Ecosystem · 2026-08-04

## Upgrades

- **[SIMD-0326: Alpenglow](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0326-alpenglow.md)** · Review. Votor and Rotor redesign consensus and block propagation to target faster finality.
- **[SIMD-0525: Reduce Slot Times](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0525-reduce-slot-times.md)** · Draft. Proposes staged reductions from 400 ms slots toward a 200 ms target.

## Data sources

| Source | State | Fetched |
| --- | --- | --- |
| [Solana JSON-RPC](https://api.mainnet-beta.solana.com) | unavailable | Unavailable |
| [CoinGecko keyless API](https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true) | ok | 2026-08-18T13:12:08.937Z |
| [DeFiLlama TVL, stablecoins, volumes and fees](https://api.llama.fi/v2/historicalChainTvl/Solana) | ok | 2026-08-18T13:12:09.078Z |
| [Solana official news RSS](https://solana.com/news/rss.xml) | ok | 2026-08-18T13:12:08.921Z |
| [Solana Improvement Documents](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0326-alpenglow.md) | ok | 2026-08-18T13:12:08.968Z |

## Known limitations

- Daily active addresses require an indexed transaction dataset. Public RPC cannot calculate a full-day unique count within a low-maintenance request budget, so the report exposes sampled active signers instead.
- Automated Dune extraction and X sentiment require credentials or a licensed data feed. Both remain optional integrations and never block the keyless report.
- Tokenized equity activity uses xStocks TVL as a public proxy. Trade volume by tokenized equity requires a dedicated indexer.
- Validator commission values are current snapshots. Persistent commission-change history requires durable storage or scheduled report archives.
