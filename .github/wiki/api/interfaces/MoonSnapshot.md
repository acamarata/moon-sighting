[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / MoonSnapshot

# Interface: MoonSnapshot

Defined in: [types.ts:277](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L277)

Combined kernel-free moon snapshot from getMoon().
Bundles phase, position, illumination, and a quick visibility estimate
into a single call.

## Properties

### illumination

> **illumination**: [`MoonIlluminationResult`](MoonIlluminationResult.md)

Defined in: [types.ts:283](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L283)

Illumination fraction, phase cycle, bright limb angle, waxing/waning

***

### phase

> **phase**: [`MoonPhaseResult`](MoonPhaseResult.md)

Defined in: [types.ts:279](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L279)

Phase name, illumination, age, and next events

***

### position

> **position**: [`MoonPosition`](MoonPosition.md)

Defined in: [types.ts:281](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L281)

Topocentric az/alt, distance, parallactic angle

***

### visibility

> **visibility**: [`MoonVisibilityEstimate`](MoonVisibilityEstimate.md)

Defined in: [types.ts:285](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L285)

Quick Odeh-based crescent visibility estimate
