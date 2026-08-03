import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const report = JSON.parse(
  await readFile(new URL("../reports/latest.json", import.meta.url), "utf8"),
);

test("sample report exposes the versioned top-level schema", () => {
  assert.equal(report.meta.schemaVersion, "1.0");
  for (const key of [
    "network",
    "validators",
    "market",
    "ecosystem",
    "history",
    "anomalies",
    "sources",
    "limitations",
  ]) {
    assert.ok(key in report, `missing ${key}`);
  }
});

test("network and validator values satisfy basic invariants", () => {
  assert.ok(report.network.totalTps === null || report.network.totalTps >= 0);
  assert.ok(
    report.network.nonVoteTps === null ||
      report.network.nonVoteTps <= report.network.totalTps,
  );
  assert.ok(
    report.validators.delinquentStakePct === null ||
      (report.validators.delinquentStakePct >= 0 &&
        report.validators.delinquentStakePct <= 100),
  );
  assert.ok(Array.isArray(report.validators.top));
});

test("collectors publish provenance and never use fabricated defaults", () => {
  assert.ok(report.sources.length >= 5);
  for (const source of report.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(["ok", "degraded", "unavailable"].includes(source.state));
  }
  assert.equal(
    report.limitations.some((item) => item.includes("hard-coded fallback")),
    false,
  );
});
