"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  Clock3,
  Coins,
  Database,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Gauge,
  Landmark,
  RefreshCw,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Anomaly,
  DataSource,
  Protocol,
  SolanaReport,
} from "@/types/report";

interface DashboardProps {
  initialReport: SolanaReport;
}

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  change?: number | null;
  icon: ReactNode;
  accent: "green" | "violet" | "amber" | "cyan";
}

const compactCurrency = (value: number | null): string =>
  value === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);

const compactNumber = (value: number | null): string =>
  value === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);

const integer = (value: number | null): string =>
  value === null ? "Unavailable" : Math.round(value).toLocaleString("en-US");

const percent = (value: number | null, digits = 2): string =>
  value === null ? "Unavailable" : `${value.toFixed(digits)}%`;

const shortKey = (value: string): string =>
  `${value.slice(0, 6)}…${value.slice(-5)}`;

const dateTime = (value: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));

function Change({ value }: { value: number | null }): ReactNode {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span className={`change ${positive ? "change-up" : "change-down"}`}>
      {positive ? (
        <ArrowUpRight aria-hidden="true" />
      ) : (
        <ArrowDownRight aria-hidden="true" />
      )}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  change,
  icon,
  accent,
}: MetricCardProps): ReactNode {
  return (
    <article className={`metric-card metric-${accent}`}>
      <div className="metric-topline">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value-row">
        <strong className="metric-value">{value}</strong>
        <Change value={change ?? null} />
      </div>
      <p>{detail}</p>
    </article>
  );
}

