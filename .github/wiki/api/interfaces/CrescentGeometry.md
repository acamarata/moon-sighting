[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / CrescentGeometry

# Interface: CrescentGeometry

Defined in: [types.ts:118](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L118)

The five geometric quantities used by all major crescent visibility criteria.
All values computed at best time (T_b) unless noted.

## Properties

### ARCL

> **ARCL**: `number`

Defined in: [types.ts:120](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L120)

Arc of light: topocentric Sun-Moon angular separation (elongation), degrees

***

### ARCV

> **ARCV**: `number`

Defined in: [types.ts:125](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L125)

Arc of vision: Moon airless altitude minus Sun airless altitude, degrees.
Used as the primary visibility discriminant in both Yallop and Odeh.

***

### DAZ

> **DAZ**: `number`

Defined in: [types.ts:130](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L130)

Relative azimuth: Sun azimuth minus Moon azimuth, normalized to [-180, 180], degrees.
Positive = Moon north of Sun.

***

### lag

> **lag**: `number`

Defined in: [types.ts:137](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L137)

Moonset minus sunset in minutes. Negative = Moon sets before Sun (no sighting possible).

***

### W

> **W**: `number`

Defined in: [types.ts:135](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L135)

Topocentric crescent width in arc minutes.
Used directly in Odeh's polynomial V expression.
