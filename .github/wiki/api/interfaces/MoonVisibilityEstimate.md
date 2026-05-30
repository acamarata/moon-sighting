[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / MoonVisibilityEstimate

# Interface: MoonVisibilityEstimate

Defined in: [types.ts:246](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L246)

Kernel-free Odeh-based crescent visibility estimate from getMoonVisibilityEstimate().
Computed via Meeus Ch. 47 approximation at the given observation time.
For DE442S-quality results, use getMoonSightingReport().

## Properties

### ARCL

> **ARCL**: `number`

Defined in: [types.ts:261](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L261)

Arc of light (Sun-Moon elongation) in degrees

***

### ARCV

> **ARCV**: `number`

Defined in: [types.ts:263](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L263)

Arc of vision (Moon airless altitude minus Sun airless altitude) in degrees

***

### description

> **description**: `string`

Defined in: [types.ts:255](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L255)

Human-readable zone description

***

### isApproximate

> **isApproximate**: `true`

Defined in: [types.ts:269](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L269)

Always true: computed via Meeus approximation, not DE442S

***

### isVisibleNakedEye

> **isVisibleNakedEye**: `boolean`

Defined in: [types.ts:257](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L257)

True for zone A

***

### isVisibleWithOpticalAid

> **isVisibleWithOpticalAid**: `boolean`

Defined in: [types.ts:259](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L259)

True for zones A and B

***

### moonAboveHorizon

> **moonAboveHorizon**: `boolean`

Defined in: [types.ts:267](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L267)

True when Moon is above the horizon at the given time

***

### V

> **V**: `number`

Defined in: [types.ts:251](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L251)

Odeh V parameter: V = ARCV − f(W).
Positive = crescent exceeds minimum visibility threshold.

***

### W

> **W**: `number`

Defined in: [types.ts:265](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L265)

Topocentric crescent width in arc minutes

***

### zone

> **zone**: [`OdehZone`](../type-aliases/OdehZone.md)

Defined in: [types.ts:253](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L253)

Visibility zone A through D
