[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / MoonPhaseResult

# Interface: MoonPhaseResult

Defined in: [types.ts:300](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L300)

## Properties

### age

> **age**: `number`

Defined in: [types.ts:310](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L310)

Hours since last new moon

***

### elongationDeg

> **elongationDeg**: `number`

Defined in: [types.ts:312](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L312)

Ecliptic longitude of the Moon minus the Sun, degrees [0, 360)

***

### illumination

> **illumination**: `number`

Defined in: [types.ts:308](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L308)

Illuminated fraction 0-100 (percent)

***

### isWaxing

> **isWaxing**: `boolean`

Defined in: [types.ts:314](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L314)

True when Moon is moving away from the Sun (illumination increasing)

***

### nextFullMoon

> **nextFullMoon**: `Date`

Defined in: [types.ts:318](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L318)

UTC date of the next full moon

***

### nextNewMoon

> **nextNewMoon**: `Date`

Defined in: [types.ts:316](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L316)

UTC date of the next new moon

***

### phase

> **phase**: [`MoonPhaseName`](../type-aliases/MoonPhaseName.md)

Defined in: [types.ts:302](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L302)

Named phase based on illumination and waxing/waning state

***

### phaseName

> **phaseName**: `string`

Defined in: [types.ts:304](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L304)

Human-readable phase name, e.g. "Waxing Crescent"

***

### phaseSymbol

> **phaseSymbol**: `string`

Defined in: [types.ts:306](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L306)

Moon phase emoji symbol, e.g. "🌒"

***

### prevNewMoon

> **prevNewMoon**: `Date`

Defined in: [types.ts:320](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L320)

UTC date of the previous new moon
