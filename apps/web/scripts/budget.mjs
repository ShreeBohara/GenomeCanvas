// Prints every JavaScript chunk of the web build with its compressed size, and
// fails if the shell's first-load JavaScript is over budget.
//
// First load is the entry chunk and every chunk it imports statically, followed
// through Vite's manifest. Chunks reached only through import() load later; the
// engine (three.js) is one of them, and the plan budgets it separately.
import { readFileSync } from "node:fs";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

// 150 KB compressed (plan, Phase 1). KB here is 1,000 bytes, the stricter reading.
const BUDGET_BYTES = 150_000;
const CLIENT = new URL("../dist/client/", import.meta.url);

const manifest = JSON.parse(readFileSync(new URL(".vite/manifest.json", CLIENT), "utf8"));
const entries = Object.entries(manifest).filter(([, chunk]) => chunk.isEntry);
if (entries.length !== 1) throw new Error(`expected one entry chunk, found ${entries.length}`);

const firstLoad = new Set();
const visit = (key) => {
  if (firstLoad.has(key)) return;
  firstLoad.add(key);
  for (const next of manifest[key].imports ?? []) visit(next);
};
visit(entries[0][0]);

const rows = Object.entries(manifest)
  .filter(([, chunk]) => chunk.file.endsWith(".js"))
  .map(([key, chunk]) => {
    const bytes = readFileSync(new URL(chunk.file, CLIENT));
    return {
      file: chunk.file,
      source: chunk.name ?? key,
      when: firstLoad.has(key) ? "first load" : "later",
      raw: bytes.length,
      gzip: gzipSync(bytes, { level: 9 }).length,
      brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } })
        .length,
    };
  })
  .sort((a, b) => (a.when === b.when ? b.gzip - a.gzip : a.when === "first load" ? -1 : 1));

const kb = (n) => `${(n / 1000).toFixed(1)} KB`;
const table = [
  ["Chunk", "From", "Loads", "Raw", "gzip", "brotli"],
  ...rows.map((r) => [r.file, r.source, r.when, kb(r.raw), kb(r.gzip), kb(r.brotli)]),
];
const widths = table[0].map((_, i) => Math.max(...table.map((row) => row[i].length)));
for (const row of table) console.log(row.map((cell, i) => cell.padEnd(widths[i])).join("  "));

const total = rows.filter((r) => r.when === "first load").reduce((sum, r) => sum + r.gzip, 0);
const verdict = total <= BUDGET_BYTES ? "within" : "OVER";
console.log(
  `\nFirst-load JavaScript: ${kb(total)} gzip, ${verdict} the ${kb(BUDGET_BYTES)} budget.`,
);
if (total > BUDGET_BYTES) process.exit(1);
