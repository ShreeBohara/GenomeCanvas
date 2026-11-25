import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CATEGORY_TOKENS,
  categoryToken,
  POINT_HIGHLIGHT_TOKEN,
  POINT_OUTLINE_TOKEN,
} from "./index.js";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const [light, dark] = css.split("@media (prefers-color-scheme: dark)") as [string, string];

function hexOf(block: string, name: string): string | undefined {
  return new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i").exec(block)?.[1];
}

// WCAG relative luminance and contrast, for the 3:1 that marks need against the page.
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = Number.parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe("tokens.css", () => {
  it.each([
    ["light", light],
    ["dark", dark],
  ])("defines every token code reads, in the %s theme", (_, block) => {
    for (const name of [...CATEGORY_TOKENS, POINT_OUTLINE_TOKEN, POINT_HIGHLIGHT_TOKEN]) {
      expect(hexOf(block, name), name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ])("keeps body and muted text readable in the %s theme", (_, block) => {
    const surface = hexOf(block, "--gc-surface") as string;
    expect(contrast(hexOf(block, "--gc-text") as string, surface)).toBeGreaterThanOrEqual(7);
    expect(contrast(hexOf(block, "--gc-text-muted") as string, surface)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("outlines points with something that stands 3:1 off the light page", () => {
    expect(
      contrast(hexOf(light, POINT_OUTLINE_TOKEN) as string, hexOf(light, "--gc-bg") as string),
    ).toBeGreaterThanOrEqual(3);
  });

  it("gives every dark-theme category 3:1 against the dark page", () => {
    const bg = hexOf(dark, "--gc-bg") as string;
    for (const name of CATEGORY_TOKENS) {
      expect(contrast(hexOf(dark, name) as string, bg), name).toBeGreaterThanOrEqual(3);
    }
  });

  it("wraps around the palette for categories beyond it", () => {
    expect(categoryToken(0)).toBe("--gc-category-1");
    expect(categoryToken(5)).toBe("--gc-category-1");
  });
});
