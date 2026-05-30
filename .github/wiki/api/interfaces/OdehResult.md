[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / OdehResult

# Interface: OdehResult

Defined in: [types.ts:223](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L223)

## Properties

### description

> **description**: `string`

Defined in: [types.ts:232](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L232)

Human-readable interpretation

***

### isVisibleNakedEye

> **isVisibleNakedEye**: `boolean`

Defined in: [types.ts:234](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L234)

True for zone A

***

### isVisibleWithOpticalAid

> **isVisibleWithOpticalAid**: `boolean`

Defined in: [types.ts:236](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L236)

True for zones A and B

***

### V

> **V**: `number`

Defined in: [types.ts:228](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L228)

Continuous visibility parameter V = ARCV - (arcv_minimum(W)).
Positive = crescent exceeds minimum visibility threshold.

***

### zone

> **zone**: [`OdehZone`](../type-aliases/OdehZone.md)

Defined in: [types.ts:230](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L230)

Visibility zone A through D
