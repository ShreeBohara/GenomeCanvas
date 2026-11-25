# 4. Mol* from npm, run headless, with MolViewSpec for export

Status: Accepted, 2026-11-25

## Context

Single proteins need a full molecular viewer. Version 1 side-loaded Mol* through
a script tag.

## Decision

Mol* 5.13 from npm, run headless behind the app's own controls, loaded only when
a protein is opened. The `focus` and `residues` commands compile to MolViewSpec,
the declarative view format Mol* reads, so a view can be exported and opened
elsewhere.

## Alternatives rejected

- **Version 1's side-loaded script tag.** Untyped, outside the build, and hard
  to drive from the command protocol.
- **Mol*'s stock interface.** Brings its own skin and a React 18 renderer.
- **3Dmol.js and NGL.** Mol* is the standard, has a built-in confidence theme in
  AlphaFold's colours, and accepts per-residue colours from outside data.

## Consequences

- The app owns every control, so the interface stays consistent.
- Mol* is a large dependency and must stay off the first-load path.
- Exported views interoperate with other Mol*-based tools.
