// ─── Primitive geometry ──────────────────────────────────────────────────────

/** 3-element position or velocity vector in km or km/s */
export type Vec3 = [number, number, number]

/** Position + velocity state vector from the ephemeris */
export interface StateVector {
  position: Vec3  // km, in the frame determined by context
  velocity: Vec3  // km/s
}

/** Azimuth + altitude in degrees */
export interface AzAlt {
  /** Degrees from North, measured clockwise (0 = N, 90 = E, 180 = S, 270 = W) */
  azimuth: number
  /** Degrees above the horizon (negative = below) */
  altitude: number
}

// ─── Time ────────────────────────────────────────────────────────────────────

/** All relevant time scale values for a single moment */
export interface TimeScales {
  utc: Date
  /** Julian Date in UTC */
  jdUTC: number
  /** Julian Date in Terrestrial Time (TT = TAI + 32.184s) */
  jdTT: number
  /** Julian Date in Barycentric Dynamical Time (used by JPL ephemerides) */
  jdTDB: number
  /** Julian Date in UT1 (Earth rotation time) */
  jdUT1: number
  /** TT - UT1 in seconds (delta-T) */
  deltaT: number
  /** TAI - UTC in seconds (leap seconds count) */
  deltaAT: number
}

// ─── Observer ────────────────────────────────────────────────────────────────

/** Observer location and environmental parameters */
export interface Observer {
  /** Geodetic latitude in degrees (north positive) */
  lat: number
  /** Longitude in degrees (east positive) */
  lon: number
  /** Height above WGS84 ellipsoid in meters */
  elevation: number
  /** Optional label for the location */
  name?: string
  /**
   * Override TT - UT1 in seconds.
   * When provided, used directly. Otherwise the built-in polynomial is used.
   * For maximum accuracy, supply the current IERS value (typically within ±0.9s).
   */
  deltaT?: number
  /**
   * Override UT1 - UTC in seconds (from IERS Bulletin A).
   * Takes precedence over deltaT when both are provided.
   */
  ut1utc?: number
  /** Atmospheric pressure in millibars (default 1013.25) */
  pressure?: number
  /** Ambient temperature in Celsius (default 15) */
  temperature?: number
}

// ─── Crescent geometry ───────────────────────────────────────────────────────

/**
 * The five geometric quantities used by all major crescent visibility criteria.
 * All values computed at best time (T_b) unless noted.
 */
export interface CrescentGeometry {
  /** Arc of light: topocentric Sun-Moon angular separation (elongation), degrees */
  ARCL: number
  /**
   * Arc of vision: Moon airless altitude minus Sun airless altitude, degrees.
   * Used as the primary visibility discriminant in both Yallop and Odeh.
   */
  ARCV: number
  /**
   * Relative azimuth: Sun azimuth minus Moon azimuth, normalized to [-180, 180], degrees.
   * Positive = Moon north of Sun.
   */
  DAZ: number
  /**
   * Topocentric crescent width in arc minutes.
   * Used directly in Odeh's polynomial V expression.
   */
  W: number
  /** Moonset minus sunset in minutes. Negative = Moon sets before Sun (no sighting possible). */
  lag: number
}

// ─── Yallop q-test ───────────────────────────────────────────────────────────

/** Yallop q-test visibility category (NAO Technical Note 69) */
export type YallopCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

/**
 * Published q thresholds (Yallop 1997, NAO TN 69):
 *   A: q > +0.216   — Easily visible to the naked eye
 *   B: q > -0.014   — Visible under perfect conditions
 *   C: q > -0.160   — May need optical aid to find; visible to naked eye
 *   D: q > -0.232   — Optical aid needed; will not be visible to naked eye
 *   E: q > -0.293   — Not visible even with telescope
 *   F: q <= -0.293  — Below Danjon limit (Moon too close to Sun)
 */
export const YALLOP_THRESHOLDS = {
  A: 0.216,
  B: -0.014,
  C: -0.160,
  D: -0.232,
  E: -0.293,
} as const

export const YALLOP_DESCRIPTIONS: Record<YallopCategory, string> = {
  A: 'Easily visible to the naked eye',
  B: 'Visible under perfect conditions',
  C: 'May need optical aid to find; naked eye possible',
  D: 'Optical aid needed; naked eye not possible',
  E: 'Not visible even with telescope under good conditions',
  F: 'Below Danjon limit — crescent cannot form',
}

