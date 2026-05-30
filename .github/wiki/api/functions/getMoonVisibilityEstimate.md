[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / getMoonVisibilityEstimate

# Function: getMoonVisibilityEstimate()

> **getMoonVisibilityEstimate**(`date?`, `lat`, `lon`, `elevation?`): [`MoonVisibilityEstimate`](../interfaces/MoonVisibilityEstimate.md)

Defined in: [api/index.ts:647](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/api/index.ts#L647)

Quick kernel-free crescent visibility estimate using the Odeh criterion.

Computes approximate crescent geometry (ARCL, ARCV, W) from Meeus Ch. 47
positions at the given observation time and applies the Odeh V-parameter formula.
Accuracy is limited by the Meeus approximation (~0.3°) and the fact that
"best time" is not computed — pass your estimated observation time.

For precise crescent work, use getMoonSightingReport() with the DE442S kernel.

## Parameters

### date?

`Date` = `...`

Observation time (default: now). Use a post-sunset time for best results.

### lat

`number`

Observer geodetic latitude in degrees (north positive)

### lon

`number`

Observer longitude in degrees (east positive)

### elevation?

`number` = `0`

Observer height above WGS84 ellipsoid in meters (default: 0)

## Returns

[`MoonVisibilityEstimate`](../interfaces/MoonVisibilityEstimate.md)

MoonVisibilityEstimate with Odeh V, zone, and geometry values

## Example

```ts
// Estimate crescent visibility at sunset + 40 min in Mecca
const obs = new Date('2025-03-01T15:30:00Z')  // ~sunset + 40 min in Mecca
const est = getMoonVisibilityEstimate(obs, 21.42, 39.83)
console.log(est.zone)               // 'A' through 'D'
console.log(est.isVisibleNakedEye)  // true/false
```
