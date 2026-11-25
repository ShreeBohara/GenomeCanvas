# Contributing

GenomeCanvas 2.0 is in its first build phase, so the layout changes quickly. Issues
and small pull requests are welcome; for anything larger, open an issue first.

## Set up

Follow the Quickstart in the [README](README.md). Before you push, run:

```bash
corepack pnpm check:all
```

CI runs the same checks.

## Rules that reach into review

- **Data honesty.** Never fabricate a value or substitute one silently. A missing
  value is recorded as missing, with the reason.
- **Licences first.** A new data source needs a row in `forge/sources.yaml`, and
  it may not be used until someone has read its licence and marked the row
  verified. See [`docs/licensing.md`](docs/licensing.md).
- **Every value carries its kind:** measured, curated, predicted or generated.
- **Words on screen are about biology,** never about the interface.
- **Everything is reachable by keyboard,** and motion stops when the system asks
  for reduced motion.
- **Interface actions go through the typed command vocabulary** (decision
  record [6](docs/adr/0006-command-vocabulary-and-trails.md)).

## Code

- TypeScript is strict: no `any`, no non-null assertions without a comment saying
  why, named exports, small modules with one job.
- Python is fully type-hinted and checked with mypy in strict mode. No bare
  `except`. Code that touches the network or disk is kept apart from code that
  computes.
- Tests sit beside the code they test and never touch the network.
- Builds and data outputs are byte-identical for identical inputs.
- A new runtime dependency needs a one-line reason in its commit message.

## Commits

Small, one concern each, an imperative subject under 72 characters, and a body
that says why.

## Licence

By contributing you agree that your contribution is licensed under
[Apache-2.0](LICENSE).
