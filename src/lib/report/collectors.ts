import type {
  DataSource,
  NewsItem,
  Protocol,
  TvlPoint,
  Upgrade,
} from "@/types/report";
import {
  asNumber,
  asString,
  cleanError,
  fetchJson,
  fetchText,
  isRecord,
  percentChange,
  round,
} from "./utils";

export interface CollectorResult<T> {
  data: T | null;
  source: DataSource;
}

interface PriceData {
  priceUsd: number;
  change24hPct: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
}

interface DefiData {
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
  topProtocols: Protocol[];
  rwaProtocols: Protocol[];
  tvlHistory: TvlPoint[];
}

const source = (
  id: string,
  label: string,
  url: string,
  startedAt: number,
  error: unknown = null,
): DataSource => ({
  id,
  label,
  url,
  state: error === null ? "ok" : "unavailable",
  fetchedAt: error === null ? new Date().toISOString() : null,
  latencyMs: Date.now() - startedAt,
  error: error === null ? null : cleanError(error),
});

export async function collectPrice(): Promise<CollectorResult<PriceData>> {
  const coingeckoUrl =
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true";
  const startedAt = Date.now();

  try {
    const payload = await fetchJson<unknown>(coingeckoUrl);
    if (!isRecord(payload) || !isRecord(payload.solana)) {
      throw new Error("CoinGecko returned an unexpected response");
    }

    const price = asNumber(payload.solana.usd);
    if (price === null) throw new Error("CoinGecko omitted the SOL price");

    return {
      data: {
        priceUsd: price,
        change24hPct: asNumber(payload.solana.usd_24h_change),
        marketCapUsd: asNumber(payload.solana.usd_market_cap),
        volume24hUsd: asNumber(payload.solana.usd_24h_vol),
      },
      source: source(
        "coingecko",
        "CoinGecko keyless API",
        coingeckoUrl,
        startedAt,
      ),
    };
  } catch (coingeckoError) {
    const dexUrl =
      "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112";
    try {
      const payload = await fetchJson<unknown>(dexUrl);
      if (!isRecord(payload) || !Array.isArray(payload.pairs)) {
        throw new Error("Dexscreener returned an unexpected response");
      }
      const pair = payload.pairs.find(
        (item) =>
          isRecord(item) &&
          isRecord(item.quoteToken) &&
          ["USDC", "USDT"].includes(asString(item.quoteToken.symbol) ?? ""),
      );
      if (!isRecord(pair)) throw new Error("No liquid SOL/USD pair found");

      const price = Number.parseFloat(asString(pair.priceUsd) ?? "");
      if (!Number.isFinite(price)) throw new Error("Dexscreener omitted price");

      return {
        data: {
          priceUsd: price,
          change24hPct: isRecord(pair.priceChange)
            ? asNumber(pair.priceChange.h24)
            : null,
          marketCapUsd: asNumber(pair.marketCap),
          volume24hUsd: isRecord(pair.volume)
            ? asNumber(pair.volume.h24)
            : null,
        },
        source: {
          ...source(
            "coingecko",
            "CoinGecko with Dexscreener fallback",
            dexUrl,
            startedAt,
          ),
          state: "degraded",
          error: `CoinGecko failed; using Dexscreener: ${cleanError(coingeckoError)}`,
        },
      };
    } catch (fallbackError) {
      return {
        data: null,
        source: source(
          "coingecko",
          "CoinGecko with Dexscreener fallback",
          coingeckoUrl,
          startedAt,
          fallbackError,
        ),
      };
    }
  }
}

const protocolFromUnknown = (value: unknown): Protocol | null => {
  if (!isRecord(value)) return null;
  const name = asString(value.name);
  const category = asString(value.category) ?? "Other";
  const url = asString(value.url) ?? "#";
  const chainTvls = isRecord(value.chainTvls) ? value.chainTvls : null;
  const tvl = chainTvls ? asNumber(chainTvls.Solana) : null;
  if (!name || tvl === null || tvl <= 0) return null;
  return {
    name,
    category,
    tvlUsd: tvl,
    change1dPct: asNumber(value.change_1d),
    change7dPct: asNumber(value.change_7d),
    url,
  };
};

const dataTypeUrl = (type: "dexs" | "fees", dataType: string): string =>
  `https://api.llama.fi/overview/${type}/Solana?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=${dataType}`;

