/**
 * time — Time scale conversions and Julian Date arithmetic.
 *
 * JPL DE ephemerides use Barycentric Dynamical Time (TDB) as their time argument,
 * stored as seconds past J2000.0 (2000 Jan 1, 12:00:00 TDB = JD 2451545.0 TDB).
 *
 * Conversion chain: UTC → TAI → TT → TDB
 *   TAI = UTC + ΔAT          (ΔAT from leap-second table, integer seconds)
 *   TT  = TAI + 32.184s      (exact, by definition)
 *   TDB ≈ TT + 0.001658 * sin(g) + ...  (sub-millisecond correction)
 *
 * For Earth-rotation-based quantities (hour angle, ERA), we also need UT1:
 *   UT1 = UTC + (UT1 - UTC)  (from IERS Bulletin A, typically < ±0.9s)
 *   ΔT = TT - UT1            (historically large; ~69s in 2024)
 *
 * References:
 *   IERS Conventions (2010) — Chapter 5, time scales
 *   NAIF LSK kernel (naif0012.tls) — ΔAT table + TDB approximation constants
 *   Espenak & Meeus — ΔT polynomial expressions
 */

import type { TimeScales } from '../types.js'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Julian Date of J2000.0 epoch (2000 Jan 1, 12:00 TT) */
export const J2000 = 2451545.0

/** TT - TAI offset in seconds (exact, by definition) */
export const TT_MINUS_TAI = 32.184

/** Seconds per day */
export const SECONDS_PER_DAY = 86400.0

/** Days per Julian century */
export const DAYS_PER_JULIAN_CENTURY = 36525.0

// ─── Leap-second table ────────────────────────────────────────────────────────

/**
 * ΔAT table (TAI - UTC in seconds), chronological.
 * Source: NAIF naif0012.tls. Update when new leap seconds are announced.
 *
 * Each entry: [JD(UTC) when step takes effect, new ΔAT value]
 * The step applies for all UTC times >= the entry JD.
 */
export const LEAP_SECOND_TABLE: ReadonlyArray<readonly [number, number]> = [
  [2441317.5, 10], // 1972 Jan 1
  [2441499.5, 11], // 1972 Jul 1
  [2441683.5, 12], // 1973 Jan 1
  [2442048.5, 13], // 1974 Jan 1
  [2442413.5, 14], // 1975 Jan 1
  [2442778.5, 15], // 1976 Jan 1
  [2443144.5, 16], // 1977 Jan 1
  [2443509.5, 17], // 1978 Jan 1
  [2443874.5, 18], // 1979 Jan 1
  [2444239.5, 19], // 1980 Jan 1
  [2444786.5, 20], // 1981 Jul 1
  [2445151.5, 21], // 1982 Jul 1
  [2445516.5, 22], // 1983 Jul 1
  [2446247.5, 23], // 1985 Jul 1
  [2447161.5, 24], // 1988 Jan 1
  [2447892.5, 25], // 1990 Jan 1
  [2448257.5, 26], // 1991 Jan 1
  [2448804.5, 27], // 1992 Jul 1
  [2449169.5, 28], // 1993 Jul 1
  [2449534.5, 29], // 1994 Jul 1
  [2450083.5, 30], // 1996 Jan 1
  [2450630.5, 31], // 1997 Jul 1
  [2451179.5, 32], // 1999 Jan 1
  [2453736.5, 33], // 2006 Jan 1
  [2454832.5, 34], // 2009 Jan 1
  [2456109.5, 35], // 2012 Jul 1
  [2457204.5, 36], // 2015 Jul 1
  [2457754.5, 37], // 2017 Jan 1
] as const

/**
 * Get the current leap second count (TAI - UTC) for a given JD in UTC.
 * Returns 10 for dates before 1972 (the first leap second era).
 */
export function getDeltaAT(jdUTC: number): number {
  let deltaAT = 10
  for (const [jd, dat] of LEAP_SECOND_TABLE) {
    if (jdUTC >= jd) deltaAT = dat
    else break
  }
  return deltaAT
}

// ─── Julian Date ─────────────────────────────────────────────────────────────

/**
 * Convert a JavaScript Date (UTC) to Julian Date in UTC.
 * Uses the standard formula; valid for dates after the Gregorian reform.
 */
export function dateToJD(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

/**
 * Convert a Julian Date in UTC to a JavaScript Date.
 */
export function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000)
}

/**
 * Julian centuries from J2000.0 (in TT).
 * Used as the standard argument for precession and nutation polynomials.
 */
export function jdTTtoT(jdTT: number): number {
  return (jdTT - J2000) / DAYS_PER_JULIAN_CENTURY
}

// ─── Time scale conversions ───────────────────────────────────────────────────

/**
 * Compute all relevant time scales for a given UTC Date.
 *
 * @param utc - Input time in UTC
 * @param ut1utcOverride - UT1 - UTC in seconds (from IERS Bulletin A). Falls
 *   back to 0 when not provided, which introduces ~0.9s error in ERA at most.
 * @param deltaTOverride - TT - UT1 in seconds. When provided, overrides the
 *   polynomial approximation. Provide this for maximum accuracy.
 */
