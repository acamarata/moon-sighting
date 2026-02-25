/**
 * visibility — Crescent visibility criteria: Yallop and Odeh.
 *
 * Both criteria transform the five geometric quantities (ARCL, ARCV, DAZ, W, Lag)
 * into a single score that maps to a visibility category.
 *
 * Yallop (NAO Technical Note 69, 1997):
 *   q = (ARCV - (11.8371 - 6.3226*W' + 0.7319*W'^2 - 0.1018*W'^3)) / 10
 *   where W' is the topocentric crescent width in arc minutes.
 *   Categories: A (q > 0.216) through F (q <= -0.293)
 *
 * Odeh (Experimental Astronomy 2006):
 *   V = ARCV - arcv_min(W)
 *   where arcv_min(W) = 11.8371 - 6.3226*W + 0.7319*W^2 - 0.1018*W^3 (same polynomial as Yallop)
 *   Zones: A (V >= 5.65) through D (V < -0.96)
 *
 * The geometric quantities must be computed at best time T_b using AIRLESS
 * (refraction-free) topocentric altitudes for both models.
 *
 * References:
 *   Yallop (1997), A Method for Predicting the First Sighting of the New Crescent Moon,
 *     NAO Technical Note No. 69, Royal Greenwich Observatory
 *   Odeh (2006), New Criterion for Lunar Crescent Visibility,
 *     Experimental Astronomy 18(1), 39-64
 */

import type {
  CrescentGeometry,
  YallopResult,
  YallopCategory,
  OdehResult,
  OdehZone,
} from '../types.js'
import {
  YALLOP_THRESHOLDS,
  YALLOP_DESCRIPTIONS,
  ODEH_THRESHOLDS,
  ODEH_DESCRIPTIONS,
} from '../types.js'
import { angularSep } from '../math/index.js'
import { computeCrescentWidth } from '../bodies/index.js'

// ─── Shared polynomial ────────────────────────────────────────────────────────

/**
 * The polynomial ARCV minimum as a function of crescent width W (arc minutes).
 * This expression appears in both Yallop (as the denominator basis) and Odeh
 * (as arcv_min directly).
 *
 * arcv_min(W) = 11.8371 - 6.3226*W + 0.7319*W^2 - 0.1018*W^3
 *
 * Represents the minimum arc of vision required for detection as a function
 * of crescent width, derived empirically from historical observations.
 *
 * @param W - Topocentric crescent width in arc minutes
 * @returns Minimum ARCV required for detection, in degrees
 */
export function arcvMinimum(W: number): number {
  return 11.8371 - 6.3226 * W + 0.7319 * W * W - 0.1018 * W * W * W
}

// ─── Yallop q-test ────────────────────────────────────────────────────────────

/**
 * Compute the Yallop q parameter.
 *
 * q = (ARCV - arcv_min(W')) / 10
 *
 * A positive q means the actual ARCV exceeds the minimum required, scaled
 * so that thresholds A–F correspond to intuitive distance from the boundary.
 *
 * @param ARCV - Topocentric airless arc of vision in degrees
 * @param Wprime - Topocentric crescent width W' in arc minutes (Yallop's topocentric form)
 * @returns q parameter (continuous)
 */
export function computeYallopQ(ARCV: number, Wprime: number): number {
  return (ARCV - arcvMinimum(Wprime)) / 10
}

/**
 * Map a q value to the Yallop category (A–F).
 *
 * Thresholds (Yallop 1997 Table 1):
 *   A: q > +0.216
 *   B: q > -0.014
 *   C: q > -0.160
 *   D: q > -0.232
 *   E: q > -0.293
 *   F: q <= -0.293
 */
export function yallopCategory(q: number): YallopCategory {
  if (q > YALLOP_THRESHOLDS.A) return 'A'
  if (q > YALLOP_THRESHOLDS.B) return 'B'
  if (q > YALLOP_THRESHOLDS.C) return 'C'
  if (q > YALLOP_THRESHOLDS.D) return 'D'
  if (q > YALLOP_THRESHOLDS.E) return 'E'
  return 'F'
}

/**
 * Compute the full Yallop result from crescent geometry.
 *
 * @param geometry - CrescentGeometry (W is assumed to be Wprime for Yallop purposes)
 * @param Wprime - Topocentric crescent width in arc minutes (may differ from geometry.W)
 */
export function computeYallop(geometry: CrescentGeometry, Wprime: number): YallopResult {
  const q = computeYallopQ(geometry.ARCV, Wprime)
  const category = yallopCategory(q)

  return {
    q,
    category,
    description: YALLOP_DESCRIPTIONS[category],
    isVisibleNakedEye: category === 'A' || category === 'B',
    requiresOpticalAid: category === 'C' || category === 'D',
    isBelowDanjonLimit: category === 'F',
    Wprime,
  }
}

// ─── Odeh criterion ───────────────────────────────────────────────────────────

/**
 * Compute the Odeh V parameter.
 *
 * V = ARCV - arcv_min(W)
 *
 * Where W is the topocentric crescent width in arc minutes (Odeh's formulation
 * uses W directly, not the Yallop W' correction).
 *
 * A positive V indicates the observed ARCV exceeds the minimum threshold for
 * visibility at that crescent width.
 *
 * @param ARCV - Topocentric airless arc of vision in degrees
 * @param W - Topocentric crescent width in arc minutes
 */
export function computeOdehV(ARCV: number, W: number): number {
  return ARCV - arcvMinimum(W)
}

