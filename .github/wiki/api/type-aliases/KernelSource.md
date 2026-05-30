[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / KernelSource

# Type Alias: KernelSource

> **KernelSource** = \{ `path`: `string`; `type`: `"file"`; \} \| \{ `data`: `ArrayBuffer`; `name`: `string`; `type`: `"buffer"`; \} \| \{ `type`: `"url"`; `url`: `string`; \} \| \{ `type`: `"auto"`; \}

Defined in: [types.ts:399](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L399)

How to source a binary kernel file.
Used for both the planetary SPK (de442s.bsp) and leap-second kernel (naif0012.tls).
