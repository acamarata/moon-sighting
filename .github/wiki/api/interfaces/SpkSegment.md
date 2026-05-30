[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / SpkSegment

# Interface: SpkSegment

Defined in: [types.ts:459](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L459)

A segment in a JPL SPK (DAF) kernel file

## Properties

### center

> **center**: `number`

Defined in: [types.ts:463](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L463)

NAIF body ID of the center body

***

### dataOffset

> **dataOffset**: `number`

Defined in: [types.ts:473](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L473)

Byte offset of the data array in the file

***

### dataSize

> **dataSize**: `number`

Defined in: [types.ts:475](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L475)

Number of double-precision values in the data array

***

### dataType

> **dataType**: `2` \| `3`

Defined in: [types.ts:467](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L467)

SPK data type (2 = Chebyshev position only, 3 = Chebyshev position + velocity)

***

### endET

> **endET**: `number`

Defined in: [types.ts:471](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L471)

Segment end time in ET seconds past J2000

***

### frame

> **frame**: `number`

Defined in: [types.ts:465](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L465)

Reference frame code

***

### startET

> **startET**: `number`

Defined in: [types.ts:469](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L469)

Segment start time in ET seconds past J2000

***

### target

> **target**: `number`

Defined in: [types.ts:461](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L461)

NAIF body ID of the target body
