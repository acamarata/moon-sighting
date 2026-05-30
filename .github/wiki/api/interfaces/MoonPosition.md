[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / MoonPosition

# Interface: MoonPosition

Defined in: [types.ts:27](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L27)

Topocentric moon position from getMoonPosition().
Computed via Meeus Ch. 47 (no kernel required).
Accuracy: azimuth/altitude ~0.3°, distance ~300 km.

## Properties

### altitude

> **altitude**: `number`

Defined in: [types.ts:31](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L31)

Apparent altitude in degrees above the horizon (atmospheric refraction applied)

***

### azimuth

> **azimuth**: `number`

Defined in: [types.ts:29](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L29)

Azimuth in degrees from North, measured clockwise (0 = N, 90 = E, 180 = S, 270 = W)

***

### distance

> **distance**: `number`

Defined in: [types.ts:33](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L33)

Distance from Earth center to Moon center, km

***

### parallacticAngle

> **parallacticAngle**: `number`

Defined in: [types.ts:39](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/types.ts#L39)

Parallactic angle in radians.
The angle between the great circle through the Moon and zenith, and the great circle
through the Moon and the north celestial pole. Positive east of the meridian.
