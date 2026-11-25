/** "#rrggbb" or "#rgb" to sRGB channels in 0–1, or null if it is neither. */
export function parseHexColour(value: string): [number, number, number] | null {
  const hex = value.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  const parts = long
    ? [long[1], long[2], long[3]]
    : short
      ? [short[1], short[2], short[3]].map((d) => `${d}${d}`)
      : null;
  if (parts === null) return null;
  const [r, g, b] = parts.map((p) => Number.parseInt(p as string, 16) / 255) as [
    number,
    number,
    number,
  ];
  return [r, g, b];
}
