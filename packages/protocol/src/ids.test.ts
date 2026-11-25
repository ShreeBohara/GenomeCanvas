import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type EntityId, entityKind, isUniProtAccession, parseEntityId } from "./ids.js";

interface AccessionVector {
  readonly value: string;
  readonly why: string;
}

// Shared with forge's Python tests, so both languages agree on what an accession is.
const vectors = JSON.parse(
  readFileSync(new URL("../vectors/uniprot-accessions.json", import.meta.url), "utf8"),
) as { readonly valid: readonly AccessionVector[]; readonly invalid: readonly AccessionVector[] };

describe("isUniProtAccession", () => {
  it("reads a non-trivial set of shared vectors", () => {
    expect(vectors.valid.length).toBeGreaterThanOrEqual(5);
    expect(vectors.invalid.length).toBeGreaterThanOrEqual(10);
  });

  it.each(vectors.valid.map((v) => [v.value, v.why]))("accepts %j (%s)", (value) => {
    expect(isUniProtAccession(value)).toBe(true);
  });

  it.each(vectors.invalid.map((v) => [v.value, v.why]))("rejects %j (%s)", (value) => {
    expect(isUniProtAccession(value)).toBe(false);
  });
});

describe("parseEntityId", () => {
  it.each([
    ["P38398", "protein"],
    ["A0A023GPI8", "protein"],
    ["disease:breast_carcinoma", "disease"],
    ["disease:EFO_0000305", "disease"],
    ["drug:olaparib", "drug"],
    ["drug:CHEMBL521686", "drug"],
    ["pathway:R-HSA-5693532", "pathway"],
    ["go:0006281", "go"],
  ])("parses %s as a %s", (input, kind) => {
    const parsed = parseEntityId(input);
    expect(parsed).toEqual({ ok: true, id: input, kind });
  });

  it.each([
    ["", "empty"],
    ["P38398 ", "whitespace"],
    [" disease:breast_carcinoma", "whitespace"],
    ["drug:olaparib\n", "whitespace"],
    ["disease:breast carcinoma", "whitespace"],
    ["p38398", "malformed"],
    ["CAT", "malformed"],
    ["SET", "malformed"],
    ["describe", "malformed"],
    ["Disease:breast_carcinoma", "unknown_prefix"],
    ["DRUG:olaparib", "unknown_prefix"],
    ["trial:nct01877668", "unknown_prefix"],
    ["gene:BRCA1", "unknown_prefix"],
    [":P38398", "unknown_prefix"],
    ["disease:", "malformed"],
    ["drug:_olaparib", "malformed"],
    ["pathway:R-HSA/5693532", "malformed"],
    ["go:GO:0006281", "malformed"],
    ["go:6281", "malformed"],
    ["disease:a:b", "malformed"],
    [`disease:${"a".repeat(200)}`, "too_long"],
  ])("rejects %j as %s", (input, error) => {
    expect(parseEntityId(input)).toEqual({ ok: false, error, input });
  });
});

describe("entityKind", () => {
  it("reads the kind back from every parsed identifier", () => {
    const inputs = [
      "P38398",
      "disease:breast_carcinoma",
      "drug:olaparib",
      "pathway:x",
      "go:0006281",
    ];
    const kinds = inputs.map((input) => {
      const parsed = parseEntityId(input);
      if (!parsed.ok) throw new Error(`expected ${input} to parse`);
      return entityKind(parsed.id);
    });
    expect(kinds).toEqual(["protein", "disease", "drug", "pathway", "go"]);
  });

  it("is only reachable through parsing", () => {
    // @ts-expect-error a plain string is not an EntityId until it has been parsed
    const unparsed: EntityId = "P38398";
    expect(typeof unparsed).toBe("string");
  });
});