export interface YallopResult {
  /** The continuous q parameter (higher = more visible) */
  q: number
  /** Visibility category A through F */
  category: YallopCategory
  /** Human-readable interpretation */
  description: string
  /** True for categories A and B */
  isVisibleNakedEye: boolean
  /** True for categories C and D */
  requiresOpticalAid: boolean
  /** True for category F */
  isBelowDanjonLimit: boolean
  /** Topocentric crescent width W' used in the q formula, arc minutes */
  Wprime: number
}

// ─── Odeh criterion ──────────────────────────────────────────────────────────

/** Odeh visibility zone (Experimental Astronomy 2006) */
export type OdehZone = 'A' | 'B' | 'C' | 'D'

/**
 * Published V thresholds (Odeh 2006):
 *   A: V >= 5.65  — Visible with naked eye
 *   B: V >= 2.00  — Visible with optical aid; may be seen with naked eye
 *   C: V >= -0.96 — Visible with optical aid only
 *   D: V <  -0.96 — Not visible even with optical aid
 */
export const ODEH_THRESHOLDS = {
  A: 5.65,
  B: 2.00,
  C: -0.96,
} as const

export const ODEH_DESCRIPTIONS: Record<OdehZone, string> = {
  A: 'Visible with naked eye',
  B: 'Visible with optical aid; may be seen with naked eye under excellent conditions',
  C: 'Visible with optical aid only',
  D: 'Not visible even with optical aid',
}

export interface OdehResult {
  /**
   * Continuous visibility parameter V = ARCV - (arcv_minimum(W)).
   * Positive = crescent exceeds minimum visibility threshold.
   */
  V: number
  /** Visibility zone A through D */
  zone: OdehZone
  /** Human-readable interpretation */
  description: string
  /** True for zone A */
  isVisibleNakedEye: boolean
  /** True for zones A and B */
  isVisibleWithOpticalAid: boolean
}

// ─── Moon phase ──────────────────────────────────────────────────────────────

export type MoonPhaseName =
  | 'new-moon'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full-moon'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent'

export interface MoonPhaseResult {
  /** Named phase based on illumination and waxing/waning state */
  phase: MoonPhaseName
  /** Illuminated fraction 0-100 (percent) */
  illumination: number
  /** Hours since last new moon */
  age: number
  /** Ecliptic longitude of the Moon minus the Sun, degrees [0, 360) */
  elongationDeg: number
  /** True when Moon is moving away from the Sun (illumination increasing) */
  isWaxing: boolean
  /** UTC date of the next new moon */
  nextNewMoon: Date
  /** UTC date of the next full moon */
  nextFullMoon: Date
  /** UTC date of the previous new moon */
  prevNewMoon: Date
}

// ─── Event times ─────────────────────────────────────────────────────────────

export interface SunMoonEvents {
  /** UTC time of sunset for the given date at the observer's location */
  sunsetUTC: Date | null
  /** UTC time of moonset for the given date at the observer's location */
  moonsetUTC: Date | null
  /** UTC time of sunrise */
  sunriseUTC: Date | null
  /** UTC time of moonrise */
  moonriseUTC: Date | null
  /** UTC time when civil twilight ends (Sun at -6°) */
  civilTwilightEndUTC: Date | null
  /** UTC time when nautical twilight ends (Sun at -12°) */
  nauticalTwilightEndUTC: Date | null
  /** UTC time when astronomical twilight ends (Sun at -18°) */
  astronomicalTwilightEndUTC: Date | null
}

// ─── Full moon sighting report ────────────────────────────────────────────────

export interface MoonSightingReport {
  /** Date for which the sighting report was computed */
  date: Date
  /** Observer location used */
  observer: Observer

  // Event times
  sunsetUTC: Date | null
  moonsetUTC: Date | null
  /** Moonset minus sunset, in minutes. Null if either event is null. */
  lagMinutes: number | null
  /** Best observation time (Odeh/Yallop: T_s + 4/9 * Lag) */
  bestTimeUTC: Date | null
  /** Conservative observation window [bestTime - 20min, bestTime + 20min] */
  bestTimeWindowUTC: [Date, Date] | null

