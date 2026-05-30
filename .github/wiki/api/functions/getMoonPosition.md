[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / getMoonPosition

# Function: getMoonPosition()

> **getMoonPosition**(`date?`, `lat`, `lon`, `elevation?`): [`MoonPosition`](../interfaces/MoonPosition.md)

Defined in: [api/index.ts:539](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/api/index.ts#L539)

Compute the Moon's topocentric position (azimuth, altitude, distance) for an observer.

Works WITHOUT a kernel (uses Meeus Ch. 47 approximation).
Accuracy: azimuth/altitude ~0.3°, distance ~300 km.
For precision crescent work, use getMoonSightingReport() with the DE442S kernel.

## Parameters

### date?

`Date` = `...`

Date and time to compute position for (default: now)

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

[`MoonPosition`](../interfaces/MoonPosition.md)

Topocentric az/alt (degrees), distance (km), parallactic angle (radians)

## Example

```ts
const pos = getMoonPosition(new Date(), 51.5, -0.1)
console.log(pos.azimuth, pos.altitude)  // e.g. 212.4, 38.1
```
