import { describe, expect, it } from "vitest";
import { parseHexColour } from "./colour.js";

describe("parseHexColour", () => {
  it("reads six and three digit colours", () => {
    expect(parseHexColour("#E69F00")).toEqual([230 / 255, 159 / 255, 0]);
    expect(parseHexColour(" #fff ")).toEqual([1, 1, 1]);
  });

  it.each(["", "E69F00", "#E69F0", "#GGGGGG", "rgb(0,0,0)"])("rejects %j", (value) => {
    expect(parseHexColour(value)).toBeNull();
  });
});
