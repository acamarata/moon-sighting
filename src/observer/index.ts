/**
 * observer — WGS84 geodetic to ECEF, topocentric transforms, and refraction.
 *
 * Observer position chain:
 *   geodetic (lat, lon, elev) → ECEF (ITRS, meters) → km → GCRS (via frames/) → topocentric ENU → az/alt
 *
 * The WGS84 ellipsoid defines the reference for geodetic coordinates:
 *   a = 6378137.0 m (semi-major axis)
 *   1/f = 298.257223563 (inverse flattening)
 *
 * Atmospheric refraction is significant near the horizon (up to ~34' at altitude 0°).
 * The Bennett (1982) formula is the standard practical approximation; it accepts
 * pressure and temperature for improved accuracy.
 *
 * References:
 *   WGS84 definition: NIMA TR8350.2, 3rd edition
 *   Bennett (1982), Astronomical Refraction for Upper and Lower Limbs
 *   Saemundsson (1986), Sky & Telescope 72, 70
 */

import type { Vec3, Observer, AzAlt, TimeScales } from '../types.js'
import { WGS84 } from '../types.js'
import { gcrsToItrs } from '../frames/index.js'

// ─── Geodetic ↔ ECEF ─────────────────────────────────────────────────────────

/**
 * Convert geodetic coordinates to ECEF (Earth-Centered, Earth-Fixed) position.
 * Result is in meters, consistent with the WGS84 ellipsoid.
 *
 * @param lat - Geodetic latitude in degrees (north positive)
 * @param lon - Longitude in degrees (east positive)
 * @param elev - Height above ellipsoid in meters
 * @returns ECEF position vector in meters
 */
export function geodeticToECEF(lat: number, lon: number, elev: number): Vec3 {
  const phi = (lat * Math.PI) / 180
  const lam = (lon * Math.PI) / 180
  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  // Prime vertical radius of curvature
  const N = WGS84.a / Math.sqrt(1 - WGS84.e2 * sinPhi * sinPhi)
  return [
    (N + elev) * cosPhi * Math.cos(lam),
    (N + elev) * cosPhi * Math.sin(lam),
    (N * (1 - WGS84.e2) + elev) * sinPhi,
  ]
}

/**
 * Convert ECEF position (meters) to geodetic coordinates.
 * Uses Bowring's iterative method (converges in 3 iterations for < 1 mm error).
 *
 * @returns { lat, lon, h } — latitude/longitude in degrees, height in meters
 */
export function ecefToGeodetic(ecef: Vec3): { lat: number; lon: number; h: number } {
  const [X, Y, Z] = ecef
  const p = Math.sqrt(X * X + Y * Y)
  const lon = Math.atan2(Y, X)

  // Bowring iteration for geodetic latitude
  let lat = Math.atan2(Z, p * (1 - WGS84.e2))
  for (let i = 0; i < 4; i++) {
    const sinLat = Math.sin(lat)
    const N = WGS84.a / Math.sqrt(1 - WGS84.e2 * sinLat * sinLat)
    lat = Math.atan2(Z + WGS84.e2 * N * sinLat, p)
  }

  const sinLat = Math.sin(lat)
  const N = WGS84.a / Math.sqrt(1 - WGS84.e2 * sinLat * sinLat)
  const h = p / Math.cos(lat) - N

  return {
    lat: (lat * 180) / Math.PI,
    lon: (lon * 180) / Math.PI,
    h,
  }
}

// ─── Topocentric ENU ─────────────────────────────────────────────────────────

/**
 * Compute the East-North-Up (ENU) basis vectors at a geodetic location.
 * These unit vectors define the local horizon coordinate frame in ECEF/ITRS.
 *
 * East  = (−sin λ,  cos λ,       0)
 * North = (−sin φ·cos λ, −sin φ·sin λ,  cos φ)
 * Up    = ( cos φ·cos λ,  cos φ·sin λ,  sin φ)
 *
 * @param lat - Geodetic latitude in degrees
 * @param lon - Longitude in degrees
 */
