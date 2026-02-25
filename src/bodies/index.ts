/**
 * bodies — Moon and Sun state computation and illumination geometry.
 *
 * This module assembles the full pipeline from ephemeris evaluation to
 * geocentric and topocentric body positions. It uses the SpkKernel's
 * segment-chaining getState() to retrieve Moon/Sun positions relative to Earth.
 *
 * When the DE442S kernel is not available, getMoonSunApproximate() provides
 * low-accuracy positions using Meeus Ch. 25 (Sun) and Ch. 47 (Moon).
 *
 * References:
 *   Meeus, J. (1998). Astronomical Algorithms, 2nd ed. Willmann-Bell.
 *   Odeh, M. (2006). New Criterion for Lunar Crescent Visibility.
 *     Experimental Astronomy, 17(1-3), 117-138.
 *   Yallop, B.D. (1997). A Method for Predicting the First Sighting of the
 *     New Crescent Moon. NAO Technical Note 69. HM Nautical Almanac Office.
 */

import type { StateVector, Vec3 } from '../types.js'
import type { SpkKernel } from '../spk/index.js'
import { NAIF_IDS } from '../spk/index.js'
import { J2000, DAYS_PER_JULIAN_CENTURY } from '../time/index.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEG = Math.PI / 180
const AU_KM = 149597870.7

/** Mean radius of the Moon in km (IAU 2015 nominal value) */
const MOON_RADIUS_KM = 1737.4

/** Mean radius of the Sun in km */
const SUN_RADIUS_KM = 696000.0

// ─── Geocentric state ─────────────────────────────────────────────────────────

/**
 * Compute the geocentric state of the Moon in GCRS at the given ET.
 *
 * The SpkKernel handles DE442S segment chaining automatically:
 *   Moon→Earth = Moon→EMB − Earth→EMB
 *
 * @param kernel - Loaded DE442S kernel
 * @param et - Ephemeris time, seconds past J2000 TDB
 * @returns Moon state vector relative to Earth center, km and km/s, GCRS
 */
export function getMoonGeocentricState(kernel: SpkKernel, et: number): StateVector {
  return kernel.getState(NAIF_IDS.MOON, NAIF_IDS.EARTH, et)
}

/**
 * Compute the geocentric state of the Sun in GCRS at the given ET.
 *
 * The SpkKernel handles DE442S segment chaining automatically:
 *   Sun→Earth = Sun→SSB − (EMB→SSB − Earth→EMB)
 *
 * @param kernel - Loaded DE442S kernel
 * @param et - Ephemeris time, seconds past J2000 TDB
 * @returns Sun state vector relative to Earth center, km and km/s, GCRS
 */
export function getSunGeocentricState(kernel: SpkKernel, et: number): StateVector {
  return kernel.getState(NAIF_IDS.SUN, NAIF_IDS.EARTH, et)
}

// ─── Moon illumination ────────────────────────────────────────────────────────

/**
 * Compute the Moon's illumination fraction and related phase quantities.
 *
 * Phase angle i = angle at Moon between Earth and Sun directions.
 * Illumination k = (1 + cos(i)) / 2  — 0 at new moon, 1 at full moon.
 * Elongation ψ = angle at Earth between Moon and Sun.
 *
 * Since the Sun is ~400× farther from Earth than the Moon:
 *   i ≈ π − ψ  (they are approximately supplementary)
 *   cos(i) ≈ −cos(ψ)  →  k = (1 − cos(ψ)) / 2
 *
 * Reference: Meeus §48.
 *
 * @param moonGCRS - Moon geocentric position (km)
 * @param sunGCRS - Sun geocentric position (km)
 * @returns illumination [0-1], phaseAngleDeg, elongationDeg, isWaxing
 */