  // At best time
  /** Topocentric Moon position at best time */
  moonPosition: AzAlt | null
  /** Topocentric Sun position at best time */
  sunPosition: AzAlt | null
  /** Moon illumination percent at best time */
  illumination: number | null
  /** Hours since conjunction (new moon) */
  moonAge: number | null

  // Crescent geometry at best time
  geometry: CrescentGeometry | null

  // Visibility criteria results
  yallop: YallopResult | null
  odeh: OdehResult | null

  // Sighting guidance
  /**
   * Plain-language direction for observers.
   * Includes where to look (azimuth, altitude), when (best time), and what to expect.
   */
  guidance: string

  // Metadata
  /** Source ephemeris used for this calculation */
  ephemerisSource: 'DE442S' | 'approximate'
  /** Whether the Moon is even above the horizon at best time */
  moonAboveHorizon: boolean | null
  /** Whether sighting is geometrically possible (lag > 0, Moon above horizon at best time) */
  sightingPossible: boolean
}

// ─── Kernel configuration ─────────────────────────────────────────────────────

/**
 * How to source a binary kernel file.
 * Used for both the planetary SPK (de442s.bsp) and leap-second kernel (naif0012.tls).
 */
export type KernelSource =
  | { type: 'file'; path: string }
  | { type: 'buffer'; data: ArrayBuffer; name: string }
  | { type: 'url'; url: string }
  | { type: 'auto' }  // auto-download from NAIF, cache in ~/.cache/moon-sighting

export interface KernelConfig {
  /** Planetary SPK kernel — defaults to de442s.bsp via auto-download */
  planetary?: KernelSource
  /** Leap-second kernel — defaults to naif0012.tls via auto-download */
  leapSeconds?: KernelSource
  /**
   * Directory for the download cache.
   * Defaults to ~/.cache/moon-sighting on POSIX, %LOCALAPPDATA%\moon-sighting on Windows.
   */
  cacheDir?: string
  /**
   * SHA-256 checksum of de442s.bsp for download verification.
   * Bundled default matches the NAIF distribution as of 2024.
   */
  checksumOverride?: string
}

// ─── Top-level options ────────────────────────────────────────────────────────

export interface SightingOptions {
  /** Kernel acquisition configuration. Defaults to auto-download. */
  kernels?: KernelConfig
  /**
   * Best-time computation method.
   * 'heuristic'  — T_b = T_sunset + 4/9 * Lag (Odeh/Yallop approximation, fast)
   * 'optimized'  — scan sunset-to-moonset interval, maximize Odeh V parameter
   * Default: 'heuristic'
   */
  bestTimeMethod?: 'heuristic' | 'optimized'
}

// ─── WGS84 constants ─────────────────────────────────────────────────────────

/** WGS84 reference ellipsoid parameters */
export const WGS84 = {
  /** Semi-major axis in meters */
  a: 6378137.0,
  /** Inverse flattening */
  invF: 298.257223563,
  /** Flattening */
  f: 1 / 298.257223563,
  /** Semi-minor axis in meters */
  get b() { return this.a * (1 - this.f) },
  /** First eccentricity squared */
  get e2() { return 2 * this.f - this.f * this.f },
} as const

// ─── Internal ephemeris types ─────────────────────────────────────────────────

/** A segment in a JPL SPK (DAF) kernel file */
export interface SpkSegment {
  /** NAIF body ID of the target body */
  target: number
  /** NAIF body ID of the center body */
  center: number
  /** Reference frame code */
  frame: number
  /** SPK data type (2 = Chebyshev position only, 3 = Chebyshev position + velocity) */
  dataType: 2 | 3
  /** Segment start time in ET seconds past J2000 */
  startET: number
  /** Segment end time in ET seconds past J2000 */
  endET: number
  /** Byte offset of the data array in the file */
  dataOffset: number
  /** Number of double-precision values in the data array */
  dataSize: number
}

/** A decoded Chebyshev record from a Type 2 or Type 3 SPK segment */
export interface ChebRecord {
  /** Midpoint of the record interval in ET seconds past J2000 */
  mid: number
  /** Half-width of the record interval in seconds */
  radius: number
  /** Chebyshev coefficients for X, Y, Z [3][degree+1] */
  coeffs: Float64Array[]
  /** Degree of the polynomial */
  degree: number
}
