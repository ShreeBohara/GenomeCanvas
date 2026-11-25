# Architecture decision records

One file per decision, taken from plan section 4.3. Each names what it rejected.
A decision changes by adding a new record that supersedes the old one.

| # | Decision | Status |
|---|---|---|
| [1](0001-static-first-architecture.md) | Static-first: compute offline, serve files, query in the browser, one Worker | Accepted |
| [2](0002-react-vite-on-cloudflare.md) | React, Vite and TanStack Router on Cloudflare | Accepted, pending owner |
| [3](0003-threejs-webgl2-instanced.md) | three.js on WebGL 2, instanced; WebGPU deferred | Accepted |
| [4](0004-molstar-headless.md) | Mol* from npm, headless, MolViewSpec export | Accepted |
| [5](0005-immutable-files-on-r2.md) | Immutable Parquet and binary files on R2 | Accepted |
| [6](0006-command-vocabulary-and-trails.md) | Typed command vocabulary and Trails | Accepted |
| [7](0007-guide-in-the-browser.md) | The Guide in TypeScript, tools in the browser | Accepted |
| [8](0008-python-pipeline.md) | Python pipeline: plain typed stages, DuckDB, Parquet; Dagster deferred | Accepted, amended in 2A |
| [9](0009-opentofu-and-github-actions.md) | OpenTofu and GitHub Actions | Accepted |
| [10](0010-licensing.md) | Apache-2.0 for code, CC BY 4.0 for data | Accepted, pending owner |
| [11](0011-tooling.md) | pnpm, Biome, Vitest, Playwright, uv, ruff, mypy, pytest | Accepted |
