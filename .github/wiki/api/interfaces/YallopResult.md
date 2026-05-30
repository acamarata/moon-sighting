[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / YallopResult

# Interface: YallopResult

Defined in: [types.ts:176](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L176)

## Properties

### category

> **category**: [`YallopCategory`](../type-aliases/YallopCategory.md)

Defined in: [types.ts:180](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L180)

Visibility category A through F

***

### description

> **description**: `string`

Defined in: [types.ts:182](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L182)

Human-readable interpretation

***

### isBelowDanjonLimit

> **isBelowDanjonLimit**: `boolean`

Defined in: [types.ts:188](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L188)

True for category F

***

### isVisibleNakedEye

> **isVisibleNakedEye**: `boolean`

Defined in: [types.ts:184](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L184)

True for categories A and B

***

### q

> **q**: `number`

Defined in: [types.ts:178](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L178)

The continuous q parameter (higher = more visible)

***

### requiresOpticalAid

> **requiresOpticalAid**: `boolean`

Defined in: [types.ts:186](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L186)

True for categories C and D

***

### Wprime

> **Wprime**: `number`

Defined in: [types.ts:190](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L190)

Topocentric crescent width W' used in the q formula, arc minutes
