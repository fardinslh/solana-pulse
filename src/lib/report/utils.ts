import { FETCH_TIMEOUT_MS, USER_AGENT } from "./config";

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const asString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

export const round = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const percentChange = (
  current: number | null,
  previous: number | null,
): number | null => {
  if (current === null || previous === null || previous === 0) return null;
  return round(((current - previous) / previous) * 100);
};

export const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

export const standardDeviation = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    values.length;
  return Math.sqrt(variance);
};

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "user-agent": USER_AGENT,
      ...init.headers,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
  }

  return (await response.json()) as T;
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      accept: "text/plain, application/xml, text/xml",
      "user-agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
  }

  return response.text();
}

export const cleanError = (error: unknown): string =>
  error instanceof Error ? error.message.slice(0, 180) : "Unknown error";
