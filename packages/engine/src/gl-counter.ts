/**
 * Counts what the GPU is actually asked to draw, by wrapping the context's draw
 * entry points. three.js reports draw calls and triangles; it does not report
 * instances, and a test of "one instanced draw call" should rest on what was
 * submitted, not on what the engine believes it submitted.
 */
export interface DrawTally {
  calls: number;
  instances: number;
}

export interface GlCounter {
  readonly tally: Readonly<DrawTally>;
  reset(): void;
  restore(): void;
}

export function instrumentDrawCalls(gl: WebGL2RenderingContext): GlCounter {
  const tally: DrawTally = { calls: 0, instances: 0 };
  const originals = {
    drawArrays: gl.drawArrays,
    drawElements: gl.drawElements,
    drawArraysInstanced: gl.drawArraysInstanced,
    drawElementsInstanced: gl.drawElementsInstanced,
  };

  gl.drawArrays = function (this: WebGL2RenderingContext, ...args) {
    tally.calls += 1;
    tally.instances += 1;
    originals.drawArrays.apply(this, args);
  };
  gl.drawElements = function (this: WebGL2RenderingContext, ...args) {
    tally.calls += 1;
    tally.instances += 1;
    originals.drawElements.apply(this, args);
  };
  gl.drawArraysInstanced = function (this: WebGL2RenderingContext, ...args) {
    tally.calls += 1;
    tally.instances += args[3];
    originals.drawArraysInstanced.apply(this, args);
  };
  gl.drawElementsInstanced = function (this: WebGL2RenderingContext, ...args) {
    tally.calls += 1;
    tally.instances += args[4];
    originals.drawElementsInstanced.apply(this, args);
  };

  return {
    tally,
    reset() {
      tally.calls = 0;
      tally.instances = 0;
    },
    restore() {
      Object.assign(gl, originals);
    },
  };
}
