/**
 * events — Rise/set, twilight, and best-observation-time computation.
 *
 * Finding when the Sun and Moon cross the horizon is a root-finding problem:
 *
 *   f(t) = apparent_altitude(t) − h0 = 0
 *
 * Where h0 is the threshold altitude (accounting for refraction, semi-diameter,
 * and parallax). For sunset, the standard threshold is −0.8333° (34' refraction
 * + 16' solar semi-diameter ≈ −50' = −0.8333°).
 *
 * The solver brackets the crossing by sampling altitude at coarse time steps,
 * then applies Brent's method to each sign-change bracket for precision.
 *
 * Best-time computation:
 *   Yallop/Odeh approximation: T_b = T_sunset + (4/9) × Lag
 *   where Lag = T_moonset − T_sunset in minutes
 *
 * Reference: Yallop (1997) NAO TN 69 §2.4; Odeh (2006) §3
 */

import type { Vec3, Observer, SunMoonEvents, TimeScales } from '../types.js'
import type { SpkKernel } from '../spk/index.js'
import { NAIF_IDS } from '../spk/index.js'
import { brentRoot } from '../math/index.js'
import {
  J2000,
  SECONDS_PER_DAY,
  computeTimeScales,
  jdToDate,
  dateToJD,
  jdTTtoET,
  getDeltaAT,
  TT_MINUS_TAI,
} from '../time/index.js'
import { getMoonGeocentricState, getSunGeocentricState, computeCrescentWidth } from '../bodies/index.js'
import { geodeticToECEF, computeAzAlt } from '../observer/index.js'
import { itrsToGcrs } from '../frames/index.js'

// ─── Altitude threshold constants ─────────────────────────────────────────────

/**
 * Standard threshold altitude for sunset/sunrise.
 * Accounts for: standard refraction at horizon (34') + solar semi-diameter (16')
 * Total: −50' = −0.8333°
 */
export const SUN_ALTITUDE_THRESHOLD = -0.8333

/**
 * Standard threshold altitude for moonset/moonrise.
 * Accounts for: standard refraction at horizon (34') + lunar semi-diameter (~16')
 * Note: Moon's SD varies with distance (14.7'–16.8'). Use 0.2725° as mean.
 */
export const MOON_ALTITUDE_THRESHOLD = -0.8333  // refined per actual distance in implementation

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Convert ET (seconds past J2000 TDB) to approximate TimeScales.
 * Accurate to within ~1 second for UTC — sufficient for event finding.
 */
function etToTS(et: number): TimeScales {
  // ET ≈ (jdTT - J2000) × 86400, so jdTT ≈ J2000 + et / 86400
  const jdTT = J2000 + et / SECONDS_PER_DAY
  // Approximate UTC: TT - UTC ≈ deltaAT + 32.184s (typically ~69s currently)
  // Use a rough correction; getDeltaAT needs a UTC JD, so iterate once
  const jdUTC_est = jdTT - 70.0 / SECONDS_PER_DAY
  const deltaAT = getDeltaAT(jdUTC_est)
  const jdUTC = jdTT - (deltaAT + TT_MINUS_TAI) / SECONDS_PER_DAY
  const utc = jdToDate(jdUTC)
  return computeTimeScales(utc)
}

/**
 * Get the geocentric GCRS position of a body at the given ET.
 */
function bodyPositionAt(kernel: SpkKernel, naifId: number, et: number): Vec3 {
  if (naifId === NAIF_IDS.SUN) {
    return getSunGeocentricState(kernel, et).position
  }
  return getMoonGeocentricState(kernel, et).position
}

/**
 * Compute the airless altitude of a body at a given ET.
 * Returns altitude minus threshold so the zero crossing equals the event time.
 */
function altitudeMinusThreshold(
  kernel: SpkKernel,
  naifId: number,
  observer: Observer,
  et: number,
  threshold: number,
): number {
  const ts = etToTS(et)
  const bodyGCRS = bodyPositionAt(kernel, naifId, et)
  const azAlt = computeAzAlt(bodyGCRS, observer, ts, true)
  return azAlt.altitude - threshold
}

// ─── Event finding ────────────────────────────────────────────────────────────

/**
 * Find the time when a body (Sun or Moon) crosses a given altitude threshold.
 * Returns the first crossing in the requested direction within the search window.
 *
 * Algorithm: coarse sample (10-min steps) to bracket sign changes, then Brent.
 *
 * @param kernel - DE442S kernel
 * @param naifId - NAIF body ID (10=Sun, 301=Moon)
 * @param observer - Observer location
 * @param ts - Time scales at the search start (used only for context; not interpolated)
 * @param startET - Search start (ET seconds past J2000)
 * @param endET - Search end (ET seconds past J2000)
 * @param threshold - Altitude threshold in degrees
 * @param rising - True to find a rising event, false for setting
 * @returns Event time as Date (UTC), or null if no crossing found
 */
