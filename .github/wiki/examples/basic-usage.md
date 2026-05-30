# Basic Usage Examples

## Crescent visibility report with JPL kernel

```typescript
import { initKernels, getMoonSightingReport } from 'moon-sighting'

// One-time kernel setup (downloads ~31 MB from NASA NAIF on first run)
await initKernels()

// Full sighting report for London, 29 March 2025
const report = await getMoonSightingReport(new Date('2025-03-29'), {
  lat: 51.5074,
  lon: -0.1278,
  elevation: 10
})

console.log(report.yallop.category)   // 'A' — easily visible to the naked eye
console.log(report.odeh.zone)         // 'A' — visible with naked eye
console.log(report.bestTimeUTC)       // Date: optimal observation window
console.log(report.guidance)
// "Best time to look: 2025-03-29 20:14 UTC (73 min after sunset).
//  Look West at 8° above the horizon. Yallop: A. Odeh: A."
```

## Quick kernel-free visibility estimate

No kernel download required. Uses the Meeus approximation (~0.3° accuracy).

```typescript
import { getMoonVisibilityEstimate } from 'moon-sighting'

// Estimate at approximately sunset + 40 min in Mecca
const obs = new Date('2025-03-02T15:30:00Z')
const est = getMoonVisibilityEstimate(obs, 21.42, 39.83, 277)

console.log(est.zone)               // 'A' through 'D'
console.log(est.V)                  // Odeh V parameter
console.log(est.isVisibleNakedEye)  // true/false
console.log(est.ARCL, est.ARCV, est.W)
```

## Check from multiple cities

```typescript
import { initKernels, getMoonSightingReport } from 'moon-sighting'

await initKernels()

const cities = [
  { name: 'Mecca',    lat: 21.42, lon: 39.83, elevation: 277 },
  { name: 'London',   lat: 51.51, lon: -0.13, elevation: 11  },
  { name: 'New York', lat: 40.71, lon: -74.00, elevation: 10 },
  { name: 'Karachi',  lat: 24.86, lon: 67.01, elevation: 13  },
]

const date = new Date('2025-03-29')
for (const city of cities) {
  const r = await getMoonSightingReport(date, city)
  const cat = r.yallop?.category ?? 'N/A'
  console.log(`${city.name}: Yallop=${cat} sighting=${r.sightingPossible}`)
}
```

## Moon phase and position (no kernel)

```typescript
import { getMoonPhase, getMoonPosition, getMoon } from 'moon-sighting'

const date = new Date('2025-03-04')

const phase = getMoonPhase(date)
console.log(phase.phaseName)      // 'Waxing Crescent'
console.log(phase.phaseSymbol)    // '🌒'
console.log(phase.illumination)   // percent

const pos = getMoonPosition(date, 51.5, -0.1, 10)
console.log(pos.azimuth, pos.altitude)  // e.g. 247.3, 22.8

// Or everything in one call
const moon = getMoon(date, 51.5, -0.1)
console.log(moon.phase.phaseName, moon.visibility.zone)
```