function TvlChart({ report }: { report: SolanaReport }): ReactNode {
  const points = report.history.tvl;
  const path = useMemo(() => {
    if (points.length < 2) return "";
    const values = points.map((point) => point.tvlUsd);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const spread = maximum - minimum || 1;
    return points
      .map((point, index) => {
        const x = (index / (points.length - 1)) * 1000;
        const y = 250 - ((point.tvlUsd - minimum) / spread) * 210;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [points]);

  const start = points.at(0);
  const end = points.at(-1);

  return (
    <section className="panel chart-panel" aria-labelledby="tvl-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">90-day trajectory</span>
          <h2 id="tvl-heading">Solana TVL</h2>
        </div>
        <div className="chart-current">
          <span>Current</span>
          <strong>{compactCurrency(report.market.tvlUsd)}</strong>
        </div>
      </div>
      <div className="chart-frame">
        {path ? (
          <svg
            viewBox="0 0 1000 280"
            role="img"
            aria-label="Solana total value locked over the last 90 days"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="tvl-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#55f5b0" stopOpacity="0.33" />
                <stop offset="100%" stopColor="#55f5b0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L 1000 280 L 0 280 Z`} fill="url(#tvl-fill)" />
            <path d={path} fill="none" stroke="#55f5b0" strokeWidth="4" />
          </svg>
        ) : (
          <div className="empty-state">TVL history is unavailable.</div>
        )}
      </div>
      <div className="chart-axis">
        <span>{start?.date ?? "—"}</span>
        <span>{end?.date ?? "—"}</span>
      </div>
    </section>
  );
}

function AnomalyRail({ anomalies }: { anomalies: Anomaly[] }): ReactNode {
  if (anomalies.length === 0) {
    return (
      <div className="anomaly-rail anomaly-clear" role="status">
        <Check aria-hidden="true" />
        <strong>No threshold breaches</strong>
        <span>Network and market signals are within configured bounds.</span>
      </div>
    );
  }

  return (
    <div className="anomaly-list" aria-label="Detected anomalies">
      {anomalies.slice(0, 4).map((anomaly) => (
        <article
          className={`anomaly-rail anomaly-${anomaly.severity}`}
          key={anomaly.id}
        >
          <AlertTriangle aria-hidden="true" />
          <strong>{anomaly.title}</strong>
          <span>{anomaly.detail}</span>
        </article>
      ))}
    </div>
  );
}

function ValidatorTable({ report }: { report: SolanaReport }): ReactNode {
  return (
    <section className="panel span-2" aria-labelledby="validators-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Stake distribution</span>
          <h2 id="validators-heading">Validator control room</h2>
        </div>
        <span className="panel-badge">
          {integer(report.validators.activeCount)} active
        </span>
      </div>
      <div className="validator-summary">
        <div>
          <span>Delinquent</span>
          <strong>{integer(report.validators.delinquentCount)}</strong>
          <small>{percent(report.validators.delinquentStakePct)} stake</small>
        </div>
        <div>
          <span>Top 10 concentration</span>
          <strong>{percent(report.validators.top10StakePct)}</strong>
          <small>of active stake</small>
        </div>
        <div>
          <span>Superminority</span>
          <strong>
            {integer(report.validators.superminorityValidatorCount)}
          </strong>
          <small>validators reach 33.3%</small>
        </div>
        <div>
          <span>Weighted commission</span>
          <strong>{percent(report.validators.weightedCommissionPct)}</strong>
          <small>stake weighted</small>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Vote account</th>
              <th>Stake</th>
              <th>Share</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            {report.validators.top.map((validator, index) => (
              <tr key={validator.voteAccount}>
                <td className="rank-cell">{String(index + 1).padStart(2, "0")}</td>
                <td>
                  <a
                    href={`https://solscan.io/account/${validator.voteAccount}`}
                    target="_blank"
                    rel="noreferrer"
                    className="key-link"
                    title={validator.voteAccount}
                  >
                    {shortKey(validator.voteAccount)}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </td>
                <td>{compactNumber(validator.stakeSol)} SOL</td>
                <td>{percent(validator.stakeSharePct, 3)}</td>
                <td>
                  <span
                    className={
                      validator.commissionPct > 10
                        ? "commission-high"
                        : undefined
                    }
                  >
                    {percent(validator.commissionPct, 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProtocolList({
  protocols,
  title,
  eyebrow,
}: {
  protocols: Protocol[];
  title: string;
  eyebrow: string;
}): ReactNode {
  return (
    <section className="panel" aria-label={title}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <ol className="protocol-list">
        {protocols.slice(0, 8).map((protocol, index) => (
          <li key={protocol.name}>
            <span className="protocol-rank">{String(index + 1).padStart(2, "0")}</span>
            <span className="protocol-mark" aria-hidden="true">
              {protocol.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="protocol-name">
              <a href={protocol.url} target="_blank" rel="noreferrer">
                {protocol.name}
              </a>
              <small>{protocol.category}</small>
            </span>
            <span className="protocol-value">
              <strong>{compactCurrency(protocol.tvlUsd)}</strong>
              <Change value={protocol.change1dPct} />
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SourceGrid({ sources }: { sources: DataSource[] }): ReactNode {
  return (
    <section className="panel span-2" aria-labelledby="sources-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Audit trail</span>
          <h2 id="sources-heading">Collector status</h2>
        </div>
      </div>
      <div className="source-grid">
        {sources.map((item) => (
          <a
            className="source-card"
            href={item.url}
            target="_blank"
            rel="noreferrer"
            key={item.id}
          >
            <span className={`source-dot source-${item.state}`} />
            <span>
              <strong>{item.label}</strong>
              <small>
                {item.state} ·{" "}
                {item.latencyMs === null ? "—" : `${item.latencyMs} ms`}
              </small>
            </span>
            <ExternalLink aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard({
  initialReport,
}: DashboardProps): ReactNode {
  const initialGeneratedAt = Date.parse(initialReport.meta.generatedAt);
  const [report, setReport] = useState(initialReport);
  const [refreshSeconds, setRefreshSeconds] = useState(
    initialReport.meta.refreshIntervalSeconds,
  );
  const [nextRefreshAt, setNextRefreshAt] = useState(
    initialGeneratedAt + initialReport.meta.refreshIntervalSeconds * 1000,
  );
  const [now, setNow] = useState(initialGeneratedAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(
    async (force = false): Promise<void> => {
      setIsRefreshing(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/report${force ? "?refresh=1" : ""}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error(`Report API returned ${response.status}`);
        const nextReport = (await response.json()) as SolanaReport;
        setReport(nextReport);
        setNextRefreshAt(Date.now() + refreshSeconds * 1000);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Report refresh failed",
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [refreshSeconds],
  );

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = window.setInterval(
      () => void fetchReport(false),
      refreshSeconds * 1000,
    );
    return () => {
      window.clearInterval(clock);
      window.clearInterval(refresh);
    };
  }, [fetchReport, refreshSeconds]);

  const countdown = Math.max(0, Math.ceil((nextRefreshAt - now) / 1000));
  const epochProgress = report.network.epochProgressPct ?? 0;

  const handleInterval = (value: number): void => {
    setRefreshSeconds(value);
    setNextRefreshAt(Date.now() + value * 1000);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to report
      </a>
      <div className="ambient-grid" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#main-content" aria-label="SolanaPulse home">
          <span className="brand-mark">
            <Activity aria-hidden="true" />
          </span>
          <span>
            <strong>SolanaPulse</strong>
            <small>ECOSYSTEM INTELLIGENCE / CA</small>
          </span>
        </a>
        <div className="topbar-actions">
          <div className="live-indicator" aria-live="polite">
            <span className={`source-dot source-${report.meta.overallState}`} />
            <span>
              {report.meta.overallState.toUpperCase()} · {countdown}s
            </span>
          </div>
          <label className="refresh-select">
            <span className="sr-only">Automatic refresh interval</span>
            <select
              value={refreshSeconds}
              onChange={(event) => handleInterval(Number(event.target.value))}
            >
              <option value={60}>1 min</option>
              <option value={300}>5 min</option>
              <option value={900}>15 min</option>
            </select>
          </label>
          <button
            className="icon-button"
            type="button"
            onClick={() => void fetchReport(true)}
            disabled={isRefreshing}
            aria-label="Refresh all data sources"
            title="Refresh all data sources"
          >
            <RefreshCw
              className={isRefreshing ? "spin" : undefined}
              aria-hidden="true"
            />
          </button>
          <a
            className="export-button"
            href="/api/report?format=markdown"
            download
          >
            <Download aria-hidden="true" />
            Export
          </a>
        </div>
      </header>

      <main id="main-content" className="dashboard">
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">
              <Zap aria-hidden="true" /> MAINNET / LIVE TELEMETRY
            </span>
            <h1>
              Solana, measured
              <span>from blockspace to balance sheets.</span>
            </h1>
            <p>
              One keyless report for network performance, validator health,
              economic activity, real-world assets, ecosystem news and protocol
              upgrades.
            </p>
          </div>
          <div className="epoch-module">
            <div className="epoch-label">
              <span>Epoch {integer(report.network.epoch)}</span>
              <strong>{percent(report.network.epochProgressPct, 1)}</strong>
            </div>
            <div
              className="epoch-track"
              role="progressbar"
              aria-label="Epoch progress"
              aria-valuenow={epochProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${epochProgress}%` }} />
            </div>
            <div className="epoch-meta">
              <span>Slot {integer(report.network.slot)}</span>
              <span>{integer(report.network.slotsRemaining)} remaining</span>
            </div>
            <div className="generated-at">
              Generated {dateTime(report.meta.generatedAt)} ·{" "}
              {report.meta.buildDurationMs.toLocaleString()} ms
            </div>
          </div>
        </section>

        {error ? (
          <div className="request-error" role="alert">
            <AlertTriangle aria-hidden="true" />
            {error}. The last successful report remains visible.
          </div>
        ) : null}

        <AnomalyRail anomalies={report.anomalies} />

        <section className="metrics-grid" aria-label="Headline metrics">
          <MetricCard
            label="SOL price"
            value={compactCurrency(report.market.solPriceUsd)}
            detail={`Market cap ${compactCurrency(report.market.solMarketCapUsd)}`}
            change={report.market.solChange24hPct}
            accent="violet"
            icon={<Coins aria-hidden="true" />}
          />
          <MetricCard
            label="Total value locked"
            value={compactCurrency(report.market.tvlUsd)}
            detail="Full Solana chain TVL"
            change={report.market.tvlChange1dPct}
            accent="green"
            icon={<Landmark aria-hidden="true" />}
          />
          <MetricCard
            label="Non-vote throughput"
            value={`${integer(report.network.nonVoteTps)} TPS`}
            detail={`${integer(report.network.totalTps)} total TPS incl. votes`}
            accent="cyan"
            icon={<Gauge aria-hidden="true" />}
          />
          <MetricCard
            label="Average slot time"
            value={
              report.network.slotTimeMs === null
                ? "Unavailable"
                : `${Math.round(report.network.slotTimeMs)} ms`
            }
            detail={`Block height ${integer(report.network.blockHeight)}`}
            accent="amber"
            icon={<Clock3 aria-hidden="true" />}
          />
          <MetricCard
            label="Stablecoin supply"
            value={compactCurrency(report.market.stablecoinSupplyUsd)}
            detail="USD-pegged assets on Solana"
            accent="green"
            icon={<Database aria-hidden="true" />}
          />
          <MetricCard
            label="DEX volume / 24h"
            value={compactCurrency(report.market.dexVolume24hUsd)}
            detail="Aggregate Solana DEX volume"
            change={report.market.dexChange1dPct}
            accent="violet"
            icon={<BarChart3 aria-hidden="true" />}
          />
          <MetricCard
            label="Real Economic Value"
            value={compactCurrency(report.market.realEconomicValue24hUsd)}
            detail={`${compactCurrency(report.market.networkFees24hUsd)} network + ${compactCurrency(report.market.mevTips24hUsd)} MEV`}
            accent="amber"
            icon={<TrendingUp aria-hidden="true" />}
          />
          <MetricCard
            label="Median transaction fee"
            value={
              report.network.medianTransactionFeeLamports === null
                ? "Unavailable"
                : `${integer(report.network.medianTransactionFeeLamports)} lamports`
            }
            detail={`${integer(report.network.sampledActiveSigners)} unique signers in sampled block`}
            accent="cyan"
            icon={<Server aria-hidden="true" />}
          />
        </section>

        <div className="report-grid">
          <TvlChart report={report} />
          <section className="panel economy-panel" aria-labelledby="economy-heading">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Asset rails</span>
                <h2 id="economy-heading">Tokenized economy</h2>
              </div>
            </div>
            <div className="economy-stack">
              <div>
                <span>Real-world asset TVL</span>
                <strong>{compactCurrency(report.market.rwaTvlUsd)}</strong>
                <small>Public DeFiLlama RWA protocols on Solana</small>
              </div>
              <div>
                <span>Tokenized equities proxy</span>
                <strong>
                  {compactCurrency(report.market.tokenizedEquitiesTvlUsd)}
                </strong>
                <small>xStocks TVL; volume requires an indexer</small>
              </div>
              <div>
                <span>Ecosystem application fees</span>
                <strong>
                  {compactCurrency(report.market.ecosystemFees24hUsd)}
                </strong>
                <small>24-hour fees across tracked applications</small>
              </div>
            </div>
          </section>

          <ValidatorTable report={report} />

          <ProtocolList
            title="Protocol leaderboard"
            eyebrow="Top Solana TVL"
            protocols={report.ecosystem.topProtocols}
          />
          <ProtocolList
            title="Real-world assets"
            eyebrow="Institutional rails"
            protocols={report.ecosystem.rwaProtocols}
          />

          <section className="panel" aria-labelledby="news-heading">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Official feed</span>
                <h2 id="news-heading">Ecosystem news</h2>
              </div>
            </div>
            <div className="news-list">
              {report.ecosystem.news.slice(0, 6).map((item) => (
                <a href={item.url} target="_blank" rel="noreferrer" key={item.url}>
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                  <small>{new Date(item.publishedAt).toLocaleDateString()}</small>
                </a>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="upgrades-heading">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Protocol roadmap</span>
                <h2 id="upgrades-heading">Upgrade watch</h2>
              </div>
            </div>
            <div className="upgrade-list">
              {report.ecosystem.upgrades.map((upgrade) => (
                <a
                  href={upgrade.url}
                  target="_blank"
                  rel="noreferrer"
                  key={upgrade.id}
                >
                  <span className="upgrade-id">{upgrade.id}</span>
                  <span>
                    <strong>{upgrade.title}</strong>
                    <small>{upgrade.status}</small>
                  </span>
                  <p>{upgrade.summary}</p>
                  <ExternalLink aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>

          <SourceGrid sources={report.sources} />
        </div>

        <section className="report-access" aria-labelledby="access-heading">
          <div>
            <span className="eyebrow">Portable by design</span>
            <h2 id="access-heading">One collection pass. Three outputs.</h2>
            <p>
              The dashboard, Markdown brief and versioned JSON use the same
              normalized report. Missing data stays null and each collector
              carries its own health state.
            </p>
          </div>
          <div className="access-links">
            <a href="/api/report?format=json" target="_blank">
              <FileJson aria-hidden="true" />
              <span>
                <strong>JSON API</strong>
                <small>Machine-readable schema v1.0</small>
              </span>
            </a>
            <a href="/api/report?format=markdown" download>
              <FileText aria-hidden="true" />
              <span>
                <strong>Markdown brief</strong>
                <small>Human-readable snapshot</small>
              </span>
            </a>
          </div>
        </section>

        <details className="limitations">
          <summary>
            <ShieldCheck aria-hidden="true" />
            Methodology and known limitations
          </summary>
          <ul>
            {report.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </main>

      <footer>
        <span>SolanaPulse / Superteam Canada</span>
        <span>
          <Users aria-hidden="true" /> Keyless public-data pipeline
        </span>
      </footer>
    </div>
  );
}
