[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / getMoon

# Function: getMoon()

> **getMoon**(`date?`, `lat`, `lon`, `elevation?`): [`MoonSnapshot`](../interfaces/MoonSnapshot.md)

Defined in: [api/index.ts:727](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/api/index.ts#L727)

Combined kernel-free moon snapshot for a time and location.

Calls getMoonPhase(), getMoonPosition(), getMoonIllumination(), and
getMoonVisibilityEstimate() in a single request. Convenient for dashboards
and apps that need all four values together.

Works WITHOUT a kernel (all Meeus-based approximations).

## Parameters

### date?

`Date` = `...`

Date and time (default: now)

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

[`MoonSnapshot`](../interfaces/MoonSnapshot.md)

MoonSnapshot with phase, position, illumination, and visibility estimate

## Example

```ts
const moon = getMoon(new Date(), 51.5, -0.1)
console.log(moon.phase.phaseName)          // 'Waxing Crescent'
console.log(moon.position.altitude)        // degrees above horizon
console.log(moon.illumination.fraction)    // 0.0 to 1.0
console.log(moon.visibility.zone)          // 'A' through 'D'
```
