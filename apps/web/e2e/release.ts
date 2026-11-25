// Reads the sample release from disk exactly as the pipeline wrote it, so the
// tests compare the page with what was built, not with numbers typed here.
import { readFileSync } from "node:fs";
import { decodePoints } from "@genomecanvas/query";

const FOLDER = new URL("../../../build/release/sample/", import.meta.url);

export interface BuiltRelease {
  readonly rowCount: number;
  readonly pointsPath: string;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly proteins: readonly { readonly gene_symbol: string; readonly name: string }[];
}

export function readBuiltRelease(): BuiltRelease {
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", FOLDER), "utf8"));
  const bytes = readFileSync(new URL(manifest.files.points.path, FOLDER));
  const points = decodePoints(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    {
      rowCount: manifest.row_count,
    },
  );
  const index = JSON.parse(readFileSync(new URL(manifest.files.proteins.path, FOLDER), "utf8"));
  return {
    rowCount: manifest.row_count,
    pointsPath: manifest.files.points.path,
    x: points.x,
    y: points.y,
    proteins: index.rows,
  };
}

/** The row whose nearest neighbour is farthest away: the least ambiguous one to hover. */
export function loneliestRow(release: BuiltRelease): number {
  let best = 0;
  let bestDistance = -1;
  for (let i = 0; i < release.rowCount; i++) {
    let nearest = Number.POSITIVE_INFINITY;
    for (let j = 0; j < release.rowCount; j++) {
      if (i === j) continue;
      const d = Math.hypot(
        (release.x[i] as number) - (release.x[j] as number),
        (release.y[i] as number) - (release.y[j] as number),
      );
      nearest = Math.min(nearest, d);
    }
    if (nearest > bestDistance) {
      bestDistance = nearest;
      best = i;
    }
  }
  return best;
}

/** A file of the built release, byte for byte as the pipeline wrote it. */
export function readBuiltFile(name: string): Buffer {
  return readFileSync(new URL(name, FOLDER));
}
