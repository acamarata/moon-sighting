[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / downloadKernels

# Function: downloadKernels()

> **downloadKernels**(`config?`): `Promise`\<\{ `leapSecondsPath`: `string`; `planetaryPath`: `string`; \}\>

Defined in: [api/index.ts:159](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/api/index.ts#L159)

Download the DE442S planetary kernel and naif0012.tls leap-second kernel
to the local cache directory. Verifies the download by SHA-256 checksum
when a checksum is supplied via config.checksumOverride.

## Parameters

### config?

[`KernelConfig`](../interfaces/KernelConfig.md)

Optional kernel config (to customize cache directory or checksum)

## Returns

`Promise`\<\{ `leapSecondsPath`: `string`; `planetaryPath`: `string`; \}\>

Paths where kernels were saved