export function computeIllumination(
  moonGCRS: Vec3,
  sunGCRS: Vec3,
): { illumination: number; phaseAngleDeg: number; elongationDeg: number; isWaxing: boolean } {
  const dot = (a: Vec3, b: Vec3) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
  const norm = (v: Vec3) => Math.sqrt(dot(v, v))

  const rMoon = norm(moonGCRS)
  const rSun = norm(sunGCRS)

  // Elongation ψ: angle at Earth between Moon and Sun
  const cosElong = dot(moonGCRS, sunGCRS) / (rMoon * rSun)
  const elongationDeg = Math.acos(Math.max(-1, Math.min(1, cosElong))) / DEG

  // Phase angle i: angle at Moon between Earth and Sun
  // Vector from Moon to Earth: -moonGCRS
  // Vector from Moon to Sun: sunGCRS - moonGCRS
  const moonToSun: Vec3 = [
    sunGCRS[0] - moonGCRS[0],
    sunGCRS[1] - moonGCRS[1],
    sunGCRS[2] - moonGCRS[2],
  ]
  const moonToEarth: Vec3 = [-moonGCRS[0], -moonGCRS[1], -moonGCRS[2]]
  const rMoonToSun = norm(moonToSun)

  const cosPhase = dot(moonToEarth, moonToSun) / (rMoon * rMoonToSun)
  const phaseAngleDeg = Math.acos(Math.max(-1, Math.min(1, cosPhase))) / DEG

  const illumination = (1 + Math.cos(phaseAngleDeg * DEG)) / 2

  // Moon is waxing when it is east of the Sun (elongation increasing).
  // Cross product sunGCRS × moonGCRS z-component: positive when Moon is east of Sun.
  const crossZ = sunGCRS[0]*moonGCRS[1] - sunGCRS[1]*moonGCRS[0]
  const isWaxing = crossZ > 0

  return { illumination, phaseAngleDeg, elongationDeg, isWaxing }
}

/**
 * Compute the topocentric crescent width W (Odeh) and W' (Yallop) in arc minutes.
 *
 * The crescent width is the angular thickness of the illuminated limb at its widest,
 * measured in the direction perpendicular to the cusps axis.
 *
 * For a sphere of topocentric semi-diameter SD and topocentric elongation ARCL:
 *   W = SD × (1 − cos ARCL)  [SD and W in the same angular units]
 *
 * This is exact for a spherical Moon model and gives:
 *   W = 0 at new moon (ARCL = 0°) — correct, no crescent
 *   W = SD at ARCL = 90°
 *   W = 2·SD at full moon (ARCL = 180°)
 *
 * Both Odeh W and Yallop W' use this formula with topocentric ARCL and SD.
 *
 * @param moonTopoVec - Topocentric Moon position vector (km)
 * @param ARCL - Topocentric Sun-Moon angular separation (degrees)
 * @returns W and Wprime: topocentric crescent width in arc minutes
 */
export function computeCrescentWidth(
  moonTopoVec: Vec3,
  ARCL: number,
): { W: number; Wprime: number } {

  const rMoon = Math.sqrt(
    moonTopoVec[0]**2 + moonTopoVec[1]**2 + moonTopoVec[2]**2,
  )

  // Topocentric semi-diameter in arc minutes
  const SDmoon_arcmin = Math.atan(MOON_RADIUS_KM / rMoon) / DEG * 60

  // Crescent width in arc minutes
  const ARCL_rad = ARCL * DEG
  const W = SDmoon_arcmin * (1 - Math.cos(ARCL_rad))

  // Wprime ≡ W for both Odeh and Yallop in this formulation
  return { W, Wprime: W }
}

// ─── Approximate positions (no kernel) ────────────────────────────────────────

/**
 * Low-accuracy Sun and Moon positions using Meeus Ch. 25 (Sun) and Ch. 47 (Moon).
 *
 * Error budget:
 *   Sun: < 0.01° in ecliptic longitude (main terms only)
 *   Moon: < 0.3° in ecliptic longitude, < 0.2° in latitude
 *
 * Not suitable for crescent sighting reports. Intended for moon phase displays
 * and for bootstrapping event-time searches.
 *
 * @param jdTT - Julian Date in TT
 * @returns Geocentric GCRS positions in km (approximate, light-time not corrected)
 */
