# moon-sighting

[![npm version](https://img.shields.io/npm/v/moon-sighting.svg)](https://www.npmjs.com/package/moon-sighting)
[![CI](https://github.com/acamarata/moon-sighting/actions/workflows/ci.yml/badge.svg)](https://github.com/acamarata/moon-sighting/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

High-accuracy lunar crescent visibility and moon sighting calculations for Node.js and browsers. Uses the JPL DE442S ephemeris with full IERS Earth orientation for sub-arcsecond topocentric Moon and Sun positions. Implements the Yallop (NAO TN 69) and Odeh (Experimental Astronomy 2006) criteria.

## Installation

```bash
npm install moon-sighting
```

Then download the JPL kernel (31 MB, one-time):

```bash
npx moon-sighting download-kernels
```

## Quick Start

```ts
import { initKernels, getMoonSightingReport } from 'moon-sighting'

await initKernels()

const report = await getMoonSightingReport(new Date('2025-03-29'), {
  lat: 51.5074, lon: -0.1278, elevation: 10
})

console.log(report.yallop.category)   // 'A' — easily visible to the naked eye
console.log(report.odeh.zone)         // 'A' — visible with naked eye
console.log(report.guidance)
```

Five functions work without any kernel (Meeus approximation, ~0.3° accuracy):

```ts
import { getMoonPhase, getMoonPosition, getMoonIllumination,
         getMoonVisibilityEstimate, getMoon } from 'moon-sighting'

const phase = getMoonPhase()
console.log(phase.phaseName)      // 'Waxing Crescent'
console.log(phase.illumination)   // 14.3 (percent)
```

## Documentation

Full documentation on the [GitHub Wiki](https://github.com/acamarata/moon-sighting/wiki):

- [Getting Started](https://github.com/acamarata/moon-sighting/wiki/Getting-Started)
- [API Reference](https://github.com/acamarata/moon-sighting/wiki/API-Reference)
- [Architecture](https://github.com/acamarata/moon-sighting/wiki/Architecture)
- [Crescent Visibility Criteria](https://github.com/acamarata/moon-sighting/wiki/Crescent-Visibility)
- [Ephemeris and Kernel Setup](https://github.com/acamarata/moon-sighting/wiki/Ephemeris)

## Related

- [nrel-spa](https://github.com/acamarata/nrel-spa): Pure JS solar position algorithm
- [pray-calc](https://github.com/acamarata/pray-calc): Islamic prayer times with dynamic angle algorithm

## License

MIT. See [LICENSE](LICENSE).
