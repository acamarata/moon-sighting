[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / KernelConfig

# Interface: KernelConfig

Defined in: [types.ts:405](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L405)

## Properties

### cacheDir?

> `optional` **cacheDir?**: `string`

Defined in: [types.ts:414](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L414)

Directory for the download cache.
Defaults to ~/.cache/moon-sighting on POSIX, %LOCALAPPDATA%\moon-sighting on Windows.

***

### checksumOverride?

> `optional` **checksumOverride?**: `string`

Defined in: [types.ts:419](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L419)

SHA-256 checksum of de442s.bsp for download verification.
Bundled default matches the NAIF distribution as of 2024.

***

### leapSeconds?

> `optional` **leapSeconds?**: [`KernelSource`](../type-aliases/KernelSource.md)

Defined in: [types.ts:409](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L409)

Leap-second kernel — defaults to naif0012.tls via auto-download

***

### planetary?

> `optional` **planetary?**: [`KernelSource`](../type-aliases/KernelSource.md)

Defined in: [types.ts:407](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L407)

Planetary SPK kernel — defaults to de442s.bsp via auto-download
