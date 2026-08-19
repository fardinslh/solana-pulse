# Solana Ecosystem State Report

Generated: 2026-08-19T07:09:39.290Z

Overall collector state: **DEGRADED**

## Executive metrics

| Metric | Value |
| --- | ---: |
| SOL price | $76.92 |
| SOL 24h change | 1.25% |
| Solana TVL | $4.89B |
| Stablecoin supply | $15.38B |
| DEX volume, 24h | $1.82B |
| Real Economic Value, 24h | $768.31K |
| RWA TVL | $1.87B |
| Tokenized equities TVL proxy | $380.95M |

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

- **INFO: One or more data sources are unavailable.** 1 collector failed. Missing values remain null.

## Top protocols

| Protocol | Category | Solana TVL | 24h |
| --- | --- | ---: | ---: |
| [Sanctum Validator LSTs](https://www.sanctum.so) | Liquid Staking | $1.15B | 1.98% |
| [Kamino Lend](https://kamino.com/) | Lending | $1.07B | 1.12% |
| [Jupiter Lend](https://jup.ag/?ref=f6y1ryr2snn3) | Lending | $953.12M | 0.94% |
| [Raydium AMM](https://raydium.io) | Dexs | $855.4M | 1.05% |
| [Binance Staked SOL](https://www.binance.com/en/solana-staking) | Liquid Staking | $776.14M | 0.77% |
| [Jito Liquid Staking](https://jito.network) | Liquid Staking | $769.18M | 1.43% |
| [BlackRock BUIDL](https://securitize.io/) | RWA | $741.42M | 0.01% |
| [Jupiter Perpetual Exchange](https://jup.ag/?ref=f6y1ryr2snn3) | Derivatives | $685.43M | 0.64% |
| [Solstice](https://solstice.finance/) | Basis Trading | $506.2M | 0.01% |
| [Jupiter Staked SOL](https://jup.ag/?ref=f6y1ryr2snn3) | Liquid Staking | $398.45M | 1.48% |
| [xStocks](https://defi.xstocks.fi) | RWA | $380.95M | -1.46% |
| [Sentora](https://sentora.com/) | Risk Curators | $366.1M | 0.61% |
| [OnRe](https://app.onre.finance) | RWA | $269.41M | 0.68% |
| [PumpSwap](https://swap.pump.fun) | Dexs | $257.02M | 2.46% |
| [Orca DEX](https://www.orca.so) | Dexs | $241.29M | -1.49% |

## Ecosystem news

- [Transaction v1 and the ALT Trade-off](https://solana.com/news/transaction-v1-and-the-alt-trade-off) · Ecosystem · 2026-08-17
- [Solana Changelog: August 13, 2026](https://solana.com/news/solana-changelog-august-13-2026) · Ecosystem · 2026-08-13
- [How Meow Built Agentic Banking and Agent Payment Rails, with Brandon Arvanaghi](https://solana.com/news/how-meow-built-agentic-banking-and-agent-payment-rails-with-brandon-arvanaghi) · Ecosystem · 2026-08-13
- [Why Asia Is Ahead on Stablecoins, According to Reap's Daren Guo](https://solana.com/news/bits-to-bricks-asia-ahead-stablecoins-daren-guo-reap) · Ecosystem · 2026-08-12
- [MoneyGram Ramps launches on Solana](https://solana.com/news/moneygram-ramps) · Ecosystem · 2026-08-11
- [Solana Changelog: August 6, 2026](https://solana.com/news/solana-changelog-august-6-2026) · Ecosystem · 2026-08-06
- [Webinar Recap: Giving AI agents a native way to pay with x402](https://solana.com/news/webinar-recap-agentic-payments) · Ecosystem · 2026-08-05
- [Solana Ecosystem Roundup: July 2026](https://solana.com/news/solana-ecosystem-roundup-july-2026) · Ecosystem · 2026-08-05

## Upgrades

- **[SIMD-0326: Alpenglow](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0326-alpenglow.md)** · Review. Votor and Rotor redesign consensus and block propagation to target faster finality.
- **[SIMD-0525: Reduce Slot Times](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0525-reduce-slot-times.md)** · Draft. Proposes staged reductions from 400 ms slots toward a 200 ms target.

## Data sources

| Source | State | Fetched |
| --- | --- | --- |
| [Solana JSON-RPC](https://api.mainnet-beta.solana.com) | unavailable | Unavailable |
| [CoinGecko keyless API](https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true) | ok | 2026-08-19T07:09:15.360Z |
| [DeFiLlama TVL, stablecoins, volumes and fees](https://api.llama.fi/v2/historicalChainTvl/Solana) | ok | 2026-08-19T07:09:15.603Z |
| [Solana official news RSS](https://solana.com/news/rss.xml) | ok | 2026-08-19T07:09:15.607Z |
| [Solana Improvement Documents](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0326-alpenglow.md) | ok | 2026-08-19T07:09:15.607Z |

## Known limitations

- Daily active addresses require an indexed transaction dataset. Public RPC cannot calculate a full-day unique count within a low-maintenance request budget, so the report exposes sampled active signers instead.
- Automated Dune extraction and X sentiment require credentials or a licensed data feed. Both remain optional integrations and never block the keyless report.
- Tokenized equity activity uses xStocks TVL as a public proxy. Trade volume by tokenized equity requires a dedicated indexer.
- Validator commission values are current snapshots. Persistent commission-change history requires durable storage or scheduled report archives.