/**
 * Map a V value to the Odeh zone (A–D).
 *
 * Thresholds (Odeh 2006 Table 1):
 *   A: V >= 5.65   — Visible with naked eye
 *   B: V >= 2.00   — Visible with optical aid; may be seen naked eye
 *   C: V >= -0.96  — Visible with optical aid only
 *   D: V <  -0.96  — Not visible even with optical aid
 */
export function odehZone(V: number): OdehZone {
  if (V >= ODEH_THRESHOLDS.A) return 'A'
  if (V >= ODEH_THRESHOLDS.B) return 'B'
  if (V >= ODEH_THRESHOLDS.C) return 'C'
  return 'D'
}

/**
 * Compute the full Odeh result from crescent geometry.
 * Uses geometry.W directly as the Odeh topocentric crescent width.
 */
export function computeOdeh(geometry: CrescentGeometry): OdehResult {
  const V = computeOdehV(geometry.ARCV, geometry.W)
  const zone = odehZone(V)

  return {
    V,
    zone,
    description: ODEH_DESCRIPTIONS[zone],
    isVisibleNakedEye: zone === 'A',
    isVisibleWithOpticalAid: zone === 'A' || zone === 'B',
  }
}

// ─── Geometry computation ─────────────────────────────────────────────────────

/**
 * Compute all five crescent geometry quantities (ARCL, ARCV, DAZ, W, Lag)
 * at a given best time.
 *
 * All angular quantities use AIRLESS topocentric positions as required by
 * both Yallop and Odeh criteria.
 *
 * @param moonAirlessAzAlt - Moon topocentric airless az/alt at best time
 * @param sunAirlessAzAlt - Sun topocentric airless az/alt at best time
 * @param moonGCRS - Topocentric Moon position vector (km) — for ARCL and W
 * @param sunGCRS - Topocentric Sun position vector (km) — for ARCL
 * @param sunsetUTC - UTC time of sunset
 * @param moonsetUTC - UTC time of moonset
 */
export function computeCrescentGeometry(
  moonAirlessAzAlt: { azimuth: number; altitude: number },
  sunAirlessAzAlt: { azimuth: number; altitude: number },
  moonGCRS: import('../types.js').Vec3,
  sunGCRS: import('../types.js').Vec3,
  sunsetUTC: Date,
  moonsetUTC: Date,
): CrescentGeometry {
  // ARCV: airless arc of vision (Moon altitude minus Sun altitude)
  const ARCV = moonAirlessAzAlt.altitude - sunAirlessAzAlt.altitude

  // DAZ: Sun azimuth minus Moon azimuth, normalized to (−180, 180]
  let DAZ = sunAirlessAzAlt.azimuth - moonAirlessAzAlt.azimuth
  if (DAZ > 180) DAZ -= 360
  if (DAZ < -180) DAZ += 360

  // ARCL: topocentric Sun-Moon angular separation in degrees
  // angularSep returns radians; both vectors must be topocentric for accurate ARCL
  const ARCL = angularSep(moonGCRS, sunGCRS) * (180 / Math.PI)

  // W: topocentric crescent width in arc minutes
  const { W } = computeCrescentWidth(moonGCRS, ARCL)

  // lag: moonset minus sunset in minutes (negative = Moon sets before Sun)
  const lag = (moonsetUTC.getTime() - sunsetUTC.getTime()) / 60000

  return { ARCL, ARCV, DAZ, W, lag }
}

// ─── Guidance text ────────────────────────────────────────────────────────────

/**
 * Generate human-readable sighting guidance based on the crescent report.
 *
 * @param yallop - Yallop result
 * @param odeh - Odeh result
 * @param moonAz - Moon azimuth at best time (degrees from North)
 * @param moonAlt - Moon altitude at best time (degrees)
 * @param bestTimeUTC - Best observation time
 * @param lagMinutes - Lag in minutes
 * @returns Guidance string for observers
 */
export function buildGuidanceText(
  yallop: YallopResult,
  odeh: OdehResult,
  moonAz: number,
  moonAlt: number,
  bestTimeUTC: Date,
  lagMinutes: number,
): string {
  const direction = azimuthToCardinal(moonAz)
  const timeStr = bestTimeUTC.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
  const lagStr = `${Math.round(lagMinutes)} min after sunset`

  let visibility: string
  if (yallop.isVisibleNakedEye && odeh.isVisibleNakedEye) {
    visibility = 'should be visible to the naked eye'
  } else if (odeh.isVisibleWithOpticalAid) {
    visibility = 'may require binoculars or a telescope to spot'
  } else if (yallop.isBelowDanjonLimit) {
    visibility = 'is too close to the Sun to form a visible crescent (below Danjon limit)'
  } else {
    visibility = 'is not expected to be visible even with optical aid'
  }

  return (
    `Best time to look: ${timeStr} (${lagStr}). ` +
    `Look ${direction} at ${Math.round(moonAlt)}° above the horizon. ` +
    `The crescent ${visibility}. ` +
    `Yallop: ${yallop.category} (${yallop.description}). ` +
    `Odeh: ${odeh.zone} (${odeh.description}).`
  )
}

/** Convert azimuth degrees to a cardinal/intercardinal direction label */
function azimuthToCardinal(az: number): string {
  const dirs = ['North', 'NNE', 'NE', 'ENE', 'East', 'ESE', 'SE', 'SSE',
    'South', 'SSW', 'SW', 'WSW', 'West', 'WNW', 'NW', 'NNW']
  const idx = Math.round(az / 22.5) % 16
  return dirs[(idx + 16) % 16]
}
