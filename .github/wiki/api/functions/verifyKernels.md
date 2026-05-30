[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / verifyKernels

# Function: verifyKernels()

> **verifyKernels**(`config?`): `Promise`\<\{ `errors`: `string`[]; `ok`: `boolean`; \}\>

Defined in: [api/index.ts:221](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/api/index.ts#L221)

Verify that locally cached kernels exist (and match checksums if supplied).

## Parameters

### config?

[`KernelConfig`](../interfaces/KernelConfig.md)

Optional kernel config (to customize cache directory or checksum)

## Returns

`Promise`\<\{ `errors`: `string`[]; `ok`: `boolean`; \}\>

— ok is true when all checks pass
