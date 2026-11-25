import { describe, expect, it } from "vitest";
import { instrumentDrawCalls } from "./gl-counter.js";

function fakeContext() {
  const seen: string[] = [];
  const gl = {
    drawArrays: () => seen.push("drawArrays"),
    drawElements: () => seen.push("drawElements"),
    drawArraysInstanced: () => seen.push("drawArraysInstanced"),
    drawElementsInstanced: () => seen.push("drawElementsInstanced"),
  };
  return { gl, seen };
}

describe("instrumentDrawCalls", () => {
  it("counts calls and the instances each one submits, and still draws", () => {
    const { gl, seen } = fakeContext();
    const counter = instrumentDrawCalls(gl as unknown as WebGL2RenderingContext);
    const ctx = gl as unknown as WebGL2RenderingContext;
    ctx.drawElementsInstanced(4, 6, 5123, 0, 54);
    ctx.drawArrays(4, 0, 3);
    expect(counter.tally).toEqual({ calls: 2, instances: 55 });
    expect(seen).toEqual(["drawElementsInstanced", "drawArrays"]);
    counter.reset();
    expect(counter.tally).toEqual({ calls: 0, instances: 0 });
  });

  it("puts the original functions back", () => {
    const { gl } = fakeContext();
    const original = gl.drawElementsInstanced;
    const counter = instrumentDrawCalls(gl as unknown as WebGL2RenderingContext);
    expect(gl.drawElementsInstanced).not.toBe(original);
    counter.restore();
    expect(gl.drawElementsInstanced).toBe(original);
  });
});
