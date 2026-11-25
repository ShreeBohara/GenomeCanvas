// Runs Lighthouse three times against the built site served locally (vite
// preview: the static assets, the Worker and its local R2), prints each run's
// scores and the spread, and fails on the thresholds in work order 1C.
//
//   node run.mjs [url]
//
// Chrome is the one found by chrome-launcher (CHROME_PATH, or the system
// Chrome; GitHub's Ubuntu runners have one). WebGL comes from SwiftShader, as
// in the end-to-end tests, because CI has no GPU.
import { mkdirSync, writeFileSync } from "node:fs";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const url = process.argv[2] ?? "http://localhost:4173/";
const RUNS = 3;
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

// Fail below these, on the worst of the three runs.
const FAIL_BELOW = { accessibility: 95, "best-practices": 90 };
// Performance only warns. On GitHub's runners, under software rendering, three
// runs of the same build scored 56, 76 and 77, and 55, 71 and 73 (step 1C,
// before the warm-up run was added): a spread of about 20 points that comes
// from the machine, not the code. A failing threshold would fail at random.
// Phase 4 makes it a failing budget of 90 on a protein page (plan section 7),
// measured where rendering is stable.
const WARN_BELOW = { performance: 90 };

const chromeFlags = [
  "--headless=new",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  // Ubuntu 24.04 runners forbid the unprivileged namespaces Chrome's sandbox uses.
  ...(process.env.CI ? ["--no-sandbox"] : []),
];

mkdirSync("reports", { recursive: true });
const runs = [];
let chromeVersion = "unknown";
// Run 0 is a warm-up and is thrown away: the first page load after the preview
// server starts also pays for workerd's start-up, which no visitor of a
// deployed site pays. Each measured run still gets a cold browser.
for (let i = 0; i <= RUNS; i++) {
  // A fresh browser and profile for every run, so no run warms another's cache.
  const chrome = await chromeLauncher.launch({ chromeFlags });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: CATEGORIES,
    });
    if (result === undefined) throw new Error("Lighthouse returned no result");
    const { lhr, report } = result;
    if (lhr.runtimeError) throw new Error(`Lighthouse: ${lhr.runtimeError.message}`);
    chromeVersion = lhr.environment.hostUserAgent;
    if (i === 0) {
      console.log(
        `Warm-up run, not counted: performance ${Math.round((lhr.categories.performance?.score ?? 0) * 100)}`,
      );
      continue;
    }
    writeFileSync(`reports/run-${i}.json`, Array.isArray(report) ? report[0] : report);
    const scores = Object.fromEntries(
      CATEGORIES.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)]),
    );
    runs.push(scores);
  } finally {
    await chrome.kill();
  }
}

const header = ["Category", ...runs.map((_, i) => `Run ${i + 1}`), "Min", "Max", "Spread"];
const rows = CATEGORIES.map((c) => {
  const values = runs.map((r) => r[c]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return [c, ...values, min, max, max - min];
});
const table = [header, header.map(() => "---"), ...rows].map((r) => `| ${r.join(" | ")} |`);
console.log(`Lighthouse ${RUNS} runs against ${url}\nBrowser: ${chromeVersion}\n`);
console.log(table.join("\n"));

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) {
  writeFileSync(summary, `### Lighthouse, ${RUNS} runs\n\n${table.join("\n")}\n`, { flag: "a" });
}
writeFileSync("reports/summary.json", `${JSON.stringify({ url, runs }, null, 2)}\n`);

let failed = false;
for (const [category, threshold] of Object.entries(FAIL_BELOW)) {
  const worst = Math.min(...runs.map((r) => r[category]));
  if (worst < threshold) {
    console.error(`FAIL: ${category} ${worst} is below ${threshold}`);
    failed = true;
  }
}
for (const [category, threshold] of Object.entries(WARN_BELOW)) {
  const worst = Math.min(...runs.map((r) => r[category]));
  if (worst < threshold) {
    const message = `${category} ${worst} is below ${threshold} (a warning, not a failure)`;
    console.log(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `WARNING: ${message}`);
  }
}
process.exitCode = failed ? 1 : 0;