export async function collectDefi(): Promise<CollectorResult<DefiData>> {
  const primaryUrl = "https://api.llama.fi/v2/historicalChainTvl/Solana";
  const startedAt = Date.now();

  try {
    const [historyRaw, chainsRaw, protocolsRaw, dexRaw, feesRaw, stablesRaw] =
      await Promise.all([
        fetchJson<unknown>(primaryUrl),
        fetchJson<unknown>("https://api.llama.fi/v2/chains"),
        fetchJson<unknown>("https://api.llama.fi/protocols"),
        fetchJson<unknown>(dataTypeUrl("dexs", "dailyVolume")),
        fetchJson<unknown>(dataTypeUrl("fees", "dailyFees")),
        fetchJson<unknown>("https://stablecoins.llama.fi/stablecoinchains"),
      ]);

    const history = Array.isArray(historyRaw)
      ? historyRaw
          .map((item): TvlPoint | null => {
            if (!isRecord(item)) return null;
            const timestamp = asNumber(item.date);
            const tvlUsd = asNumber(item.tvl);
            if (timestamp === null || tvlUsd === null) return null;
            return {
              timestamp,
              date: new Date(timestamp * 1000).toISOString().slice(0, 10),
              tvlUsd,
            };
          })
          .filter((item): item is TvlPoint => item !== null)
          .slice(-90)
      : [];

    const currentChain = Array.isArray(chainsRaw)
      ? chainsRaw.find(
          (item) => isRecord(item) && asString(item.name) === "Solana",
        )
      : null;
    const currentTvl = isRecord(currentChain)
      ? asNumber(currentChain.tvl)
      : history.at(-1)?.tvlUsd ?? null;

    const protocols = Array.isArray(protocolsRaw)
      ? protocolsRaw
          .map(protocolFromUnknown)
          .filter((item): item is Protocol => item !== null)
      : [];
    const topProtocols = protocols
      .filter((item) => item.category !== "CEX")
      .sort((a, b) => b.tvlUsd - a.tvlUsd)
      .slice(0, 15);
    const allRwaProtocols = protocols
      .filter((item) => item.category === "RWA")
      .sort((a, b) => b.tvlUsd - a.tvlUsd);
    const rwaProtocols = allRwaProtocols.slice(0, 12);

    const stableChain = Array.isArray(stablesRaw)
      ? stablesRaw.find(
          (item) => isRecord(item) && asString(item.name) === "Solana",
        )
      : null;
    const stablecoinSupplyUsd =
      isRecord(stableChain) && isRecord(stableChain.totalCirculatingUSD)
        ? asNumber(stableChain.totalCirculatingUSD.peggedUSD)
        : null;

    const dex = isRecord(dexRaw) ? dexRaw : {};
    const fees = isRecord(feesRaw) ? feesRaw : {};
    const feeProtocols = Array.isArray(fees.protocols)
      ? fees.protocols.filter(isRecord)
      : [];
    const networkFees =
      feeProtocols.find((item) => asString(item.name) === "Solana") ?? null;
    const mevTips =
      feeProtocols.find((item) => asString(item.name) === "Jito MEV Tips") ??
      null;
    const networkFees24hUsd = isRecord(networkFees)
      ? asNumber(networkFees.total24h)
      : null;
    const mevTips24hUsd = isRecord(mevTips)
      ? asNumber(mevTips.total24h)
      : null;
    const realEconomicValue24hUsd =
      networkFees24hUsd === null && mevTips24hUsd === null
        ? null
        : (networkFees24hUsd ?? 0) + (mevTips24hUsd ?? 0);
    const rwaTvlUsd = allRwaProtocols.reduce(
      (sum, protocol) => sum + protocol.tvlUsd,
      0,
    );
    const tokenizedEquitiesTvlUsd =
      allRwaProtocols.find((protocol) => protocol.name === "xStocks")
        ?.tvlUsd ?? null;

    return {
      data: {
        tvlUsd: currentTvl,
        tvlChange1dPct: percentChange(
          history.at(-1)?.tvlUsd ?? null,
          history.at(-2)?.tvlUsd ?? null,
        ),
        stablecoinSupplyUsd,
        dexVolume24hUsd: asNumber(dex.total24h),
        dexChange1dPct: asNumber(dex.change_1d),
        ecosystemFees24hUsd: asNumber(fees.total24h),
        networkFees24hUsd,
        mevTips24hUsd,
        realEconomicValue24hUsd,
        rwaTvlUsd: round(rwaTvlUsd),
        tokenizedEquitiesTvlUsd,
        topProtocols,
        rwaProtocols,
        tvlHistory: history,
      },
      source: source(
        "defillama",
        "DeFiLlama TVL, stablecoins, volumes and fees",
        primaryUrl,
        startedAt,
      ),
    };
  } catch (error) {
    return {
      data: null,
      source: source(
        "defillama",
        "DeFiLlama TVL, stablecoins, volumes and fees",
        primaryUrl,
        startedAt,
        error,
      ),
    };
  }
}

