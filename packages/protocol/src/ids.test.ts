import { describe, expect, it } from "vitest";
import { type EntityId, entityKind, isUniProtAccession, parseEntityId } from "./ids.js";

describe("isUniProtAccession", () => {
  it.each([
    ["P38398", "BRCA1, six characters starting with P"],
    ["Q13315", "ATM, starting with Q"],
    ["O15245", "starting with O"],
    ["A2BC19", "the second six-character form"],
    ["A0A023GPI8", "the ten-character form"],
  ])("accepts %s (%s)", (value) => {
    expect(isUniProtAccession(value)).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["p38398", "lower case"],
    ["P38398 ", "trailing space"],
    [" P38398", "leading space"],
    ["P3839", "too short"],
    ["P383981", "seven characters"],
    ["O1A2B3C", "O, P and Q never start the ten-character form"],
    ["A0A023GPI8X", "eleven characters"],
    ["BRCA1", "a gene symbol"],
    ["P38398-2", "an isoform suffix is not an accession"],
  ])("rejects %j (%s)", (value) => {
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
