[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / getSunMoonEvents

# Function: getSunMoonEvents()

> **getSunMoonEvents**(`date`, `observer`, `options?`): `Promise`\<[`SunMoonEvents`](../interfaces/SunMoonEvents.md)\>

Defined in: [api/index.ts:833](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/api/index.ts#L833)

Get rise, set, and twilight times for the Sun and Moon on a given date.

Requires initKernels() for accurate results.

## Parameters

### date

`Date`

Date to compute events for

### observer

[`Observer`](../interfaces/Observer.md)

Observer location

### options?

`Pick`\<[`SightingOptions`](../interfaces/SightingOptions.md), `"kernels"`\>

Optional kernel configuration

## Returns

`Promise`\<[`SunMoonEvents`](../interfaces/SunMoonEvents.md)\>

SunMoonEvents with all times in UTC
