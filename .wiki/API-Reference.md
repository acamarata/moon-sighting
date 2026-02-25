# API Reference

## Functions

### `initKernels(config?)`

Load the JPL DE442S ephemeris kernel. Must be called before `getMoonSightingReport()` or `getSunMoonEvents()`. Can be called multiple times; subsequent calls replace the loaded kernel.

```ts
async function initKernels(config?: KernelConfig): Promise<void>
```

**KernelConfig:**

```ts
interface KernelConfig {
  planetary?: KernelSource    // DE442S source. Default: auto-download
  leapSeconds?: KernelSource  // LSK source. Default: auto-download
  cacheDir?: string           // Cache dir. Default: ~/.cache/moon-sighting
  checksumOverride?: string   // SHA-256 override for de442s.bsp
}

type KernelSource =
  | { type: 'auto' }
  | { type: 'file'; path: string }
  | { type: 'buffer'; data: ArrayBuffer; name: string }
  | { type: 'url'; url: string }
```

---

### `getMoonSightingReport(date, observer, options?)`

Compute a complete moon sighting report. Requires kernel.

```ts
async function getMoonSightingReport(
  date: Date,
  observer: Observer,
  options?: SightingOptions,
): Promise<MoonSightingReport>
```

**Observer:**

```ts
interface Observer {
  lat: number          // Geodetic latitude, degrees (north positive)
  lon: number          // Longitude, degrees (east positive)
  elevation: number    // Height above WGS84 ellipsoid, meters
  name?: string        // Optional label
  deltaT?: number      // Override TT - UT1, seconds
  ut1utc?: number      // Override UT1 - UTC, seconds (takes precedence over deltaT)
  pressure?: number    // Atmospheric pressure, mbar (default 1013.25)
  temperature?: number // Temperature, Celsius (default 15)
}
```

**SightingOptions:**

```ts
interface SightingOptions {
  kernels?: KernelConfig
  bestTimeMethod?: 'heuristic' | 'optimized'  // default: 'heuristic'
}
```

**MoonSightingReport:**

```ts
interface MoonSightingReport {
  date: Date
  observer: Observer

  // Event times
  sunsetUTC: Date | null
  moonsetUTC: Date | null
  lagMinutes: number | null       // moonset - sunset, minutes
  bestTimeUTC: Date | null        // T_sunset + 4/9 × lag
  bestTimeWindowUTC: [Date, Date] | null  // ±20 min around best time

  // Body positions at best time
  moonPosition: AzAlt | null      // { azimuth, altitude }
  sunPosition: AzAlt | null
  illumination: number | null     // percent, 0–100
  moonAge: number | null          // hours since conjunction

  // Crescent geometry at best time
  geometry: CrescentGeometry | null

  // Visibility criteria
  yallop: YallopResult | null
  odeh: OdehResult | null

  // Guidance
  guidance: string

  // Metadata
  ephemerisSource: 'DE442S' | 'approximate'
  moonAboveHorizon: boolean | null
  sightingPossible: boolean
}
```

---

### `getMoonPosition(date?, lat, lon, elevation?)`

Compute the Moon's topocentric position. Works without a kernel. Uses Meeus Chapter 47 approximate positions (~0.3° accuracy).

```ts
function getMoonPosition(
  date: Date | undefined,
  lat: number,
  lon: number,
  elevation?: number,
): MoonPosition
```

**Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `date` | `Date?` | Date to evaluate. Defaults to now |
| `lat` | `number` | Geodetic latitude, degrees (north positive) |
| `lon` | `number` | Longitude, degrees (east positive) |
| `elevation` | `number?` | Height above ellipsoid, meters. Default: 0 |

**MoonPosition:**

```ts
interface MoonPosition {
  azimuth: number         // Degrees from North, clockwise (0–360)
  altitude: number        // Apparent altitude, degrees (refraction applied)
  distance: number        // Earth center to Moon center, km
  parallacticAngle: number // Angle between zenith and north pole as seen from Moon, radians
}
```

**Example:**

```ts
import { getMoonPosition } from 'moon-sighting'

const pos = getMoonPosition(new Date(), 51.5074, -0.1278, 10)
console.log(pos.azimuth)   // 214.7
console.log(pos.altitude)  // 38.2
console.log(pos.distance)  // 384400
```

