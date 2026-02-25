# Changelog

All notable changes to moon-sighting are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0] - 2026-02-25

### Added

- `getMoonPosition(date, lat, lon, elevation?)` — topocentric Moon azimuth, altitude, distance,
  and parallactic angle via Meeus Ch. 47 (no kernel required, ~0.3° accuracy)
- `getMoonIllumination(date)` — illumination fraction, phase cycle position, bright limb
  position angle, and waxing/waning flag via Meeus Ch. 47/48 (no kernel required)
- `getMoonVisibilityEstimate(date, lat, lon, elevation?)` — quick kernel-free Odeh crescent
  visibility estimate using Meeus positions; returns V parameter, zone (A-D), ARCL, ARCV, W
- `getMoon(date, lat, lon, elevation?)` — combined convenience wrapper returning phase,
  position, illumination, and visibility estimate in a single call
- `phaseName` and `phaseSymbol` fields on `MoonPhaseResult` — human-readable name
  (e.g. "Waxing Crescent") and moon phase emoji (e.g. "🌒")
- `MoonPosition`, `MoonIlluminationResult`, `MoonVisibilityEstimate`, and `MoonSnapshot`
  TypeScript types

## [1.0.0] - 2026-02-25

### Added

- Core type system: `Observer`, `MoonSightingReport`, `CrescentGeometry`, `YallopResult`, `OdehResult`, `MoonPhaseResult`, `SunMoonEvents`, `KernelConfig`, `SightingOptions`
- Module architecture: `math/`, `time/`, `spk/`, `frames/`, `observer/`, `bodies/`, `events/`, `visibility/`, `api/`, `cli/`
- DAF/SPK Type 2 parser and Chebyshev evaluator for DE442S
- Kernel auto-download and SHA-256 checksum verification (`initKernels`, `downloadKernels`, `verifyKernels`)
- Full time scale chain: UTC → TAI → TT → TDB with delta-T polynomial, leap-second table, ERA computation
- IERS Q·R·W frame transforms: IAU 2006/2000A precession, nutation, polar motion
- WGS84 geodetic ↔ ECEF conversion, topocentric ENU projection
- Bennett (1982) atmospheric refraction formula with pressure/temperature correction
- Topocentric Moon/Sun state computation via DE442S segment chaining
- Meeus approximate positions for kernel-free `getMoonPhase()`
- Rise/set event solver using Brent's method over the altitude function
- Twilight computation: civil (−6°), nautical (−12°), astronomical (−18°)
- Full crescent geometry: ARCL, ARCV, DAZ, W (arc minutes), lag
- Yallop q-test constants and category thresholds (NAO TN 69)
- Odeh zone constants, V-parameter thresholds, and best-time optimizer (Experimental Astronomy 2006)
- WGS84 ellipsoid constants and Clenshaw Chebyshev evaluation
- Vector/matrix math utilities, Brent root-finding
- Best-time heuristic: T_b = T_sunset + (4/9) × Lag
- Observation window computation (±20 min around best time)
- Odeh-based and Yallop-based guidance text generation
- `getMoonSightingReport()` full pipeline
- `getMoonPhase()` (Meeus approximation, kernel-free)
- `getSunMoonEvents()` full pipeline
- CLI commands: `download-kernels`, `verify-kernels`, `sighting`, `phase`, `benchmark`
- CI: Node matrix (20/22/24), typecheck, pack-check
- Wiki: Architecture, API Reference, Crescent Visibility, Ephemeris, Time Scales, Reference Frames, Observer Model, Validation, Getting Started
