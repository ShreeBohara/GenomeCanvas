import { describe, expect, it } from "vitest";
import { parseDevSearch, repeatPoints } from "./dev-switches.js";

const points = {
  count: 3,
  x: new Float32Array([0, 1, 2]),
  y: new Float32Array([0, 1, 0]),
  category: new Uint8Array([0, 1, 2]),
};

describe("repeatPoints", () => {
  it("repeats up to exactly the target count", () => {
    const repeated = repeatPoints(points, 20_429);
    expect(repeated.count).toBe(20_429);
    expect(repeated.x.length).toBe(20_429);
    expect(repeated.category[20_428]).toBe(points.category[20_428 % 3]);
  });

  it("places no copy on top of another", () => {
    const repeated = repeatPoints(points, 30);
    const seen = new Set<string>();
    for (let i = 0; i < repeated.count; i++) seen.add(`${repeated.x[i]},${repeated.y[i]}`);
    expect(seen.size).toBe(30);
  });

  it("leaves the points alone when the target is not larger", () => {
    expect(repeatPoints(points, 3)).toBe(points);
  });
});

describe("parseDevSearch", () => {
  it("reads positive whole numbers in development", () => {
    expect(parseDevSearch({ repeat: "20429", measure: 240 })).toEqual({
      repeat: 20_429,
      measure: 240,
    });
  });

  it("ignores anything else", () => {
    expect(parseDevSearch({ repeat: "-1", measure: "lots" })).toEqual({});
  });
});