---

### `getMoonIllumination(date?)`

Compute the Moon's illumination fraction and phase angle. Works without a kernel. Uses Meeus Chapters 47 and 48 (~0.5% illumination accuracy).

```ts
function getMoonIllumination(date?: Date): MoonIlluminationResult
```

**Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `date` | `Date?` | Date to evaluate. Defaults to now |

**MoonIlluminationResult:**

```ts
interface MoonIlluminationResult {
  fraction: number   // Illuminated fraction, 0 (new moon) to 1 (full moon)
  phase: number      // Position in 0–1 cycle: 0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter
  angle: number      // Position angle of bright limb midpoint, eastward from north, radians
  isWaxing: boolean  // True when elongation is increasing (new moon toward full moon)
}
```

**Example:**

```ts
import { getMoonIllumination } from 'moon-sighting'

const illum = getMoonIllumination()
console.log(illum.fraction)  // 0.143
console.log(illum.phase)     // 0.09
console.log(illum.isWaxing)  // true
```

---

### `getMoonPhase(date?)`

Compute moon phase data. Works without a kernel.

```ts
function getMoonPhase(date?: Date): MoonPhaseResult
```

**MoonPhaseResult:**

```ts
interface MoonPhaseResult {
  phase: MoonPhaseName    // 'new-moon' | 'waxing-crescent' | ... | 'waning-crescent'
  phaseName: string       // Display name, e.g. 'Waxing Crescent'
  phaseSymbol: string     // Moon emoji, e.g. '🌒'
  illumination: number    // 0–100 percent
  age: number             // hours since last new moon
  elongationDeg: number   // Moon - Sun ecliptic longitude, [0, 360)
  isWaxing: boolean
  nextNewMoon: Date
  nextFullMoon: Date
  prevNewMoon: Date
}
```

---

### `getMoonVisibilityEstimate(date?, lat, lon, elevation?)`

Quick kernel-free crescent visibility estimate using the Odeh V-parameter formula. Computes approximate crescent geometry from Meeus Ch. 47 positions at the given observation time.

Best used at an estimated post-sunset observation time. For precise crescent work, use `getMoonSightingReport()` with the DE442S kernel.

```ts
function getMoonVisibilityEstimate(
  date?: Date,
  lat: number,
  lon: number,
  elevation?: number,
): MoonVisibilityEstimate
```

**Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `date` | `Date?` | Observation time. Defaults to now. Use a post-sunset time for meaningful results |
| `lat` | `number` | Geodetic latitude, degrees (north positive) |
| `lon` | `number` | Longitude, degrees (east positive) |
| `elevation` | `number?` | Height above ellipsoid, meters. Default: 0 |

**MoonVisibilityEstimate:**

```ts
interface MoonVisibilityEstimate {
  V: number                    // Odeh V parameter: V = ARCV - f(W). Positive = crescent exceeds threshold
  zone: OdehZone               // 'A' | 'B' | 'C' | 'D'
  description: string          // Human-readable zone description
  isVisibleNakedEye: boolean   // True for zone A
  isVisibleWithOpticalAid: boolean // True for zones A and B
  ARCL: number                 // Arc of light (elongation), degrees
  ARCV: number                 // Arc of vision (Moon alt - Sun alt, airless), degrees
  W: number                    // Topocentric crescent width, arc minutes
  moonAboveHorizon: boolean    // True when Moon is above the horizon at the given time
  isApproximate: true          // Always true: Meeus approximation, not DE442S
}
```

**Example:**

```ts
import { getMoonVisibilityEstimate } from 'moon-sighting'

// ~40 min after sunset in Mecca, day after new moon
const est = getMoonVisibilityEstimate(new Date('2025-03-02T15:30:00Z'), 21.42, 39.83)
console.log(est.zone)               // 'A' through 'D'
console.log(est.V)                  // Odeh V parameter
console.log(est.isVisibleNakedEye)  // true/false
```

---

### `getMoon(date?, lat, lon, elevation?)`

Combined kernel-free snapshot: phase, position, illumination, and visibility estimate in one call.

