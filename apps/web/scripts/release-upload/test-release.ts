// A small, valid release folder built in memory, for the upload command's tests.
import type { LocalFile } from "./plan.js";
import { sha256Hex } from "./plan.js";

export function fakeRelease(): LocalFile[] {
  const points = Uint8Array.from({ length: 25 }, (_, i) => i);
  const proteins = new TextEncoder().encode('{"rows":[]}\n');
  const pointsName = `points.${sha256Hex(points).slice(0, 16)}.bin`;
  const proteinsName = `proteins.${sha256Hex(proteins).slice(0, 16)}.json`;
  const manifest = {
    categories: [{ id: "enzyme", label: "Enzyme" }],
    files: {
      points: {
        bytes: points.byteLength,
        format: "points/0",
        path: pointsName,
        sha256: sha256Hex(points),
      },
      proteins: {
        bytes: proteins.byteLength,
        format: "protein-index/0",
        path: proteinsName,
        sha256: sha256Hex(proteins),
      },
    },
    format: "release/0",
    release: "sample-v1",
    row_count: 1,
    sample: true,
    sample_notice: "Sample data.",
  };
  return [
    { name: "manifest.json", bytes: new TextEncoder().encode(JSON.stringify(manifest)) },
    { name: proteinsName, bytes: proteins },
    { name: pointsName, bytes: points },
  ];
}
