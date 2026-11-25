// Entity identifiers are self-describing, as in version 1: a protein is its bare
// UniProt accession, and every other entity carries a lowercase kind prefix.
// Parsing is strict on purpose. Version 1 resolved "describe" to the gene DES by
// being lenient; here a string is an identifier only if it is exactly one.

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

/** A UniProtKB accession, such as `P38398`. */
export type UniProtAccession = Brand<string, "UniProtAccession">;

/** An identifier for anything the atlas can show: `P38398`, `disease:…`, `go:0006281`. */
export type EntityId = Brand<string, "EntityId">;

export type EntityKind = "protein" | "disease" | "drug" | "pathway" | "go";

/**
 * Why a string was not an identifier. These are codes for callers, not text
 * for people: an interface must turn them into words about biology.
 */
export type EntityIdError = "empty" | "whitespace" | "too_long" | "unknown_prefix" | "malformed";

export type ParsedEntityId =
  | { readonly ok: true; readonly id: EntityId; readonly kind: EntityKind }
  | { readonly ok: false; readonly error: EntityIdError; readonly input: string };

// UniProt's published pattern, from https://www.uniprot.org/help/accession_numbers
// (page last modified 2026-06-12), anchored so it must match the whole string.
const UNIPROT_ACCESSION =
  /^(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2})$/;

// Gene Ontology identifiers are always seven digits (GO:0006281).
const GO_LOCAL_ID = /^[0-9]{7}$/;

// Wide enough for version 1's slugs and for the identifiers the Forge will
// bring in (EFO_0000305, CHEMBL25, R-HSA-5693532), narrow enough that no
// whitespace, separator or control character can hide inside an identifier.
const LOCAL_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

// No real identifier comes close; the cap stops pathological input early.
const MAX_LENGTH = 128;

const PREFIXED_KINDS: ReadonlySet<string> = new Set<EntityKind>([
  "disease",
  "drug",
  "pathway",
  "go",
]);

export function isUniProtAccession(value: string): value is UniProtAccession {
  return UNIPROT_ACCESSION.test(value);
}

export function parseEntityId(input: string): ParsedEntityId {
  const fail = (error: EntityIdError): ParsedEntityId => ({ ok: false, error, input });

  if (input.length === 0) return fail("empty");
  if (input.length > MAX_LENGTH) return fail("too_long");
  if (/\s/.test(input)) return fail("whitespace");

  if (isUniProtAccession(input)) {
    return { ok: true, id: input as string as EntityId, kind: "protein" };
  }

  const separator = input.indexOf(":");
  if (separator === -1) return fail("malformed");

  const prefix = input.slice(0, separator);
  const local = input.slice(separator + 1);
  if (!PREFIXED_KINDS.has(prefix)) return fail("unknown_prefix");

  const kind = prefix as Exclude<EntityKind, "protein">;
  const valid = kind === "go" ? GO_LOCAL_ID.test(local) : LOCAL_ID.test(local);
  if (!valid) return fail("malformed");

  return { ok: true, id: input as EntityId, kind };
}

/** The kind of an identifier that has already been parsed. */
export function entityKind(id: EntityId): EntityKind {
  const separator = id.indexOf(":");
  // A parsed identifier without a prefix can only be a protein accession.
  if (separator === -1) return "protein";
  return id.slice(0, separator) as EntityKind;
}