export function computeENUBasis(lat: number, lon: number): { east: Vec3; north: Vec3; up: Vec3 } {
  const phi = (lat * Math.PI) / 180
  const lam = (lon * Math.PI) / 180
  const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi)
  const sinLam = Math.sin(lam), cosLam = Math.cos(lam)

  const east: Vec3 = [-sinLam, cosLam, 0]
  const north: Vec3 = [-sinPhi * cosLam, -sinPhi * sinLam, cosPhi]
  const up: Vec3    = [ cosPhi * cosLam,  cosPhi * sinLam, sinPhi]

  return { east, north, up }
}

/**
 * Convert a vector from ECEF frame to the local ENU frame at the observer.
 * The ECEF input vector represents the displacement from observer to target.
 *
 * @param ecefDelta - ECEF displacement vector (target - observer), any units
 * @param lat - Observer geodetic latitude in degrees
 * @param lon - Observer longitude in degrees
 * @returns ENU vector [east, north, up] in the same units as input
 */
export function ecefToENU(ecefDelta: Vec3, lat: number, lon: number): Vec3 {
  const { east, north, up } = computeENUBasis(lat, lon)
  const dot = (a: Vec3, b: Vec3) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
  return [dot(ecefDelta, east), dot(ecefDelta, north), dot(ecefDelta, up)]
}

/**
 * Convert a topocentric ENU vector to azimuth and altitude.
 *
 * Azimuth is measured from North clockwise: 0° = N, 90° = E, 180° = S, 270° = W.
 * Altitude is degrees above the horizon (negative = below).
 *
 * @param enu - [east, north, up] components (any consistent units)
 * @returns Azimuth (degrees, [0, 360)) and altitude (degrees)
 */
export function enuToAzAlt(enu: Vec3): AzAlt {
  const [e, n, u] = enu
  const horiz = Math.sqrt(e * e + n * n)
  const altitude = (Math.atan2(u, horiz) * 180) / Math.PI
  // atan2(east, north) gives bearing from North; convert to [0, 360)
  let azimuth = (Math.atan2(e, n) * 180) / Math.PI
  if (azimuth < 0) azimuth += 360
  return { azimuth, altitude }
}

// ─── Topocentric parallax ─────────────────────────────────────────────────────

/**
 * Compute the topocentric position of a body by subtracting the observer's
 * geocentric position from the geocentric body position.
 *
 * This is the primary parallax correction. The Moon's horizontal parallax
 * (~57 arcmin) makes this non-trivial — topocentric position differs from
 * geocentric by up to the Moon's angular diameter.
 *
 * @param bodyGCRS - Geocentric body position in km (GCRS)
 * @param observerGCRS - Observer position in km (GCRS)
 * @returns Topocentric body position in km (GCRS)
 */
export function topocentricPosition(bodyGCRS: Vec3, observerGCRS: Vec3): Vec3 {
  return [
    bodyGCRS[0] - observerGCRS[0],
    bodyGCRS[1] - observerGCRS[1],
    bodyGCRS[2] - observerGCRS[2],
  ]
}

// ─── Full pipeline: GCRS → az/alt ────────────────────────────────────────────

/**
 * Compute topocentric azimuth and altitude for a body, given its GCRS position
 * and the observer's location.
 *
 * Pipeline:
 *   1. body GCRS → body ITRS (via gcrsToItrs)
 *   2. observer geodetic → observer ECEF (ITRS, meters → km)
 *   3. delta_ITRS = body_ITRS - observer_ITRS
 *   4. delta_ITRS → ENU via projection on local basis
 *   5. ENU → az/alt
 *   6. Apply Bennett refraction if not airless
 *
 * @param bodyGCRS - Geocentric body position in km (GCRS)
 * @param observer - Observer location
 * @param ts - Time scales for the epoch (needed for GCRS→ITRS rotation)
 * @param airless - If true, return geometric altitude without refraction
 * @returns Azimuth (degrees from N, clockwise) and altitude (degrees)
 */