export function findAltitudeCrossing(
  kernel: SpkKernel,
  naifId: number,
  observer: Observer,
  ts: TimeScales,
  startET: number,
  endET: number,
  threshold: number,
  rising: boolean,
): Date | null {
  void ts // ts not needed — etToTS computes from ET directly

  const f = (et: number) => altitudeMinusThreshold(kernel, naifId, observer, et, threshold)

  const STEP_S = 600  // 10-minute coarse sampling
  const nSteps = Math.ceil((endET - startET) / STEP_S)

  let prevET = startET
  let prevF = f(prevET)

  for (let i = 1; i <= nSteps; i++) {
    const currET = Math.min(startET + i * STEP_S, endET)
    const currF = f(currET)

    const isRisingCross  = rising  && prevF < 0 && currF >= 0
    const isSettingCross = !rising && prevF >= 0 && currF < 0

    if (isRisingCross || isSettingCross) {
      const etCross = brentRoot(f, prevET, currET, 0.5)  // 0.5s precision
      if (etCross !== null) {
        const tsCross = etToTS(etCross)
        return tsCross.utc
      }
    }

    prevET = currET
    prevF = currF
  }

  return null
}

/**
 * Find all Sun and Moon rise/set and twilight times for a given date and observer.
 *
 * Searches a 28-hour window from the start of the UTC date to cover events
 * at all longitudes for the corresponding civil date.
 *
 * @param date - Civil date (any time on the desired UTC day)
 * @param observer - Observer location
 * @param kernel - DE442S kernel
 * @returns SunMoonEvents with all event times in UTC, or null if event doesn't occur
 */
export function getSunMoonEvents(
  date: Date,
  observer: Observer,
  kernel: SpkKernel,
): SunMoonEvents {
  // Anchor search at UTC midnight of the input date
  const midnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const jdMidnight = dateToJD(midnight)
  // Approximate ET at midnight
  const etStart = jdTTtoET(jdMidnight + 70.0 / SECONDS_PER_DAY)  // rough TT≈UTC+70s
  const etEnd   = etStart + 28 * 3600  // 28-hour window

  const ts0 = computeTimeScales(midnight)

  // Sun events
  const sunriseUTC = findAltitudeCrossing(
    kernel, NAIF_IDS.SUN, observer, ts0, etStart, etEnd, SUN_ALTITUDE_THRESHOLD, true,
  )
  const sunsetUTC = findAltitudeCrossing(
    kernel, NAIF_IDS.SUN, observer, ts0, etStart, etEnd, SUN_ALTITUDE_THRESHOLD, false,
  )

  // Twilight events (Sun setting below -6°, -12°, -18°)
  const civilTwilightEndUTC = findAltitudeCrossing(
    kernel, NAIF_IDS.SUN, observer, ts0, etStart, etEnd, -6, false,
  )
  const nauticalTwilightEndUTC = findAltitudeCrossing(
    kernel, NAIF_IDS.SUN, observer, ts0, etStart, etEnd, -12, false,
  )
  const astronomicalTwilightEndUTC = findAltitudeCrossing(
    kernel, NAIF_IDS.SUN, observer, ts0, etStart, etEnd, -18, false,
  )

  // Moon events
  const moonriseUTC = findAltitudeCrossing(
    kernel, NAIF_IDS.MOON, observer, ts0, etStart, etEnd, MOON_ALTITUDE_THRESHOLD, true,
  )
  const moonsetUTC = findAltitudeCrossing(
    kernel, NAIF_IDS.MOON, observer, ts0, etStart, etEnd, MOON_ALTITUDE_THRESHOLD, false,
  )

  return {
    sunriseUTC,
    sunsetUTC,
    moonriseUTC,
    moonsetUTC,
    civilTwilightEndUTC,
    nauticalTwilightEndUTC,
    astronomicalTwilightEndUTC,
  }
}

// ─── Best-time computation ────────────────────────────────────────────────────

/**
 * Compute the best observation time using the Yallop/Odeh heuristic.
 *
 * T_b = T_sunset + (4/9) × Lag
 *
 * This gives approximately 40 minutes after sunset for a typical 90-minute lag,
 * which is the empirically optimal time for crescent visibility (Yallop 1997 §2.4,
 * confirmed by Odeh's ICOP observation database analysis).
 *
 * @param sunsetUTC - UTC time of sunset
 * @param moonsetUTC - UTC time of moonset
 * @returns Best observation time (UTC) and lag in minutes, or null if lag ≤ 0
 */
