[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / MoonSightingReport

# Interface: MoonSightingReport

Defined in: [types.ts:344](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L344)

## Properties

### bestTimeUTC

> **bestTimeUTC**: `Date` \| `null`

Defined in: [types.ts:356](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L356)

Best observation time (Odeh/Yallop: T_s + 4/9 * Lag)

***

### bestTimeWindowUTC

> **bestTimeWindowUTC**: \[`Date`, `Date`\] \| `null`

Defined in: [types.ts:358](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L358)

Conservative observation window [bestTime - 20min, bestTime + 20min]

***

### date

> **date**: `Date`

Defined in: [types.ts:346](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L346)

Date for which the sighting report was computed

***

### ephemerisSource

> **ephemerisSource**: `"DE442S"` \| `"approximate"`

Defined in: [types.ts:386](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L386)

Source ephemeris used for this calculation

***

### geometry

> **geometry**: [`CrescentGeometry`](CrescentGeometry.md) \| `null`

Defined in: [types.ts:371](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L371)

***

### guidance

> **guidance**: `string`

Defined in: [types.ts:382](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L382)

Plain-language direction for observers.
Includes where to look (azimuth, altitude), when (best time), and what to expect.

***

### illumination

> **illumination**: `number` \| `null`

Defined in: [types.ts:366](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L366)

Moon illumination percent at best time

***

### lagMinutes

> **lagMinutes**: `number` \| `null`

Defined in: [types.ts:354](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L354)

Moonset minus sunset, in minutes. Null if either event is null.

***

### moonAboveHorizon

> **moonAboveHorizon**: `boolean` \| `null`

Defined in: [types.ts:388](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L388)

Whether the Moon is even above the horizon at best time

***

### moonAge

> **moonAge**: `number` \| `null`

Defined in: [types.ts:368](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L368)

Hours since conjunction (new moon)

***

### moonPosition

> **moonPosition**: [`AzAlt`](AzAlt.md) \| `null`

Defined in: [types.ts:362](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L362)

Topocentric Moon position at best time

***

### moonsetUTC

> **moonsetUTC**: `Date` \| `null`

Defined in: [types.ts:352](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L352)

***

### observer

> **observer**: [`Observer`](Observer.md)

Defined in: [types.ts:348](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L348)

Observer location used

***

### odeh

> **odeh**: [`OdehResult`](OdehResult.md) \| `null`

Defined in: [types.ts:375](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L375)

***

### sightingPossible

> **sightingPossible**: `boolean`

Defined in: [types.ts:390](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L390)

Whether sighting is geometrically possible (lag > 0, Moon above horizon at best time)

***

### sunPosition

> **sunPosition**: [`AzAlt`](AzAlt.md) \| `null`

Defined in: [types.ts:364](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L364)

Topocentric Sun position at best time

***

### sunsetUTC

> **sunsetUTC**: `Date` \| `null`

Defined in: [types.ts:351](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L351)

***

### yallop

> **yallop**: [`YallopResult`](YallopResult.md) \| `null`

Defined in: [types.ts:374](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L374)
