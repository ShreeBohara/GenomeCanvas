// Builders for tests only: a points file and a release served by a fake fetch.
import { createHash } from "node:crypto";

export function encodePoints(
  rows: readonly (readonly [number, number, number])[],
  overrides: { magic?: string; version?: number; count?: number } = {},
): ArrayBuffer {
  const n = rows.length;
  const buffer = new ArrayBuffer(16 + 9 * n);
  const view = new DataView(buffer);
  const magic = overrides.magic ?? "GCPT";
  for (let i = 0; i < 4; i++) view.setUint8(i, magic.charCodeAt(i));
  view.setUint16(4, overrides.version ?? 0, true);
  view.setUint16(6, 16, true);
  view.setUint32(8, overrides.count ?? n, true);
  rows.forEach(([x, y, c], i) => {
    view.setFloat32(16 + 4 * i, x, true);
    view.setFloat32(16 + 4 * n + 4 * i, y, true);
    view.setUint8(16 + 8 * n + i, c);
  });
  return buffer;
}

export function sha256(data: ArrayBuffer | Uint8Array): string {
  return createHash("sha256")
    .update(new Uint8Array(data instanceof Uint8Array ? data : new Uint8Array(data)))
    .digest("hex");
}

export interface FakeRelease {
  readonly files: Map<string, Uint8Array>;
  readonly manifest: Record<string, unknown>;
}

export function fakeRelease(): FakeRelease {
  const points = new Uint8Array(
    encodePoints([
      [1.5, -2, 0],
      [0.25, 4, 1],
    ]),
  );
  const index = new TextEncoder().encode(
    JSON.stringify({
      format: "protein-index/0",
      rows: [
        {
          accession: "P38398",
          category: "dna_repair",
          gene_symbol: "BRCA1",
          name: "Breast cancer type 1 susceptibility protein",
        },
        {
          accession: "P04637",
          category: "signaling",
          gene_symbol: "TP53",
          name: "Cellular tumor antigen p53",
        },
      ],
    }),
  );
  const pointsPath = `points.${sha256(points).slice(0, 16)}.bin`;
  const indexPath = `proteins.${sha256(index).slice(0, 16)}.json`;
  const manifest = {
    format: "release/0",
    release: "test",
    row_count: 2,
    sample: true,
    sample_notice: "Sample data.",
    categories: [
      { id: "dna_repair", label: "DNA repair" },
      { id: "signaling", label: "Signalling" },
    ],
    files: {
      points: {
        path: pointsPath,
        bytes: points.byteLength,
        sha256: sha256(points),
        format: "points/0",
      },
      proteins: {
        path: indexPath,
        bytes: index.byteLength,
        sha256: sha256(index),
        format: "protein-index/0",
      },
    },
  };
  const files = new Map<string, Uint8Array>([
    [pointsPath, points],
    [indexPath, index],
    ["manifest.json", new TextEncoder().encode(JSON.stringify(manifest))],
  ]);
  return { files, manifest };
}

export function fakeFetch(files: Map<string, Uint8Array>): typeof fetch {
  return async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const name = url.pathname.split("/").pop() ?? "";
    const body = files.get(name);
    if (body === undefined) return new Response("not found", { status: 404 });
    return new Response(body.slice(), { status: 200 });
  };
}