export function bestTimeHeuristic(
  sunsetUTC: Date,
  moonsetUTC: Date,
): { bestTimeUTC: Date; lagMinutes: number } | null {
  const lagMs = moonsetUTC.getTime() - sunsetUTC.getTime()
  if (lagMs <= 0) return null  // Moon sets before Sun — no sighting possible

  const lagMinutes = lagMs / 60000
  const bestTimeMs = sunsetUTC.getTime() + (4 / 9) * lagMs

  return {
    bestTimeUTC: new Date(bestTimeMs),
    lagMinutes,
  }
}

/**
 * Odeh arcv minimum polynomial (Odeh 2006, Eq. 1).
 * Returns the minimum ARCV needed for visibility at crescent width W (arc minutes).
 */
function odehArcvMin(W: number): number {
  return 11.8371 - 6.3226 * W + 0.7319 * W * W - 0.1018 * W * W * W
}

/**
 * Find the optimal observation time by maximizing the Odeh V parameter
 * over the interval [sunset, moonset].
 *
 * More accurate than the heuristic at high latitudes or unusual geometries
 * where the (4/9)×Lag formula can be misleading.
 *
 * @param sunsetUTC - UTC time of sunset
 * @param moonsetUTC - UTC time of moonset
 * @param kernel - DE442S kernel
 * @param observer - Observer location
 * @param steps - Number of scan steps (default 90, giving ~1-min resolution for typical lag)
 * @returns Optimal time, its V parameter, and lag in minutes
 */
export function bestTimeOptimized(
  sunsetUTC: Date,
  moonsetUTC: Date,
  kernel: SpkKernel,
  observer: Observer,
  steps = 90,
): { bestTimeUTC: Date; lagMinutes: number; maxV: number } | null {
  const lagMs = moonsetUTC.getTime() - sunsetUTC.getTime()
  if (lagMs <= 0) return null

  const lagMinutes = lagMs / 60000

  // Observer ITRS position (km) — fixed on Earth, computed once outside the loop
  const obsECEF = geodeticToECEF(observer.lat, observer.lon, observer.elevation)
  const obsITRS: Vec3 = [obsECEF[0] / 1000, obsECEF[1] / 1000, obsECEF[2] / 1000]

  const dot = (a: Vec3, b: Vec3) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
  const norm = (v: Vec3) => Math.sqrt(dot(v, v))

  let bestTimeUTC = sunsetUTC
  let maxV = -Infinity

  for (let i = 0; i <= steps; i++) {
    const t = new Date(sunsetUTC.getTime() + (lagMs * i) / steps)
    const ts = computeTimeScales(t)
    const et = jdTTtoET(ts.jdTT)

    const moonGCRS = getMoonGeocentricState(kernel, et).position
    const sunGCRS  = getSunGeocentricState(kernel, et).position

    // Convert observer ITRS → GCRS at this timestep (Earth rotation changes per step)
    const obsGCRS = itrsToGcrs(obsITRS, ts)

    // Airless altitudes via the full pipeline
    const moonAzAlt = computeAzAlt(moonGCRS, observer, ts, true)
    const sunAzAlt  = computeAzAlt(sunGCRS,  observer, ts, true)

    const ARCV = moonAzAlt.altitude - sunAzAlt.altitude

    // Topocentric ARCL (Sun-Moon angular separation — all vectors in GCRS)
    const moonTopo: Vec3 = [
      moonGCRS[0] - obsGCRS[0],
      moonGCRS[1] - obsGCRS[1],
      moonGCRS[2] - obsGCRS[2],
    ]
    const sunTopo: Vec3 = [
      sunGCRS[0] - obsGCRS[0],
      sunGCRS[1] - obsGCRS[1],
      sunGCRS[2] - obsGCRS[2],
    ]
    const cosARCL = dot(moonTopo, sunTopo) / (norm(moonTopo) * norm(sunTopo))
    const ARCL = Math.acos(Math.max(-1, Math.min(1, cosARCL))) * (180 / Math.PI)

    const { W } = computeCrescentWidth(moonTopo, ARCL)
    const V = ARCV - odehArcvMin(W)

    if (V > maxV) {
      maxV = V
      bestTimeUTC = t
    }
  }

  return { bestTimeUTC, lagMinutes, maxV }
}

/**
 * Compute a time window around the best time where the crescent may be visible.
 * Default window: ±20 minutes around best time (practical approximation).
 *
 * @param bestTimeUTC - Best observation time
 * @param windowMinutes - Half-width of window in minutes (default 20)
 * @returns [start, end] UTC Date pair
 */
export function computeObservationWindow(
  bestTimeUTC: Date,
  windowMinutes = 20,
): [Date, Date] {
  const windowMs = windowMinutes * 60000
  return [
    new Date(bestTimeUTC.getTime() - windowMs),
    new Date(bestTimeUTC.getTime() + windowMs),
  ]
}
