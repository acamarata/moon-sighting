# Changelog

## [1.1.3] - 2026-07-11

### Fixed
- SPK/DAF kernel parsing was completely broken: the DAF forward-record offset was read from byte 256 instead of 76, so zero segments loaded and every kernel-backed call threw `no path for target=301 center=399`. Also fixed a Type 2/3 Chebyshev `nCoeffs` off-by-one and an Earth/SSB sign error in barycentre assembly. Fixed geocentric Moon position now matches JPL Horizons to within ~0.6 km / 0.003°. Thanks @hsravat-4590 (#2).


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2026-05-30

### Fixed
- Strict TypeScript null checks in spk, math, and visibility modules.

### Changed
- Flat `exports` map shape per ADR-015; `d.mts` copy retained on disk.
- CI: corepack before setup-node, prettier scoped to `src/`.
- Adopted shared `@acamarata/tsconfig` and `@acamarata/eslint-config` packages.

## [1.1.1] - 2026-05-29

### Fixed
- Emit `dist/index.d.mts` so ESM consumers get proper type resolution.
- Use format-specific `types` entries in the `exports` map (`import` condition points to `index.d.mts`, `require` condition points to `index.d.ts`).

## [1.1.0] - 2026-05-28

### Added
- Initial release
