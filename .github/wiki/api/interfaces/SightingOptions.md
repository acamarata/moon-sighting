[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / SightingOptions

# Interface: SightingOptions

Defined in: [types.ts:424](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L424)

## Properties

### bestTimeMethod?

> `optional` **bestTimeMethod?**: `"heuristic"` \| `"optimized"`

Defined in: [types.ts:433](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L433)

Best-time computation method.
'heuristic'  — T_b = T_sunset + 4/9 * Lag (Odeh/Yallop approximation, fast)
'optimized'  — scan sunset-to-moonset interval, maximize Odeh V parameter
Default: 'heuristic'

***

### kernels?

> `optional` **kernels?**: [`KernelConfig`](KernelConfig.md)

Defined in: [types.ts:426](https://github.com/acamarata/moon-sighting/blob/2992dcee216cb24cc74542f6e8d5a6f4f0d16e05/src/types.ts#L426)

Kernel acquisition configuration. Defaults to auto-download.
