[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / Observer

# Interface: Observer

Defined in: [types.ts:86](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L86)

Observer location and environmental parameters

## Properties

### deltaT?

> `optional` **deltaT?**: `number`

Defined in: [types.ts:100](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L100)

Override TT - UT1 in seconds.
When provided, used directly. Otherwise the built-in polynomial is used.
For maximum accuracy, supply the current IERS value (typically within ±0.9s).

***

### elevation

> **elevation**: `number`

Defined in: [types.ts:92](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L92)

Height above WGS84 ellipsoid in meters

***

### lat

> **lat**: `number`

Defined in: [types.ts:88](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L88)

Geodetic latitude in degrees (north positive)

***

### lon

> **lon**: `number`

Defined in: [types.ts:90](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L90)

Longitude in degrees (east positive)

***

### name?

> `optional` **name?**: `string`

Defined in: [types.ts:94](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L94)

Optional label for the location

***

### pressure?

> `optional` **pressure?**: `number`

Defined in: [types.ts:107](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L107)

Atmospheric pressure in millibars (default 1013.25)

***

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types.ts:109](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L109)

Ambient temperature in Celsius (default 15)

***

### ut1utc?

> `optional` **ut1utc?**: `number`

Defined in: [types.ts:105](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L105)

Override UT1 - UTC in seconds (from IERS Bulletin A).
Takes precedence over deltaT when both are provided.
