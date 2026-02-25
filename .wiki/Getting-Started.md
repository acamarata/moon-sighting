# Getting Started

## Requirements

- Node.js 20 or later (for full mode with kernel)
- ~35 MB disk space for the kernel cache
- Internet access on first run (for kernel download)

Moon phase queries work in browsers and any runtime without a kernel or network access.

## Install

```bash
npm install moon-sighting
# or
pnpm add moon-sighting
```

## Download the kernel (one time)

moon-sighting uses the JPL DE442S planetary ephemeris. The binary kernel file is 31 MB and is not bundled with the npm package.

```bash
npx moon-sighting download-kernels
```

This downloads two files:

- `de442s.bsp` (31 MB): planetary ephemeris, covering 1849–2150
- `naif0012.tls` (4 KB): leap-second table

Default cache location:
- Linux/macOS: `~/.cache/moon-sighting/`
- Windows: `%LOCALAPPDATA%\moon-sighting\`

To use a custom cache directory:

```ts
await initKernels({ cacheDir: '/my/data/dir' })
```

To verify the download afterward:

```bash
npx moon-sighting verify-kernels
```

## First sighting report

```ts
import { initKernels, getMoonSightingReport } from 'moon-sighting'

// Load the kernel once per process
await initKernels()

const observer = {
  lat: 51.5074,   // London
  lon: -0.1278,
  elevation: 10,  // meters above WGS84 ellipsoid
  name: 'London, UK',
}

const report = await getMoonSightingReport(new Date('2025-03-29'), observer)

// Summary
console.log(report.yallop.category)   // 'A' through 'F'
console.log(report.odeh.zone)         // 'A' through 'D'
console.log(report.guidance)

// Event times
console.log(report.sunsetUTC)
console.log(report.moonsetUTC)
console.log(report.lagMinutes)
console.log(report.bestTimeUTC)

// Crescent geometry
console.log(report.geometry)
// { ARCL: 12.3, ARCV: 8.1, DAZ: -2.4, W: 0.21, lag: 67 }

// Where to look
console.log(report.moonPosition)
// { azimuth: 258.3, altitude: 7.9 }
```

## Moon phase (no kernel needed)

```ts
import { getMoonPhase } from 'moon-sighting'

const phase = getMoonPhase()
console.log(phase.phase)         // 'waxing-crescent'
console.log(phase.illumination)  // 23.4
console.log(phase.age)           // 4.2  (hours since last new moon)
console.log(phase.nextFullMoon)  // Date

// For a specific date
const past = getMoonPhase(new Date('2024-01-01'))
```

## Rise and set times

```ts
import { initKernels, getSunMoonEvents } from 'moon-sighting'

await initKernels()

const events = await getSunMoonEvents(new Date('2025-03-29'), {
  lat: 21.4225, lon: 39.8262, elevation: 300, name: 'Mecca'
})

console.log(events.sunsetUTC)
console.log(events.moonsetUTC)
console.log(events.civilTwilightEndUTC)
```

## Supplying the kernel manually

### File path (Node.js)

```ts
await initKernels({
  planetary: { type: 'file', path: '/data/kernels/de442s.bsp' },
  leapSeconds: { type: 'file', path: '/data/kernels/naif0012.tls' },
})
```

### ArrayBuffer (browser)

```ts
const response = await fetch('/kernels/de442s.bsp')
const data = await response.arrayBuffer()

await initKernels({
  planetary: { type: 'buffer', data, name: 'de442s.bsp' },
})
```

### URL (streaming load)

```ts
await initKernels({
  planetary: { type: 'url', url: 'https://example.com/kernels/de442s.bsp' },
})
```

## Accuracy tips

**Supply the current delta-T from IERS for maximum accuracy.** The built-in polynomial can be off by up to 5 seconds near the present date, introducing a few arcseconds of error in azimuth and altitude.

```ts
// IERS Bulletin A value for UT1-UTC (current, as of 2025-03)
await getMoonSightingReport(date, {
  ...observer,
  ut1utc: 0.0341,  // seconds, from IERS Bulletin A
})
```

**The biggest uncertainty in practice is atmospheric refraction**, not the ephemeris. At 5° altitude, refraction uncertainty at non-standard conditions can exceed 10 arcminutes, far larger than any ephemeris error.

## CLI

All features are accessible from the command line:

```bash
# Download kernels
npx moon-sighting download-kernels

# Sighting report
npx moon-sighting sighting 51.5 -0.1 2025-03-29

# Moon phase
npx moon-sighting phase 2025-03-01

# Verify kernel integrity
npx moon-sighting verify-kernels

# Performance benchmark
npx moon-sighting benchmark
```

---

*Previous: [Home](Home) | Next: [API Reference](API-Reference)*
