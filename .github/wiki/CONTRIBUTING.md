# Contributing to moon-sighting

Thanks for your interest in contributing. This is a focused library for lunar crescent visibility calculation and contributions are welcome.

## Getting started

```bash
git clone https://github.com/acamarata/moon-sighting.git
cd moon-sighting
pnpm install
pnpm build
pnpm test
```

All tests should pass before you start.

## What to work on

Check the [open issues](https://github.com/acamarata/moon-sighting/issues) for anything tagged `help wanted` or `good first issue`. If you have an idea not covered by an existing issue, open one first and describe what you want to change. That avoids duplicate work.

## Domain knowledge

moon-sighting implements the Yallop (1997) and Odeh (2004) crescent visibility criteria and uses the JPL DE442S ephemeris for lunar position calculations. Before contributing to algorithmic code, read the relevant paper:

- Yallop, B.D. (1997). "A Method for Predicting the First Sighting of the New Crescent Moon." HM Nautical Almanac Office Technical Note No. 69.
- Odeh, M.S. (2004). "New Criterion for Lunar Crescent Visibility." Experimental Astronomy, 18, 39-64.
- Meeus, Jean. "Astronomical Algorithms," 2nd ed. Willmann-Bell, 1998.

Algorithmic changes require cross-validation against published observation records. See the [Validation](Validation) wiki page for test data sources.

## Code style

- TypeScript strict mode. No `any` without a comment explaining why.
- Pure functions, no global state. Observer location is passed explicitly.
- Each function: one purpose. If you can describe it with "and", split it.
- Run `pnpm run format` before committing. CI will fail on formatting issues.
- Run `pnpm run lint` before committing. Fix all warnings, not just errors.

## Tests

- Add tests for any new function or changed behavior.
- Tests live in `test.mjs` (ESM) and `test-cjs.cjs` (CommonJS). Both must pass.
- Use the native Node.js `node:test` runner. No Jest, no Vitest.
- Astronomical calculations must be validated against known historical sightings.

## Pull requests

- Keep PRs small and focused. One concern per PR.
- Write a clear description of what changed and why.
- For algorithmic changes: include cross-validation data with at least 10 known historical sightings.
- Reference the issue number if one exists (`Fixes #42`).
- CI must be green before merge. This includes test, lint, typecheck, and pack-check.

## License

By contributing, you agree that your work will be licensed under MIT. Copyright remains with Aric Camarata.
