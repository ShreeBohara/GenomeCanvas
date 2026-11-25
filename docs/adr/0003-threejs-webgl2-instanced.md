# 3. three.js on WebGL 2 with instanced geometry

Status: Accepted, 2026-11-25

## Context

The atlas draws all 20,429 reviewed human proteins as real backbones. Version 1
used one react-three-fiber component per protein, which was its ceiling.

## Decision

three.js with its long-standing WebGL 2 renderer and hand-written shaders,
instanced geometry only, so the whole atlas is a handful of draw calls. A two-day
spike opens Phase 3 to confirm it. WebGPU is deferred until a benchmark earns it.
The engine's interface stays narrow enough to take a second backend later.

## Alternatives rejected

- **Starting on three.js's WebGPU renderer.** Its own manual still calls it
  experimental, it does not accept ordinary shader code, and it reaches about
  83–89% of users. Its advantages matter at hundreds of thousands of objects,
  not 20,429.
- **react-three-fiber inside the frame loop.** One component per protein.
- **deck.gl.** Its WebGPU backend is "not production ready" by its own guide.

## Consequences

- Works in every current browser today.
- Shaders are written by hand in GLSL.
- Moving to WebGPU, most likely at the 576,073-protein stretch level, needs a
  before-and-after measurement first.
