# SolanaPulse

SolanaPulse produces an automatically updating report on Solana network health, validator distribution, economic activity, real-world assets, ecosystem news, and protocol upgrades. One server-side collection pass feeds three outputs:

- A responsive dark dashboard
- A human-readable Markdown report
- A versioned JSON report

The default pipeline uses public endpoints and needs no API keys.

## What the report covers

| Area | Metrics |
| --- | --- |
| Network | Cluster health, total and non-vote TPS, average slot time, slot, block height, transaction count, epoch progress, median sampled transaction fee, median priority fee, supply |
| Validators | Active and delinquent counts, delinquent stake, active stake, top-10 concentration, superminority count, weighted commission, top validators |
| Markets | SOL price and 24-hour change, market cap, volume, chain TVL, stablecoin supply, aggregate DEX volume |
| Economics | Network fees, Jito MEV tips, Real Economic Value, application fees |
| Growth | RWA TVL, xStocks TVL as a tokenized-equities proxy, top Solana protocols |
| Intelligence | Official Solana news and live SIMD metadata for Alpenglow and shorter slot times |
| Monitoring | TPS outliers, slow slots, delinquent stake, SOL moves, DEX volume moves, TVL moves, collector failures |

Missing data remains `null`. The UI never presents a hard-coded placeholder as live data.

## Data flow

```text
Solana RPC ───────────────┐
CoinGecko / Dexscreener ──┤
DeFiLlama ────────────────┼─> normalized SolanaReport ─> dashboard
Solana News RSS ──────────┤                         ├─> JSON
SIMD repository ──────────┘                         └─> Markdown
```

The browser requests only `/api/report`. External collection runs on the Next.js server, where the report cache prevents each visitor from polling every upstream source.

## Data sources

| Source | Integration |
| --- | --- |
| [Solana JSON-RPC](https://solana.com/docs/rpc) | Batched `getHealth`, `getSlot`, `getBlockHeight`, `getEpochInfo`, `getRecentPerformanceSamples`, `getVoteAccounts`, `getSupply`, and `getRecentPrioritizationFees` calls. A recent finalized block supplies the median transaction fee and sampled unique signers. |
| [CoinGecko keyless API](https://docs.coingecko.com/docs/keyless-public-api) | SOL price, market cap, volume, and 24-hour change. Dexscreener serves as a labeled fallback. |
| [DeFiLlama](https://defillama.com/docs/api) | Chain TVL history, protocol TVL, stablecoin supply, DEX volume, application fees, network fees, Jito tips, and RWA protocols. |
| [Solana News RSS](https://solana.com/news/rss.xml) | Current official ecosystem and developer news. |
| [Solana Improvement Documents](https://github.com/solana-foundation/solana-improvement-documents) | Current front-matter status for SIMD-0326 and SIMD-0525. |

### Metric definitions

- **Total TPS** includes vote transactions. **Non-vote TPS** reports user-facing transaction throughput from the same RPC performance sample.
- **Slot time** divides the RPC performance-sample duration by its produced slots.
- **Real Economic Value** equals Solana transaction fees plus Jito MEV tips over 24 hours. The dashboard shows both components.
- **Solana TVL** comes from the chain-level DeFiLlama value. It does not sum a truncated protocol table.
- **Median transaction fee** comes from all transactions in one recent finalized block. The JSON field name includes `sampled` where the scope matters.
- **RWA TVL** sums public RWA protocol values on Solana. **Tokenized equities TVL** uses xStocks as a transparent proxy.

## Run locally

Requirements:

- Node.js 20.9 or newer
- npm

```bash
git clone git@github.com:fardinslh/solana-pulse.git
cd solana-pulse
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

All configuration is optional:

| Variable | Default | Purpose |
| --- | ---: | --- |
| `SOLANA_RPC_URL` | Public mainnet endpoints | Places a dedicated endpoint first in the fallback chain |
| `REPORT_REFRESH_SECONDS` | `60` | Server cache duration and initial UI refresh interval |
| `REPORT_FETCH_TIMEOUT_MS` | `12000` | Upstream request timeout |

## Report endpoints

| Output | URL |
| --- | --- |
| Interactive dashboard | `/` |
| JSON | `/api/report` |
| Forced JSON refresh | `/api/report?refresh=1` |
| Markdown download | `/api/report?format=markdown` |

The JSON schema starts at `meta.schemaVersion`. Collector provenance lives in `sources`, and collection caveats live in `limitations`.

## Generate report files

Start the production server, then run the generator:

```bash
npm run build
npm start
```

In another terminal:

```bash
npm run report
```

The generator writes:

- [`reports/latest.json`](reports/latest.json)
- [`reports/latest.md`](reports/latest.md)

Set `REPORT_BASE_URL` to generate snapshots from a deployed instance. Set `ARCHIVE_REPORTS=1` to retain a timestamped JSON snapshot for validator commission and metric history.

## Automation

The dashboard refreshes at a user-selected interval while open. The server caches the normalized report for `REPORT_REFRESH_SECONDS`.

The scheduled GitHub Action in [`.github/workflows/refresh-report.yml`](.github/workflows/refresh-report.yml) runs every six hours. It builds the application, starts the report server, generates Markdown and JSON files, archives the JSON snapshot, and commits changed reports. The generator retries transient collector failures and preserves the previous snapshots when fewer than three sources remain available. The workflow uses only public endpoints.

The CI workflow runs lint, TypeScript, report tests, and the production build on pushes and pull requests.

## Anomaly detection

Rules run after normalization:

| Signal | Warning threshold | Critical threshold |
| --- | ---: | ---: |
| Average slot time | Over 600 ms | Over 800 ms |
| Delinquent stake | Over 1% | Over 3% |
| SOL 24h move | At least 8% | At least 16% |
| DEX volume 24h move | At least 30% | At least 60% |
| TVL daily move | At least 5% | At least 10% |
| TPS | 2.5 standard deviations from recent samples | 4 standard deviations |

Collector failures create a provenance alert. Failed metrics stay null.

## Known limits

Public RPC cannot calculate exact daily active addresses without scanning and indexing a full day of transactions. SolanaPulse reports unique signers from its sampled block and labels the sample.

Dune API extraction and X sentiment need credentials or a licensed feed. The keyless build documents these gaps and keeps the rest of the report operational. You can add authenticated collectors without changing the public JSON schema.

Tokenized equity TVL is available through xStocks. Per-asset equity trading volume needs an indexed trade dataset.

## Deploy

Vercel can deploy the project without configuration:

1. Import the public GitHub repository.
2. Keep the default Next.js build settings.
3. Add `SOLANA_RPC_URL` only if you want a dedicated RPC provider.
4. Deploy and test `/api/report`.

Any Node-compatible host can run `npm run build && npm start`. Upstream services must be reachable over HTTPS.

## Validation

```bash
npm run check
```

This command runs ESLint, TypeScript, report-schema tests, and the production build.

## License

[MIT](LICENSE)
