[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / getMoonIllumination

# Function: getMoonIllumination()

> **getMoonIllumination**(`date?`): [`MoonIlluminationResult`](../interfaces/MoonIlluminationResult.md)

Defined in: [api/index.ts:592](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/api/index.ts#L592)

Compute the Moon's illumination fraction, phase cycle position, and bright limb angle.

Works WITHOUT a kernel (uses Meeus Ch. 47/48 approximation).
Accuracy: illumination fraction ~0.5%, phase fraction ~0.003.
Drop-in replacement for suncalc.getMoonIllumination() — same field names and conventions.

## Parameters

### date?

`Date` = `...`

Date to compute illumination for (default: now)

## Returns

[`MoonIlluminationResult`](../interfaces/MoonIlluminationResult.md)

fraction (0-1), phase (0-1 cycle), angle (bright limb position angle, radians), isWaxing

## Example

```ts
const illum = getMoonIllumination(new Date())
console.log(illum.fraction)  // e.g. 0.43 (43% illuminated)
console.log(illum.phase)     // e.g. 0.18 (waxing crescent territory)
```
