import { describe, expect, it } from "vitest";
import { actionForKey, glideSpeed } from "./keys.js";

const viewport = { width: 1000, height: 500 };

describe("actionForKey", () => {
  it("moves the view with the arrows, so the map slides the other way", () => {
    expect(actionForKey("ArrowRight", false, viewport)).toEqual({ kind: "pan", dx: -100, dy: 0 });
    expect(actionForKey("ArrowLeft", false, viewport)).toEqual({ kind: "pan", dx: 100, dy: 0 });
    expect(actionForKey("ArrowUp", false, viewport)).toEqual({ kind: "pan", dx: 0, dy: 50 });
    expect(actionForKey("ArrowDown", true, viewport)).toEqual({ kind: "pan", dx: 0, dy: -150 });
  });

  it("zooms with plus and minus, on either keyboard layout's key", () => {
    expect(actionForKey("+", false, viewport)).toEqual({ kind: "zoom", factor: 1.25 });
    expect(actionForKey("=", false, viewport)).toEqual({ kind: "zoom", factor: 1.25 });
    expect(actionForKey("-", false, viewport)).toEqual({ kind: "zoom", factor: 0.8 });
  });

  it("shows everything with 0 or Home", () => {
    expect(actionForKey("0", false, viewport)).toEqual({ kind: "fit" });
    expect(actionForKey("Home", false, viewport)).toEqual({ kind: "fit" });
  });

  it("leaves every other key alone, Tab included", () => {
    expect(actionForKey("Tab", false, viewport)).toBeNull();
    expect(actionForKey("a", false, viewport)).toBeNull();
  });
});

describe("glideSpeed", () => {
  it("starts at the release speed and dies away", () => {
    expect(glideSpeed(2, 0)).toBe(2);
    expect(glideSpeed(2, 100)).toBeLessThan(glideSpeed(2, 50));
  });

  it("stops within 400 ms", () => {
    expect(glideSpeed(5, 400)).toBe(0);
  });
});
