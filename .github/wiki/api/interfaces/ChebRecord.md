[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / ChebRecord

# Interface: ChebRecord

Defined in: [types.ts:479](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L479)

A decoded Chebyshev record from a Type 2 or Type 3 SPK segment

## Properties

### coeffs

> **coeffs**: `Float64Array`\<`ArrayBufferLike`\>[]

Defined in: [types.ts:485](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L485)

Chebyshev coefficients for X, Y, Z [3][degree+1]

***

### degree

> **degree**: `number`

Defined in: [types.ts:487](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L487)

Degree of the polynomial

***

### mid

> **mid**: `number`

Defined in: [types.ts:481](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L481)

Midpoint of the record interval in ET seconds past J2000

***

### radius

> **radius**: `number`

Defined in: [types.ts:483](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L483)

Half-width of the record interval in seconds
