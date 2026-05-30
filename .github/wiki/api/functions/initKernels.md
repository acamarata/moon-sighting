[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / initKernels

# Function: initKernels()

> **initKernels**(`config?`): `Promise`\<`void`\>

Defined in: [api/index.ts:121](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/api/index.ts#L121)

Initialize the kernel engine from an already-downloaded kernel.
Must be called before getMoonSightingReport() or getSunMoonEvents().

Supports three source modes:
  - File path (Node.js): initKernels({ planetary: { type: 'file', path: '/path/to/de442s.bsp' } })
  - ArrayBuffer (browser): initKernels({ planetary: { type: 'buffer', data: buf, name: 'de442s.bsp' } })
  - Auto (Node.js): initKernels() — downloads and caches automatically

## Parameters

### config?

[`KernelConfig`](../interfaces/KernelConfig.md)

Kernel source configuration. Defaults to auto-download.

## Returns

`Promise`\<`void`\>