export function computeAzAlt(
  bodyGCRS: Vec3,
  observer: Observer,
  ts: TimeScales,
  airless: boolean,
): AzAlt {

  // 1. Convert body position from GCRS to ITRS (km)
  const bodyITRS = gcrsToItrs(bodyGCRS, ts)

  // 2. Observer position in ITRS: geodeticToECEF returns meters → convert to km
  const obsECEF = geodeticToECEF(observer.lat, observer.lon, observer.elevation)
  const obsITRS: Vec3 = [obsECEF[0] / 1000, obsECEF[1] / 1000, obsECEF[2] / 1000]

  // 3. Displacement vector from observer to body in ITRS (km — magnitude doesn't matter)
  const delta: Vec3 = [
    bodyITRS[0] - obsITRS[0],
    bodyITRS[1] - obsITRS[1],
    bodyITRS[2] - obsITRS[2],
  ]

  // 4. Project onto local ENU basis at the observer's location
  const enu = ecefToENU(delta, observer.lat, observer.lon)

  // 5. Convert ENU to azimuth + altitude
  const azAlt = enuToAzAlt(enu)

  // 6. Refraction correction
  if (!airless) {
    azAlt.altitude = applyRefraction(
      azAlt.altitude,
      observer.pressure,
      observer.temperature,
    )
  }

  return azAlt
}

// ─── Atmospheric refraction ───────────────────────────────────────────────────

/**
 * Bennett (1982) atmospheric refraction correction.
 * Adds the refraction amount to the geometric (airless) altitude.
 *
 * Accurate to ~0.1 arcmin for altitudes > 5°; degrades below that.
 * At 0° altitude, refraction ≈ 34 arcmin.
 *
 * Formula: R = cot(h + 7.31 / (h + 4.4)) / 60  [degrees]
 * where h is the geometric altitude in degrees.
 *
 * Pressure/temperature correction:
 *   R_adj = R × (P / 1010) × (283 / (273 + T))
 *
 * @param altitudeDeg - Geometric (airless) altitude in degrees
 * @param pressure - Atmospheric pressure in millibars (default 1013.25)
 * @param temperature - Temperature in Celsius (default 15)
 * @returns Refraction to add to the altitude, in degrees
 */
export function bennettRefraction(
  altitudeDeg: number,
  pressure = 1013.25,
  temperature = 15,
): number {
  // No refraction below the geometric horizon (Bennett formula diverges below ~−1°)
  if (altitudeDeg < -1) return 0

  // Convert altitude argument to radians for the cot computation
  const h = altitudeDeg
  const argDeg = h + 7.31 / (h + 4.4)
  const argRad = (argDeg * Math.PI) / 180
  const R = 1 / (Math.tan(argRad) * 60) // degrees

  // Pressure and temperature correction
  const corrected = R * (pressure / 1010) * (283 / (273 + temperature))
  return Math.max(0, corrected)
}

/**
 * Apply refraction correction to an airless altitude.
 * Returns the apparent (observed) altitude.
 */
export function applyRefraction(
  airlessAlt: number,
  pressure = 1013.25,
  temperature = 15,
): number {
  return airlessAlt + bennettRefraction(airlessAlt, pressure, temperature)
}

/**
 * Remove refraction from an apparent altitude to get the airless altitude.
 * Iterative inversion of the Bennett formula — converges in 3 iterations.
 */
export function removeRefraction(
  apparentAlt: number,
  pressure = 1013.25,
  temperature = 15,
): number {
  // Start from the apparent altitude and iterate
  let airless = apparentAlt
  for (let i = 0; i < 4; i++) {
    airless = apparentAlt - bennettRefraction(airless, pressure, temperature)
  }
  return airless
}