export function computeTimeScales(
  utc: Date,
  ut1utcOverride?: number,
  deltaTOverride?: number,
): TimeScales {
  const jdUTC = dateToJD(utc)
  const deltaAT = getDeltaAT(jdUTC)

  // UTC → TAI → TT
  const jdTAI = jdUTC + deltaAT / SECONDS_PER_DAY
  const jdTT = jdTAI + TT_MINUS_TAI / SECONDS_PER_DAY

  // TT → TDB (periodic correction, sub-millisecond)
  const tdbCorrection = tdbMinusTT(jdTT) / SECONDS_PER_DAY
  const jdTDB = jdTT + tdbCorrection

  // UT1
  let jdUT1: number
  let deltaT: number

  if (ut1utcOverride !== undefined) {
    jdUT1 = jdUTC + ut1utcOverride / SECONDS_PER_DAY
    deltaT = (jdTT - jdUT1) * SECONDS_PER_DAY
  } else if (deltaTOverride !== undefined) {
    deltaT = deltaTOverride
    jdUT1 = jdTT - deltaT / SECONDS_PER_DAY
  } else {
    deltaT = deltaTPolynomial(jdTT)
    jdUT1 = jdTT - deltaT / SECONDS_PER_DAY
  }

  return { utc, jdUTC, jdTT, jdTDB, jdUT1, deltaT, deltaAT }
}

/**
 * Convert Julian Date in TT to ET seconds past J2000.0.
 * ET (Ephemeris Time) is used as the time argument in SPK kernels.
 * TDB and TT differ by at most ~1.7ms; applying the correction here
 * gives the proper SPICE-compatible ET value.
 */
export function jdTTtoET(jdTT: number): number {
  const tdbCorr = tdbMinusTT(jdTT)
  return (jdTT - J2000) * SECONDS_PER_DAY + tdbCorr
}

/**
 * Approximate TDB - TT in seconds.
 * Uses the SPICE-consistent formulation from the LSK kernel constants.
 *
 * TDB - TT = 0.001658 * sin(g) + 0.000014 * sin(2g)
 * where g = 357.53° + 0.9856003° * (JD_TT - 2451545.0) [mean anomaly of the Sun]
 *
 * Maximum error: ~30 microseconds (acceptable for crescent work).
 */
export function tdbMinusTT(jdTT: number): number {
  const d = jdTT - J2000
  // Mean anomaly of the Sun (degrees)
  const gDeg = 357.53 + 0.9856003 * d
  const g = (gDeg * Math.PI) / 180
  return 0.001658 * Math.sin(g) + 0.000014 * Math.sin(2 * g)
}

/**
 * Delta-T polynomial: TT - UT1 in seconds.
 * Uses Espenak & Meeus expressions, piecewise by year range.
 *
 * Reference: NASA Five Millennium Canon of Solar Eclipses, Espenak & Meeus (2009)
 */
export function deltaTPolynomial(jdTT: number): number {
  // Convert JD to decimal year
  const y = 2000 + (jdTT - J2000) / 365.25

  if (y < -500) {
    const u = (y - 1820) / 100
    return -20 + 32 * u * u
  } else if (y < 500) {
    const u = y / 100
    return (
      10583.6 - 1014.41 * u + 33.78311 * u * u - 5.952053 * u * u * u -
      0.1798452 * u ** 4 + 0.022174192 * u ** 5 + 0.0090316521 * u ** 6
    )
  } else if (y < 1600) {
    const u = (y - 1000) / 100
    return (
      1574.2 - 556.01 * u + 71.23472 * u * u + 0.319781 * u ** 3 -
      0.8503463 * u ** 4 - 0.005050998 * u ** 5 + 0.0083572073 * u ** 6
    )
  } else if (y < 1700) {
    const t = y - 1600
    return 120 - 0.9808 * t - 0.01532 * t * t + t ** 3 / 7129
  } else if (y < 1800) {
    const t = y - 1700
    return (
      8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t ** 3 - t ** 4 / 1174000
    )
  } else if (y < 1860) {
    const t = y - 1800
    return (
      13.72 - 0.332447 * t + 0.0068612 * t * t + 0.0041116 * t ** 3 -
      0.00037436 * t ** 4 + 0.0000121272 * t ** 5 -
      0.0000001699 * t ** 6 + 0.000000000875 * t ** 7
    )
  } else if (y < 1900) {
    const t = y - 1860
    return (
      7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t ** 3 -
      0.0004473624 * t ** 4 + t ** 5 / 233174
    )
  } else if (y < 1920) {
    const t = y - 1900
    return (
      -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4
    )
  } else if (y < 1941) {
    const t = y - 1920
    return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3
  } else if (y < 1961) {
    const t = y - 1950
    return 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547
  } else if (y < 1986) {
    const t = y - 1975
    return 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718
  } else if (y < 2005) {
    const t = y - 2000
    return (
      63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 +
      0.000651814 * t ** 4 + 0.00002373599 * t ** 5
    )
  } else if (y < 2050) {
    const t = y - 2000
    return 62.92 + 0.32217 * t + 0.005589 * t * t
  } else if (y < 2150) {
    return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y)
  } else {
    const u = (y - 1820) / 100
    return -20 + 32 * u * u
  }
}
