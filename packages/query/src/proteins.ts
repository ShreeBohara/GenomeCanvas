import { isUniProtAccession, type UniProtAccession } from "@genomecanvas/protocol";
import { ReleaseError } from "./errors.js";
import { INDEX_FORMAT, type Manifest } from "./manifest.js";

export interface ProteinRecord {
  readonly accession: UniProtAccession;
  readonly geneSymbol: string;
  readonly name: string;
  /** An index into the manifest's categories, matching the points file. */
  readonly category: number;
}

function invalid(detail: string): never {
  throw new ReleaseError("index_invalid", detail);
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") invalid(`${field} is blank`);
  return value;
}

/** Check a parsed protein index against its manifest, row by row. */
export function parseProteinIndex(value: unknown, manifest: Manifest): ProteinRecord[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalid("the index is not a JSON object");
  }
  const document = value as Record<string, unknown>;
  if (document.format !== INDEX_FORMAT) invalid(`format is not ${INDEX_FORMAT}`);
  const rows = document.rows;
  if (!Array.isArray(rows)) invalid("rows is not a list");
  if (rows.length !== manifest.rowCount) {
    invalid(`${rows.length} rows; the manifest says ${manifest.rowCount}`);
  }

  const categoryIndex = new Map(manifest.categories.map((c, i) => [c.id, i]));
  const seen = new Set<string>();
  return rows.map((row: unknown, i) => {
    if (typeof row !== "object" || row === null) invalid(`row ${i} is not an object`);
    const r = row as Record<string, unknown>;
    const accession = r.accession;
    if (typeof accession !== "string" || !isUniProtAccession(accession)) {
      invalid(`row ${i} has no valid accession`);
    }
    if (seen.has(accession)) invalid(`row ${i} repeats ${accession}`);
    seen.add(accession);
    const category = categoryIndex.get(text(r.category, `row ${i} category`));
    if (category === undefined) invalid(`row ${i} has a category the manifest does not list`);
    return {
      accession,
      geneSymbol: text(r.gene_symbol, `row ${i} gene_symbol`),
      name: text(r.name, `row ${i} name`),
      category,
    };
  });
}
