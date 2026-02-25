# Changelog

All notable changes to moon-sighting are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
