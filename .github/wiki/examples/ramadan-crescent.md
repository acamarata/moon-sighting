# Ramadan Crescent Prediction

Predicting the first visible crescent of Ramadan is the main use case for this library. The crescent that marks the beginning of Ramadan is the first sighting of the new crescent after the new moon that precedes the month.

## Find the first visible night for Ramadan 1447

Ramadan 1447 AH begins with the first crescent sighting after the new moon on approximately 28 February 2026.

```typescript
import { initKernels, getMoonSightingReport } from 'moon-sighting'

await initKernels()

// Observer: Mecca (the reference location for many Islamic calendars)
const mecca = { lat: 21.42, lon: 39.83, elevation: 277 }

// Scan three nights starting from the calculated new moon
const startDate = new Date('2026-02-28')
const results = []

for (let i = 0; i < 4; i++) {
  const date = new Date(startDate)
  date.setDate(startDate.getDate() + i)
  const r = await getMoonSightingReport(date, mecca)
  results.push({ date, report: r })
}

// Print the night when sighting becomes possible
for (const { date, report } of results) {
  const cat = report.yallop?.category ?? '-'
  const zone = report.odeh?.zone ?? '-'
  const guidance = report.sightingPossible
    ? `Yallop: ${cat}, Odeh: ${zone}`
    : 'Sighting not possible'
  console.log(`${date.toDateString()}: ${guidance}`)
}
```

Expected output (approximate):

```
Sat Feb 28 2026: Sighting not possible
Sun Mar 01 2026: Sighting not possible
Mon Mar 02 2026: Yallop: B, Odeh: A
Tue Mar 03 2026: Yallop: A, Odeh: A
```

The first night when `sightingPossible` is true and Yallop returns A or B is the candidate for Ramadan's start.

## Global visibility scan

Different locations see the crescent on different nights. Use this pattern to check multiple cities and identify the global first sighting.

```typescript
import { initKernels, getMoonSightingReport } from 'moon-sighting'

await initKernels()

const cities = [
  { name: 'Mecca',       lat: 21.42, lon:  39.83, elevation: 277 },
  { name: 'Istanbul',    lat: 41.01, lon:  28.97, elevation: 100 },
  { name: 'Jakarta',     lat: -6.20, lon: 106.82, elevation: 8   },
  { name: 'London',      lat: 51.51, lon:  -0.13, elevation: 11  },
  { name: 'New York',    lat: 40.71, lon: -74.00, elevation: 10  },
  { name: 'Los Angeles', lat: 34.05, lon:-118.24, elevation: 89  },
]

const date = new Date('2026-03-02')

for (const city of cities) {
  const r = await getMoonSightingReport(date, city)
  if (!r.sightingPossible) {
    console.log(`${city.name}: not possible`)
    continue
  }
  const cat = r.yallop?.category ?? '?'
  const lag = r.lagMinutes?.toFixed(0) ?? '?'
  console.log(`${city.name}: Yallop ${cat}, lag ${lag} min, ${r.guidance?.slice(0, 60)}`)
}
```

## Interpret the results

The Yallop categories for the purpose of Ramadan determination:

| Category | Meaning for crescent sighting |
| -------- | ----------------------------- |
| A | Easily visible to the naked eye. Most scholars accept this. |
| B | Visible under perfect conditions. Accepted with naked-eye report. |
| C | May need optical aid to locate. Binoculars may find it. |
| D | Optical aid only; naked-eye sighting effectively impossible. |
| E, F | Not visible by any means. |

For a detailed explanation of the criteria and their Islamic jurisprudence context, see [Crescent Visibility](../Crescent-Visibility).
