import { copyFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const bundleDirectory = join(projectRoot, ".sites-build");
const bundledWorker = join(bundleDirectory, "worker.js");
const deploymentWorker = join(projectRoot, ".open-next", "worker.js");

if (!existsSync(bundledWorker)) {
  throw new Error("Wrangler did not produce .sites-build/worker.js");
}

copyFileSync(bundledWorker, deploymentWorker);
rmSync(bundleDirectory, { recursive: true, force: true });

console.log("Sites deployment worker finalized.");
