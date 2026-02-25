# moon-calc

High-accuracy lunar crescent visibility and moon sighting calculations using JPL DE442S ephemerides.

## What this library does

moon-calc computes whether the new crescent moon will be visible at a specific location on a specific date. It produces the geometric quantities used by astronomers and Islamic lunar calendar authorities worldwide, including the Yallop q-test and Odeh visibility zones.

It also computes moon phase data, rise/set times, and twilight periods for any location.

## Key design decisions

**JPL DE442S, not VSOP87 or Meeus.** The library uses the same planetary ephemeris as professional observatories. It reads an SPK binary kernel from NASA's NAIF, covering 1849–2150 with sub-arcsecond accuracy. This makes the position calculations verifiable against SPICE and JPL Horizons.

**Two authoritative visibility criteria.** The Yallop q-test (NAO TN 69, 1997) and Odeh V-parameter (Experimental Astronomy, 2006) are both implemented exactly as published, with all five required geometric variables (ARCL, ARCV, DAZ, W, Lag).

**Kernel not bundled.** The DE442S kernel is 31 MB. It is downloaded once to a local cache, verified by checksum, and reused. This keeps the npm package small.

**Lite mode without kernel.** Moon phase, illumination, and next new/full moon work immediately, no kernel needed. These use Meeus approximations (accurate to ~1°).

## Pages

- [Getting Started](Getting-Started): Installation, kernel setup, first sighting report
- [API Reference](API-Reference): Complete function and type documentation
- [Architecture](Architecture): Module structure, data flow, design rationale
- [Crescent Visibility](Crescent-Visibility): Yallop and Odeh criteria explained in depth
- [Ephemeris](Ephemeris): DE442S kernel format (DAF/SPK), segment chaining, evaluation
- [Time Scales](Time-Scales): UTC, TAI, TT, TDB, UT1, delta-T, leap seconds
- [Reference Frames](Reference-Frames): IERS Q·R·W chain, precession, nutation, ERA
- [Observer Model](Observer-Model): WGS84, topocentric transforms, atmospheric refraction
- [Validation](Validation): Accuracy goals, test methodology, SPICE/Horizons comparison

## Quick example

```ts
import { initKernels, getMoonSightingReport } from 'moon-calc'

await initKernels()

const report = await getMoonSightingReport(new Date('2025-03-29'), {
  lat: 51.5074, lon: -0.1278, elevation: 10
})

console.log(report.yallop.category)  // 'A'
console.log(report.guidance)
```

## Related packages

- [nrel-spa](https://github.com/acamarata/nrel-spa): Solar position algorithm (zero deps)
- [pray-calc](https://github.com/acamarata/pray-calc): Islamic prayer times
- [luxon-hijri](https://github.com/acamarata/luxon-hijri): Hijri/Gregorian conversion
