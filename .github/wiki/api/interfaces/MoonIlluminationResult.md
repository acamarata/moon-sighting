[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / MoonIlluminationResult

# Interface: MoonIlluminationResult

Defined in: [types.ts:47](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L47)

Moon illumination from getMoonIllumination().
Computed via Meeus Ch. 47/48 (no kernel required).
Accuracy: fraction ~0.5%, phase fraction ~0.003.

## Properties

### angle

> **angle**: `number`

Defined in: [types.ts:59](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L59)

Position angle of the midpoint of the bright limb, measured eastward from
the north celestial pole, in radians. Matches the suncalc convention.

***

### fraction

> **fraction**: `number`

Defined in: [types.ts:49](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L49)

Illuminated fraction of the Moon disk, 0 (new moon) to 1 (full moon)

***

### isWaxing

> **isWaxing**: `boolean`

Defined in: [types.ts:61](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L61)

True while elongation is increasing (new moon toward full moon)

***

### phase

> **phase**: `number`

Defined in: [types.ts:54](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L54)

Phase cycle fraction in [0, 1):
  0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