const decodeXml = (value: string): string =>
  value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const xmlValue = (item: string, tag: string): string | null => {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1]) : null;
};

export async function collectNews(): Promise<CollectorResult<NewsItem[]>> {
  const url = "https://solana.com/news/rss.xml";
  const startedAt = Date.now();
  try {
    const xml = await fetchText(url);
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map((match): NewsItem | null => {
        const title = xmlValue(match[1], "title");
        const link = xmlValue(match[1], "link");
        const published = xmlValue(match[1], "pubDate");
        const category = xmlValue(match[1], "category") ?? "Ecosystem";
        if (!title || !link || !published) return null;
        return {
          title,
          url: link,
          publishedAt: new Date(published).toISOString(),
          category,
        };
      })
      .filter((item): item is NewsItem => item !== null)
      .slice(0, 8);

    if (items.length === 0) throw new Error("The RSS feed contained no items");
    return {
      data: items,
      source: source("solana-news", "Solana official news RSS", url, startedAt),
    };
  } catch (error) {
    return {
      data: null,
      source: source(
        "solana-news",
        "Solana official news RSS",
        url,
        startedAt,
        error,
      ),
    };
  }
}

interface UpgradeDefinition {
  id: string;
  fallbackTitle: string;
  summary: string;
  rawUrl: string;
  pageUrl: string;
}

const upgradeDefinitions: UpgradeDefinition[] = [
  {
    id: "SIMD-0326",
    fallbackTitle: "Alpenglow consensus",
    summary:
      "Votor and Rotor redesign consensus and block propagation to target faster finality.",
    rawUrl:
      "https://raw.githubusercontent.com/solana-foundation/solana-improvement-documents/main/proposals/0326-alpenglow.md",
    pageUrl:
      "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0326-alpenglow.md",
  },
  {
    id: "SIMD-0525",
    fallbackTitle: "Reduce slot times",
    summary:
      "Proposes staged reductions from 400 ms slots toward a 200 ms target.",
    rawUrl:
      "https://raw.githubusercontent.com/solana-foundation/solana-improvement-documents/main/proposals/0525-reduce-slot-times.md",
    pageUrl:
      "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0525-reduce-slot-times.md",
  },
];

const frontMatter = (markdown: string, key: string): string | null => {
  const header = markdown.split("---", 3)[1] ?? "";
  const match = header.match(new RegExp(`^${key}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? null;
};

export async function collectUpgrades(): Promise<CollectorResult<Upgrade[]>> {
  const startedAt = Date.now();
  try {
    const upgrades = await Promise.all(
      upgradeDefinitions.map(async (definition): Promise<Upgrade> => {
        const markdown = await fetchText(definition.rawUrl);
        return {
          id: definition.id,
          title: frontMatter(markdown, "title") ?? definition.fallbackTitle,
          status: frontMatter(markdown, "status") ?? "Tracked",
          summary: definition.summary,
          url: definition.pageUrl,
          updatedAt:
            frontMatter(markdown, "updated") ??
            frontMatter(markdown, "created") ??
            null,
        };
      }),
    );
    return {
      data: upgrades,
      source: source(
        "simd",
        "Solana Improvement Documents",
        upgradeDefinitions[0].pageUrl,
        startedAt,
      ),
    };
  } catch (error) {
    return {
      data: null,
      source: source(
        "simd",
        "Solana Improvement Documents",
        upgradeDefinitions[0].pageUrl,
        startedAt,
        error,
      ),
    };
  }
}
