import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.REPORT_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const outputDirectory = path.resolve(process.cwd(), "reports");

async function get(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { accept: "*/*" },
  });
  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}`);
  }
  return response;
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getHealthyReport() {
  let lastReport = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await get("/api/report?refresh=1");
    const report = await response.json();
    const availableSources = report.sources.filter(
      (source) => source.state !== "unavailable",
    ).length;
    lastReport = report;

    if (report.meta.overallState !== "unavailable" && availableSources >= 3) {
      return report;
    }

    if (attempt < 3) await wait(1_500);
  }

  if (process.env.ALLOW_DEGRADED_REPORT === "1") return lastReport;
  throw new Error(
    "Report quality gate failed after three attempts; existing snapshots were preserved",
  );
}

await mkdir(outputDirectory, { recursive: true });

const report = await getHealthyReport();
const markdownResponse = await get("/api/report?format=markdown");
const markdown = await markdownResponse.text();
const json = `${JSON.stringify(report, null, 2)}\n`;

await Promise.all([
  writeFile(path.join(outputDirectory, "latest.json"), json, "utf8"),
  writeFile(path.join(outputDirectory, "latest.md"), markdown, "utf8"),
]);

if (process.env.ARCHIVE_REPORTS === "1") {
  const archiveDirectory = path.join(outputDirectory, "archive");
  const timestamp = report.meta.generatedAt.replace(/[:.]/g, "-");
  await mkdir(archiveDirectory, { recursive: true });
  await writeFile(
    path.join(archiveDirectory, `${timestamp}.json`),
    json,
    "utf8",
  );
}

console.log(
  `Wrote reports/latest.json and reports/latest.md from ${baseUrl} (${report.meta.generatedAt})`,
);