```ts
function getMoon(
  date?: Date,
  lat: number,
  lon: number,
  elevation?: number,
): MoonSnapshot
```

**MoonSnapshot:**

```ts
interface MoonSnapshot {
  phase: MoonPhaseResult           // getMoonPhase() result
  position: MoonPosition           // getMoonPosition() result
  illumination: MoonIlluminationResult // getMoonIllumination() result
  visibility: MoonVisibilityEstimate   // getMoonVisibilityEstimate() result
}
```

**Example:**

```ts
import { getMoon } from 'moon-sighting'

const moon = getMoon(new Date(), 51.5074, -0.1278, 10)
console.log(moon.phase.phaseName)       // 'Waxing Crescent'
console.log(moon.phase.phaseSymbol)     // '🌒'
console.log(moon.position.altitude)     // degrees above horizon
console.log(moon.illumination.fraction) // 0.0 to 1.0
console.log(moon.visibility.zone)       // 'A' through 'D'
```

---

### `getSunMoonEvents(date, observer, options?)`

Rise, set, and twilight times. Requires kernel.

```ts
async function getSunMoonEvents(
  date: Date,
  observer: Observer,
  options?: Pick<SightingOptions, 'kernels'>,
): Promise<SunMoonEvents>
```

**SunMoonEvents:**

```ts
interface SunMoonEvents {
  sunsetUTC: Date | null
  moonsetUTC: Date | null
  sunriseUTC: Date | null
  moonriseUTC: Date | null
  civilTwilightEndUTC: Date | null        // Sun at -6°
  nauticalTwilightEndUTC: Date | null     // Sun at -12°
  astronomicalTwilightEndUTC: Date | null // Sun at -18°
}
```

---

### `downloadKernels(config?)`

Download DE442S and naif0012.tls to the local cache (Node.js only).

```ts
async function downloadKernels(config?: KernelConfig): Promise<{
  planetaryPath: string
  leapSecondsPath: string
}>
```

---

### `verifyKernels(config?)`

Verify locally cached kernels by SHA-256 checksum.

```ts
async function verifyKernels(config?: KernelConfig): Promise<{
  ok: boolean
  errors: string[]
}>
```

---

## Types

### `CrescentGeometry`

```ts
interface CrescentGeometry {
  ARCL: number   // Elongation (Sun-Moon angular separation), degrees
  ARCV: number   // Moon altitude - Sun altitude (airless), degrees
  DAZ: number    // Sun azimuth - Moon azimuth, [-180, 180], degrees
  W: number      // Topocentric crescent width, arc minutes
  lag: number    // Moonset - sunset, minutes
}
```

### `YallopResult`

```ts
interface YallopResult {
  q: number                // Continuous q parameter
  category: YallopCategory // 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  description: string
  isVisibleNakedEye: boolean      // A or B
  requiresOpticalAid: boolean     // C or D
  isBelowDanjonLimit: boolean     // F
  Wprime: number                  // W' used in q formula, arc minutes
}
```

### `OdehResult`

```ts
interface OdehResult {
  V: number                // Continuous V parameter
  zone: OdehZone           // 'A' | 'B' | 'C' | 'D'
  description: string
  isVisibleNakedEye: boolean      // A
  isVisibleWithOpticalAid: boolean // A or B
}
```

### `MoonVisibilityEstimate`

See the `getMoonVisibilityEstimate` section above for the full definition.

### `MoonSnapshot`

See the `getMoon` section above for the full definition.

### `AzAlt`

```ts
interface AzAlt {
  azimuth: number   // Degrees from North, clockwise (0–360)
  altitude: number  // Degrees above horizon (negative = below)
}
```

---

## Constants

```ts
YALLOP_THRESHOLDS  // { A: 0.216, B: -0.014, C: -0.160, D: -0.232, E: -0.293 }
ODEH_THRESHOLDS    // { A: 5.65, B: 2.00, C: -0.96 }
WGS84              // { a: 6378137.0, invF: 298.257223563, f, b, e2 }
YALLOP_DESCRIPTIONS // Record<YallopCategory, string>
ODEH_DESCRIPTIONS   // Record<OdehZone, string>
```

---

*Previous: [Home](Home) | Next: [Architecture](Architecture)*
