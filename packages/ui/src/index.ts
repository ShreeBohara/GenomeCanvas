// The names of the tokens code needs to read at run time. The values live only in tokens.css.

/** One per category, in the order of a release's category list. */
export const CATEGORY_TOKENS = [
  "--gc-category-1",
  "--gc-category-2",
  "--gc-category-3",
  "--gc-category-4",
  "--gc-category-5",
] as const;

export const POINT_OUTLINE_TOKEN = "--gc-point-outline";
export const POINT_HIGHLIGHT_TOKEN = "--gc-point-highlight";

export interface MapColours {
  readonly palette: readonly string[];
  readonly outline: string;
  readonly highlight: string;
}

/** A category beyond the palette's length reuses colours from the start; a legend must say so. */
export function categoryToken(index: number): string {
  return CATEGORY_TOKENS[index % CATEGORY_TOKENS.length] as string;
}

/** Read the map's colours from the tokens currently in force on `element`. */
export function readMapColours(element: Element, categoryCount: number): MapColours {
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    palette: Array.from({ length: categoryCount }, (_, i) => read(categoryToken(i))),
    outline: read(POINT_OUTLINE_TOKEN),
    highlight: read(POINT_HIGHLIGHT_TOKEN),
  };
}
