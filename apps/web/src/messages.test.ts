import { ReleaseError } from "@genomecanvas/query";
import { describe, expect, it } from "vitest";
import { problemFor, problemText } from "./messages.js";

describe("problemFor", () => {
  it("tells a release that never arrived from one that arrived wrong", () => {
    expect(problemFor(new ReleaseError("manifest_unreachable", "x"))).toBe("unreachable");
    expect(problemFor(new ReleaseError("file_unreachable", "x"))).toBe("unreachable");
    expect(problemFor(new ReleaseError("length_mismatch", "x"))).toBe("damaged");
    expect(problemFor(new ReleaseError("bad_magic", "x"))).toBe("damaged");
    expect(problemFor(new Error("anything"))).toBe("damaged");
  });
});

describe("problemText", () => {
  it("never shows an error code to a reader", () => {
    for (const problem of ["unreachable", "damaged", "cannot_draw"] as const) {
      const { title, body } = problemText(problem);
      expect(`${title} ${body}`).not.toMatch(/_|manifest|hash|undefined|null/i);
    }
  });
});
