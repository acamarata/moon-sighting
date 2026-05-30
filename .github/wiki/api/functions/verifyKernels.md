[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / verifyKernels

# Function: verifyKernels()

> **verifyKernels**(`config?`): `Promise`\<\{ `errors`: `string`[]; `ok`: `boolean`; \}\>

Defined in: [api/index.ts:221](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/api/index.ts#L221)

Verify that locally cached kernels exist (and match checksums if supplied).

## Parameters

### config?

[`KernelConfig`](../interfaces/KernelConfig.md)

Optional kernel config (to customize cache directory or checksum)

## Returns

`Promise`\<\{ `errors`: `string`[]; `ok`: `boolean`; \}\>

— ok is true when all checks pass