export function getMoonSunApproximate(jdTT: number): {
  moonGCRS: Vec3
  sunGCRS: Vec3
} {
  const T = (jdTT - J2000) / DAYS_PER_JULIAN_CENTURY

  // ── Sun (Meeus Ch. 25) ──────────────────────────────────────────────────────

  // Mean longitude L0 and mean anomaly M (degrees)
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  const M_sun = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  const M_sun_rad = (M_sun % 360) * DEG

  const e_sun = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T

  // Equation of center (degrees)
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M_sun_rad)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M_sun_rad)
    + 0.000289 * Math.sin(3 * M_sun_rad)

  // True longitude and anomaly
  const sunLonDeg = L0 + C
  const nu_rad = M_sun_rad + C * DEG

  // Geometric distance in AU
  const R_AU = 1.000001018 * (1 - e_sun * e_sun) / (1 + e_sun * Math.cos(nu_rad))
  const R_km = R_AU * AU_KM

  // Nutation correction for apparent longitude (simplified)
  const omega = (125.04 - 1934.136 * T) * DEG
  const sunLonApp = sunLonDeg - 0.00569 - 0.00478 * Math.sin(omega)
  const sunLon_rad = sunLonApp * DEG

  // Mean obliquity of the ecliptic (IAU 1980 approximation, degrees)
  const eps = (23.439291111 - 0.013004167 * T - 0.0000001638 * T * T + 0.0000005036 * T * T * T) * DEG

  const sunGCRS: Vec3 = [
    R_km * Math.cos(sunLon_rad),
    R_km * Math.sin(sunLon_rad) * Math.cos(eps),
    R_km * Math.sin(sunLon_rad) * Math.sin(eps),
  ]

  // ── Moon (Meeus Ch. 47) ─────────────────────────────────────────────────────

  // Fundamental arguments (degrees)
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000
  const D  = 297.8501921 + 445267.1114034  * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000
  const M  = 357.5291092 + 35999.0502909   * T - 0.0001536 * T * T + T * T * T / 24490000
  const Mp = 134.9633964 + 477198.8675055  * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000
  const F  =  93.2720950 + 483202.0175233  * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000

  // Additive terms for longitude/latitude
  const A1 = (119.75 + 131.849 * T) * DEG
  const A2 = ( 53.09 + 479264.290 * T) * DEG
  const A3 = (313.45 + 481266.484 * T) * DEG

  // Convert to radians for accumulation
  const D_r  = (D  % 360) * DEG
  const M_r  = (M  % 360) * DEG
  const Mp_r = (Mp % 360) * DEG
  const F_r  = (F  % 360) * DEG

  // Eccentricity correction for terms involving M (Earth's orbital eccentricity)
  const E = 1 - 0.002516 * T - 0.0000074 * T * T

  // Longitude and distance accumulation — 30 main terms from Meeus Table 47.A
  // [d, m, mp, f, Σl (0.000001°), Σr (0.001 km)]
  const LD: ReadonlyArray<readonly [number,number,number,number,number,number]> = [
    [ 0, 0, 1, 0,  6288774, -20905355],
    [ 2, 0,-1, 0,  1274027,  -3699111],
    [ 2, 0, 0, 0,   658314,  -2955968],
    [ 0, 0, 2, 0,   213618,   -569925],
    [ 0, 1, 0, 0,  -185116,     48888],
    [ 0, 0, 0, 2,  -114332,     -3149],
    [ 2, 0,-2, 0,    58793,    246158],
    [ 2,-1,-1, 0,    57066,   -152138],
    [ 2, 0, 1, 0,    53322,   -170733],
    [ 2,-1, 0, 0,    45758,   -204586],
    [ 0, 1,-1, 0,   -40923,   -129620],
    [ 1, 0, 0, 0,   -34720,    108743],
    [ 0, 1, 1, 0,   -30383,    104755],
    [ 2, 0, 0,-2,    15327,     10321],
    [ 0, 0, 1, 2,   -12528,         0],
    [ 0, 0, 1,-2,    10980,     79661],
    [ 4, 0,-1, 0,    10675,    -34782],
    [ 0, 0, 3, 0,    10034,    -23210],
    [ 4, 0,-2, 0,     8548,    -21636],
    [ 2, 1,-1, 0,    -7888,     24208],
    [ 2, 1, 0, 0,    -6766,     30824],
    [ 1, 0,-1, 0,    -5163,     -8379],
    [ 1, 1, 0, 0,     4987,    -16675],
    [ 2,-1, 1, 0,     4036,    -12831],
    [ 2, 0, 2, 0,     3994,    -10445],
    [ 4, 0, 0, 0,     3861,    -11650],
    [ 2, 0,-3, 0,     3665,     14403],
    [ 0, 1,-2, 0,    -2689,     -7003],
    [ 2, 0,-1, 2,    -2602,         0],
    [ 2,-1,-2, 0,     2390,     10056],
  ]

  let Sl = 0, Sr = 0
  for (const [d, m, mp, f, sl, sr] of LD) {
    const arg = d*D_r + m*M_r + mp*Mp_r + f*F_r
    const eCorr = Math.abs(m) === 2 ? E*E : Math.abs(m) === 1 ? E : 1
    Sl += sl * eCorr * Math.sin(arg)
    Sr += sr * eCorr * Math.cos(arg)
  }

  // Additive longitude corrections (Meeus §47)
  Sl += 3958 * Math.sin(A1) + 1962 * Math.sin((Lp - F) * DEG) + 318 * Math.sin(A2)

  // Latitude accumulation — 20 main terms from Meeus Table 47.B
  // [d, m, mp, f, Σb (0.000001°)]
  const FB: ReadonlyArray<readonly [number,number,number,number,number]> = [
    [ 0, 0, 0, 1,  5128122],
    [ 0, 0, 1, 1,   280602],
    [ 0, 0, 1,-1,   277693],
    [ 2, 0, 0,-1,   173237],
    [ 2, 0,-1, 1,    55413],
    [ 2, 0,-1,-1,    46271],
    [ 2, 0, 0, 1,    32573],
    [ 0, 0, 2, 1,    17198],
    [ 2, 0, 1,-1,     9266],
    [ 0, 0, 2,-1,     8822],
    [ 2,-1, 0,-1,     8216],
    [ 2, 0,-2,-1,     4324],
    [ 2, 0, 1, 1,     4200],
    [ 2, 1, 0,-1,    -3359],
    [ 2,-1,-1, 1,     2463],
    [ 2,-1, 0, 1,     2211],
    [ 2,-1,-1,-1,     2065],
    [ 0, 1,-1,-1,    -1870],
    [ 4, 0,-1,-1,     1828],
    [ 0, 1, 0, 1,    -1794],
  ]

  let Sb = 0
  for (const [d, m, mp, f, sb] of FB) {
    const arg = d*D_r + m*M_r + mp*Mp_r + f*F_r
    const eCorr = Math.abs(m) === 2 ? E*E : Math.abs(m) === 1 ? E : 1
    Sb += sb * eCorr * Math.sin(arg)
  }

  // Additive latitude corrections
  Sb += -2235 * Math.sin(Lp * DEG) + 382 * Math.sin(A3) + 175 * Math.sin(A1 - F_r)
      + 175 * Math.sin(A1 + F_r) + 127 * Math.sin((Lp - Mp) * DEG) - 115 * Math.sin((Lp + Mp) * DEG)

  // Moon ecliptic coordinates
  const moonLonDeg = Lp + Sl * 1e-6
  const moonLatDeg = Sb * 1e-6
  const moonDistKm = 385000.56 + Sr * 0.001

  const moonLon_rad = moonLonDeg * DEG
  const moonLat_rad = moonLatDeg * DEG

  // Ecliptic to equatorial (GCRS ≈ J2000 equatorial for this accuracy level)
  const moonGCRS: Vec3 = [
    moonDistKm * Math.cos(moonLat_rad) * Math.cos(moonLon_rad),
    moonDistKm * (Math.cos(eps) * Math.cos(moonLat_rad) * Math.sin(moonLon_rad) - Math.sin(eps) * Math.sin(moonLat_rad)),
    moonDistKm * (Math.sin(eps) * Math.cos(moonLat_rad) * Math.sin(moonLon_rad) + Math.cos(eps) * Math.sin(moonLat_rad)),
  ]

  return { moonGCRS, sunGCRS }
}

