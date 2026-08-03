const readInteger = (
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
};

export const REPORT_REFRESH_SECONDS = readInteger(
  process.env.REPORT_REFRESH_SECONDS,
  60,
  30,
  3600,
);

export const FETCH_TIMEOUT_MS = readInteger(
  process.env.REPORT_FETCH_TIMEOUT_MS,
  12_000,
  3_000,
  30_000,
);

const configuredRpc = process.env.SOLANA_RPC_URL?.trim();

export const RPC_ENDPOINTS = Array.from(
  new Set(
    [
      configuredRpc,
      "https://api.mainnet-beta.solana.com",
      "https://solana-rpc.publicnode.com",
    ].filter((endpoint): endpoint is string => Boolean(endpoint)),
  ),
);

export const USER_AGENT =
  "SolanaPulse/1.0 (+https://github.com/superteam-canada/solana-pulse)";
