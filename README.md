# moon-sighting

[![npm version](https://img.shields.io/npm/v/moon-sighting.svg)](https://www.npmjs.com/package/moon-sighting)
[![CI](https://github.com/acamarata/moon-sighting/actions/workflows/ci.yml/badge.svg)](https://github.com/acamarata/moon-sighting/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

High-accuracy lunar crescent visibility and moon sighting library for Node.js and browsers. Uses JPL DE442S ephemerides with full IERS Earth orientation for sub-arcsecond topocentric Moon and Sun positions.

Implements the Yallop (NAO TN 69) and Odeh (Experimental Astronomy 2006) crescent visibility criteria, the two most widely used models in Islamic crescent sighting workflows.

## Installation

```bash
npm install moon-sighting
```

After installing, download the JPL ephemeris kernel (31 MB, one-time setup):

```bash
npx moon-sighting download-kernels
```

This fetches `de442s.bsp` and `naif0012.tls` from NASA's NAIF server and caches them locally. The download is verified by SHA-256 checksum.

## Quick start

```ts
import { initKernels, getMoonSightingReport, getMoonPhase } from 'moon-sighting'

// One-time setup: load the ephemeris kernel
await initKernels()

// Full sighting report for a date and location
const report = await getMoonSightingReport(new Date('2025-03-29'), {
  lat: 51.5074,
  lon: -0.1278,
  elevation: 10,
  name: 'London, UK'
})

console.log(report.yallop.category)   // 'A' (easily visible to the naked eye)
console.log(report.odeh.zone)         // 'A' (visible with naked eye)
console.log(report.guidance)
// "Best time to look: 2025-03-29 20:14 UTC (73 min after sunset).
//  Look West at 8° above the horizon. The crescent should be visible
//  to the naked eye. Yallop: A (Easily visible to the naked eye).
//  Odeh: A (Visible with naked eye)."

// Moon phase works without a kernel
const phase = getMoonPhase()
console.log(phase.phase)          // 'waxing-crescent'
console.log(phase.illumination)   // 14.3
console.log(phase.nextFullMoon)   // Date
```

## API

### `initKernels(config?)`

Load the ephemeris kernel. Required before `getMoonSightingReport()`.

```ts
// Auto-download and cache (default)
await initKernels()

// User-supplied file path (Node.js)
await initKernels({ planetary: { type: 'file', path: '/data/de442s.bsp' } })

// ArrayBuffer (browser)
await initKernels({ planetary: { type: 'buffer', data: buf, name: 'de442s.bsp' } })
```

### `getMoonSightingReport(date, observer, options?)`

Returns a complete moon sighting report.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `date` | `Date` | Civil date to check (UTC) |
| `observer.lat` | `number` | Geodetic latitude, degrees (north positive) |
| `observer.lon` | `number` | Longitude, degrees (east positive) |
| `observer.elevation` | `number` | Height above WGS84 ellipsoid, meters |
| `observer.deltaT` | `number?` | Override TT - UT1 in seconds (IERS value) |
| `observer.pressure` | `number?` | Atmospheric pressure, mbar (default 1013.25) |
| `observer.temperature` | `number?` | Temperature, Celsius (default 15) |

**Returns** `MoonSightingReport`:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `sunsetUTC` | `Date` | Sunset time |
| `moonsetUTC` | `Date` | Moonset time |
| `lagMinutes` | `number` | Moonset - sunset, minutes |
| `bestTimeUTC` | `Date` | Optimal observation time |
| `geometry.ARCL` | `number` | Arc of light (elongation), degrees |
| `geometry.ARCV` | `number` | Arc of vision (airless), degrees |
| `geometry.DAZ` | `number` | Relative azimuth, degrees |
| `geometry.W` | `number` | Crescent width, arc minutes |
| `yallop.category` | `'A'`–`'F'` | Yallop visibility class |
| `yallop.q` | `number` | Continuous q parameter |
| `odeh.zone` | `'A'`–`'D'` | Odeh visibility zone |
| `odeh.V` | `number` | Continuous V parameter |
| `moonPosition` | `AzAlt` | Moon azimuth/altitude at best time |
| `guidance` | `string` | Plain-language sighting instructions |

### `getMoonPosition(date?, lat, lon, elevation?)`

Compute the Moon's topocentric position. Works without a kernel. Uses Meeus Chapter 47 approximate positions (~0.3° accuracy).

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `date` | `Date?` | Date to evaluate (default: now) |
| `lat` | `number` | Geodetic latitude, degrees (north positive) |
| `lon` | `number` | Longitude, degrees (east positive) |
| `elevation` | `number?` | Height above ellipsoid, meters (default: 0) |

**Returns** `MoonPosition`:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `azimuth` | `number` | Degrees from North, clockwise (0–360) |
| `altitude` | `number` | Apparent altitude in degrees (refraction applied) |
| `distance` | `number` | Distance from Earth center to Moon center, km |
| `parallacticAngle` | `number` | Angle between zenith and north pole as seen from the Moon, radians |

### `getMoonIllumination(date?)`

Compute the Moon's illumination. Works without a kernel. Uses Meeus Chapter 47/48 (~0.5% illumination accuracy).

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `date` | `Date?` | Date to evaluate (default: now) |

**Returns** `MoonIlluminationResult`:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `fraction` | `number` | Illuminated fraction, 0 (new moon) to 1 (full moon) |
| `phase` | `number` | Position in the 0–1 lunar cycle: 0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter |
| `angle` | `number` | Position angle of the bright limb midpoint, eastward from north, radians |
| `isWaxing` | `boolean` | True when elongation is increasing (new moon toward full moon) |

### `getMoonPhase(date?)`

Compute the Moon's current phase. Works without a kernel.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `phase` | `string` | Phase key (e.g., `'waxing-crescent'`) |
| `phaseName` | `string` | Display name (e.g., `'Waxing Crescent'`) |
| `phaseSymbol` | `string` | Moon emoji (e.g., `'🌒'`) |
| `illumination` | `number` | Illuminated fraction, 0–100 |
| `age` | `number` | Hours since last new moon |
| `isWaxing` | `boolean` | True when illumination is increasing |
| `prevNewMoon` | `Date` | Time of previous new moon |
| `nextNewMoon` | `Date` | Time of next new moon |
| `nextFullMoon` | `Date` | Time of next full moon |

### `getMoonVisibilityEstimate(date?, lat, lon, elevation?)`

Quick kernel-free Odeh crescent visibility estimate. Pass an estimated post-sunset observation time. Returns V parameter, zone A–D, ARCL, ARCV, W, and `moonAboveHorizon`. For precise crescent work use `getMoonSightingReport()`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `zone` | `'A'`–`'D'` | Odeh visibility zone |
| `V` | `number` | Odeh V parameter (positive = crescent exceeds threshold) |
| `isVisibleNakedEye` | `boolean` | True for zone A |
| `isVisibleWithOpticalAid` | `boolean` | True for zones A and B |
| `ARCL` | `number` | Elongation, degrees |
| `ARCV` | `number` | Moon alt − Sun alt (airless), degrees |
| `W` | `number` | Crescent width, arc minutes |
| `moonAboveHorizon` | `boolean` | Moon above horizon at given time |
| `isApproximate` | `true` | Always true: Meeus approximation |

### `getMoon(date?, lat, lon, elevation?)`

Convenience wrapper returning phase, position, illumination, and visibility estimate in one call. Works without a kernel.

```ts
const moon = getMoon(new Date(), 51.5074, -0.1278, 10)
moon.phase.phaseName       // 'Waxing Crescent'
moon.phase.phaseSymbol     // '🌒'
moon.position.altitude     // degrees above horizon
moon.illumination.fraction // 0.0 to 1.0
moon.visibility.zone       // 'A' through 'D'
```

### `getSunMoonEvents(date, observer)`

Get rise, set, and twilight times. Requires kernel.

| Field | Description |
| ----- | ----------- |
| `sunsetUTC` | Sunset |
| `moonsetUTC` | Moonset |
| `sunriseUTC` | Sunrise |
| `moonriseUTC` | Moonrise |
| `civilTwilightEndUTC` | Civil twilight (Sun at -6°) |
| `nauticalTwilightEndUTC` | Nautical twilight (Sun at -12°) |
| `astronomicalTwilightEndUTC` | Astronomical twilight (Sun at -18°) |

### `downloadKernels(config?)`

Download DE442S and naif0012.tls to the local cache (Node.js).

### `verifyKernels(config?)`

Verify cached kernels by SHA-256 checksum.

## Visibility criteria

### Yallop (A–F)

| Category | q range | Interpretation |
| -------- | ------- | -------------- |
| A | q > +0.216 | Easily visible to the naked eye |
| B | q > -0.014 | Visible under perfect conditions |
| C | q > -0.160 | May need optical aid to find |
| D | q > -0.232 | Needs optical aid; not visible naked eye |
| E | q > -0.293 | Not visible even with telescope |
| F | q ≤ -0.293 | Below Danjon limit |

### Odeh (A–D)

| Zone | V range | Interpretation |
| ---- | ------- | -------------- |
| A | V ≥ 5.65 | Visible with naked eye |
| B | V ≥ 2.00 | Visible with optical aid; may be naked eye |
| C | V ≥ -0.96 | Visible with optical aid only |
| D | V < -0.96 | Not visible even with optical aid |

## Kernel-free utilities

Five functions work without loading any kernel. They use Meeus Chapters 47 and 48. Use them for display, widgets, and any context where JPL-grade accuracy is not required.

```ts
import {
  getMoonPhase, getMoonPosition, getMoonIllumination,
  getMoonVisibilityEstimate, getMoon,
} from 'moon-sighting'

// Current phase with display name and emoji
const phase = getMoonPhase()
console.log(phase.phase)          // 'waxing-crescent'
console.log(phase.phaseName)      // 'Waxing Crescent'
console.log(phase.phaseSymbol)    // '🌒'
console.log(phase.illumination)   // 14.3 (percent)
console.log(phase.nextFullMoon)   // Date

// Topocentric position (azimuth, altitude, distance)
const pos = getMoonPosition(new Date(), 51.5074, -0.1278, 10)
console.log(pos.azimuth)          // 214.7 (degrees from North)
console.log(pos.altitude)         // 38.2  (degrees above horizon, refraction applied)
console.log(pos.distance)         // 384400 (km)

// Illumination fraction and phase angle
const illum = getMoonIllumination()
console.log(illum.fraction)       // 0.143 (0=new, 1=full)
console.log(illum.phase)          // 0.09  (0–1 cycle position)
console.log(illum.isWaxing)       // true

// Quick Odeh crescent visibility estimate (pass a post-sunset time)
const vis = getMoonVisibilityEstimate(new Date('2025-03-02T18:30:00Z'), 51.5074, -0.1278)
console.log(vis.zone)             // 'A' through 'D'
console.log(vis.V)                // Odeh V parameter
console.log(vis.isVisibleNakedEye) // true/false

// All four in a single call
const moon = getMoon(new Date(), 51.5074, -0.1278, 10)
console.log(moon.phase.phaseName)          // 'Waxing Crescent'
console.log(moon.position.altitude)        // degrees
console.log(moon.illumination.fraction)    // 0.0–1.0
console.log(moon.visibility.zone)          // 'A'–'D'
```

These are a direct replacement for the equivalent `suncalc` moon functions, with no external dependencies.

## Architecture

```text
src/
  math/       Vector/matrix, Chebyshev evaluation, root-finding
  time/       UTC → TAI → TT → TDB conversions, leap seconds, Julian Day
  spk/        JPL DAF/SPK kernel parser, Chebyshev segment evaluator
  frames/     IERS Q·R·W chain: precession + nutation + ERA + polar motion
  observer/   WGS84 geodetic → ECEF, topocentric ENU, Bennett refraction
  bodies/     Moon/Sun state computation, illumination, crescent width
  events/     Rise/set solver, twilight, best-time computation
  visibility/ Yallop q-test, Odeh zones, crescent geometry
  api/        User-facing functions, kernel management
  cli/        Command-line interface
```

See the [Architecture wiki page](https://github.com/acamarata/moon-sighting/wiki/Architecture) for a full technical description.

## CLI

```bash
# Setup (one-time)
npx moon-sighting download-kernels

# Sighting report
npx moon-sighting sighting 51.5 -0.1 2025-03-29
npx moon-sighting sighting 21.4 39.8  # Mecca

# Moon phase
npx moon-sighting phase 2025-03-01

# Verify downloaded kernels
npx moon-sighting verify-kernels

# Benchmark
npx moon-sighting benchmark
```

## Compatibility

| Environment | Support |
| ----------- | ------- |
| Node.js 20+ | Full (all features) |
| Node.js 22, 24 | Full |
| Browser | Partial (no auto-download; supply kernel buffer) |
| ESM | `import` from `moon-sighting` |
| CommonJS | `require('moon-sighting')` |
| TypeScript | Full type definitions included |

## TypeScript

```ts
import type {
  Observer,
  MoonSightingReport,
  MoonPhaseResult,
  MoonPosition,
  MoonIlluminationResult,
  MoonVisibilityEstimate,
  MoonSnapshot,
  YallopCategory,
  OdehZone,
  KernelConfig,
} from 'moon-sighting'
```

## Documentation

Full documentation is on the [GitHub Wiki](https://github.com/acamarata/moon-sighting/wiki):

- [Getting Started](https://github.com/acamarata/moon-sighting/wiki/Getting-Started)
- [API Reference](https://github.com/acamarata/moon-sighting/wiki/API-Reference)
- [Architecture](https://github.com/acamarata/moon-sighting/wiki/Architecture)
- [Crescent Visibility Criteria](https://github.com/acamarata/moon-sighting/wiki/Crescent-Visibility)
- [Ephemeris and Kernel Setup](https://github.com/acamarata/moon-sighting/wiki/Ephemeris)
- [Time Scales](https://github.com/acamarata/moon-sighting/wiki/Time-Scales)
- [Reference Frames](https://github.com/acamarata/moon-sighting/wiki/Reference-Frames)
- [Observer Model and Refraction](https://github.com/acamarata/moon-sighting/wiki/Observer-Model)
- [Validation](https://github.com/acamarata/moon-sighting/wiki/Validation)

## Related

- [nrel-spa](https://github.com/acamarata/nrel-spa): Pure JS solar position algorithm (zero deps)
- [pray-calc](https://github.com/acamarata/pray-calc): Islamic prayer times with dynamic angle algorithm
- [luxon-hijri](https://github.com/acamarata/luxon-hijri): Hijri/Gregorian calendar conversion

## Acknowledgments

Crescent visibility criteria implemented from:

- B.D. Yallop, "A Method for Predicting the First Sighting of the New Crescent Moon," NAO Technical Note No. 69, Royal Greenwich Observatory, 1997.
- M.Sh. Odeh, "New Criterion for Lunar Crescent Visibility," Experimental Astronomy 18(1), 39–64, 2006.

Planetary ephemeris data from:

- JPL DE442S. Jet Propulsion Laboratory, NASA. Ryan S. Park et al. (2021). "The JPL Planetary and Lunar Ephemerides DE440 and DE441." Astronomical Journal 161(3), 105. [doi:10.3847/1538-3881/abd414](https://doi.org/10.3847/1538-3881/abd414)

NAIF SPICE toolkit concepts:

- Navigation and Ancillary Information Facility (NAIF), Jet Propulsion Laboratory.

## License

MIT. See [LICENSE](LICENSE).

The DE442S kernel data is provided by NASA/JPL and is not redistributed with this package. It is downloaded separately from the NAIF public server.