/**
 * Estimate the time of the nearest new moon using Meeus Ch. 49.
 * Accurate to within ~2 hours; sufficient for phase age calculations.
 *
 * @param jdTT - Julian Date in TT near the desired new moon
 * @returns Julian Date in TT of the nearest new moon
 */
export function nearestNewMoon(jdTT: number): number {
  // Convert JD to approximate decimal year
  const Y = 2000.0 + (jdTT - J2000) / 365.25

  // k = approximate lunation number (0 = Jan 6, 2000 new moon)
  const k = Math.round((Y - 2000.0) * 12.3685)
  const T = k / 1236.85

  // JDE of mean new moon (Meeus Eq. 49.1)
  let JDE = 2451550.09766
    + 29.530588861 * k
    + 0.00015437 * T * T
    - 0.000000150 * T * T * T
    + 0.00000000073 * T * T * T * T

  // Fundamental arguments for the corrections (degrees → radians)
  const M  = (2.5534 + 29.10535670 * k - 0.0000014 * T * T - 0.00000011 * T * T * T) * DEG
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T * T * T) * DEG
  const Fc = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T * T * T) * DEG
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T * T * T) * DEG

  // Eccentricity of Earth's orbit
  const E = 1 - 0.002516 * T - 0.0000074 * T * T

  // Corrections from Meeus Table 49.A (new moon)
  JDE +=
    -0.40720 * Math.sin(Mp)
    + 0.17241 * E * Math.sin(M)
    + 0.01608 * Math.sin(2 * Mp)
    + 0.01039 * Math.sin(2 * Fc)
    + 0.00739 * E * Math.sin(Mp - M)
    - 0.00514 * E * Math.sin(Mp + M)
    + 0.00208 * E * E * Math.sin(2 * M)
    - 0.00111 * Math.sin(Mp - 2 * Fc)
    - 0.00057 * Math.sin(Mp + 2 * Fc)
    + 0.00056 * E * Math.sin(2 * Mp + M)
    - 0.00042 * Math.sin(3 * Mp)
    + 0.00042 * E * Math.sin(M + 2 * Fc)
    + 0.00038 * E * Math.sin(M - 2 * Fc)
    - 0.00024 * E * Math.sin(2 * Mp - M)
    - 0.00017 * Math.sin(Om)
    - 0.00007 * Math.sin(Mp + 2 * M)
    + 0.00004 * Math.sin(2 * Mp - 2 * Fc)
    + 0.00004 * Math.sin(3 * M)
    + 0.00003 * Math.sin(Mp + M - 2 * Fc)
    + 0.00003 * Math.sin(2 * Mp + 2 * Fc)
    - 0.00003 * Math.sin(Mp + M + 2 * Fc)
    + 0.00003 * Math.sin(Mp - M + 2 * Fc)
    - 0.00002 * Math.sin(Mp - M - 2 * Fc)
    - 0.00002 * Math.sin(3 * Mp + M)
    + 0.00002 * Math.sin(4 * Mp)

  return JDE
}
