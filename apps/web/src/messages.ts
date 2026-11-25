import { ReleaseError, UNREACHABLE_CODES } from "@genomecanvas/query";

/** What went wrong, in the three ways a reader needs to tell apart. */
export type Problem = "unreachable" | "damaged" | "cannot_draw";

export interface ProblemText {
  readonly title: string;
  readonly body: string;
}

const TEXT: Record<Problem, ProblemText> = {
  unreachable: {
    title: "The protein map could not be loaded",
    body: "The map's data did not arrive. Check your connection and try again.",
  },
  damaged: {
    title: "The protein map could not be loaded",
    body: "The map's data arrived incomplete or damaged, so nothing is drawn rather than something wrong.",
  },
  cannot_draw: {
    title: "This browser cannot draw the protein map",
    body: "Drawing the map needs WebGL 2, which this browser or device does not provide. The list of proteins is still available to screen readers.",
  },
};

export function problemText(problem: Problem): ProblemText {
  return TEXT[problem];
}

/** Sort an error from loading a release into what a reader is told. */
export function problemFor(error: unknown): Problem {
  if (error instanceof ReleaseError) {
    return UNREACHABLE_CODES.has(error.code) ? "unreachable" : "damaged";
  }
  // Anything else that fails while loading is treated as damage: it must not
  // be mistaken for a connection problem the reader could fix by retrying.
  return "damaged";
}
