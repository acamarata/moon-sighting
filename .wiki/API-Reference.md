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

### `getMoonPhase(date?)`

Compute moon phase data. Works without a kernel.

```ts
function getMoonPhase(date?: Date): MoonPhaseResult
```

**MoonPhaseResult:**

```ts
interface MoonPhaseResult {
  phase: MoonPhaseName    // 'new-moon' | 'waxing-crescent' | ... | 'waning-crescent'
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
