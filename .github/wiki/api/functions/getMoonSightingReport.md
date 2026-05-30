[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / getMoonSightingReport

# Function: getMoonSightingReport()

> **getMoonSightingReport**(`date`, `observer`, `options?`): `Promise`\<[`MoonSightingReport`](../interfaces/MoonSightingReport.md)\>

Defined in: [api/index.ts:306](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/api/index.ts#L306)

Compute a complete moon sighting report for a date and location.

Returns all quantities needed for Islamic crescent sighting determination:
sunset/moonset times, best observation time, crescent geometry (ARCL, ARCV,
DAZ, W, Lag), Yallop category, Odeh zone, and plain-language guidance.

Requires initKernels() to have been called first (or pass kernels in options).

## Parameters

### date

`Date`

Date to check (UTC midnight or any time on that civil day)

### observer

[`Observer`](../interfaces/Observer.md)

Observer location and environmental parameters

### options?

[`SightingOptions`](../interfaces/SightingOptions.md)

Optional configuration for refraction model, best-time method, etc.

## Returns

`Promise`\<[`MoonSightingReport`](../interfaces/MoonSightingReport.md)\>

Complete MoonSightingReport

## Example

```ts
await initKernels()
const report = await getMoonSightingReport(new Date('2025-03-01'), {
  lat: 51.5074, lon: -0.1278, elevation: 10, name: 'London'
})
console.log(report.yallop.category)  // 'A' through 'F'
console.log(report.guidance)         // "Best time to look: ..."
```
