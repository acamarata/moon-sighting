/**
 * frames — GCRS to ITRS coordinate transformation (IERS Q·R·W chain).
 *
 * To compute topocentric alt/az from inertial (GCRS/ICRF) coordinates, we apply
 * the IAU/IERS reference frame transformation:
 *
 *   [ITRS] = W(t) · R(t) · Q(t) · [GCRS]
 *
 * Where:
 *   Q(t) — Celestial motion: precession + nutation (IAU 2006/2000B)
 *   R(t) — Earth rotation: Earth Rotation Angle (ERA) from UT1
 *   W(t) — Polar motion: small offsets xp, yp from the CIP (typically < 1 arcsec)
 *
 * The CIP (Celestial Intermediate Pole) coordinates X, Y and the CIO locator s
 * parameterize Q(t). These are computed from IAU 2006 precession polynomials plus
 * the IAU 2000B 77-term nutation series (< 1 mas error, far below our 30" target).
 *
 * References:
 *   IERS Conventions (2010), Chapter 5
 *   IAU SOFA release 2023-10-11 (iauNut00b, iauEra00, iauPom00, iauC2ixys)
 *   Capitaine et al. (2003), Astronomy & Astrophysics 412, 567-586
 */

import type { Vec3, TimeScales } from '../types.js'
import type { Mat3 } from '../math/index.js'
import { mvmul, mmmul, mtranspose, rotX, rotY, rotZ } from '../math/index.js'
import { J2000, DAYS_PER_JULIAN_CENTURY } from '../time/index.js'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Arcseconds to radians */
const ARCSEC_RAD = Math.PI / (180 * 3600)

/** 0.1 microarcseconds to arcseconds (units of nutation coefficients) */
const UAS01_TO_ARCSEC = 1e-7

// ─── IAU 2000B Nutation Series ────────────────────────────────────────────────
//
// 77-term luni-solar nutation series from SOFA iauNut00b.c.
// Source: Mathews et al. (2002), J. Geophys. Res. 107(B4); SOFA release 2023-10-11.
//
// Format per row: [nl, nlp, nF, nD, nOm, ps, pst, pc, ec, ect, es]
//   nl..nOm — integer multipliers for Delaunay arguments l, l', F, D, Ω
//   ps, pst  — sin(arg) coefficient for dpsi, and its T rate [0.1 uas, 0.1 uas/cy]
//   pc       — cos(arg) coefficient for dpsi [0.1 uas]
//   ec, ect  — cos(arg) coefficient for deps, and its T rate [0.1 uas, 0.1 uas/cy]
//   es       — sin(arg) coefficient for deps [0.1 uas]
//
// Accumulation formulas:
//   dpsi += (ps + pst*T)*sin(arg) + pc*cos(arg)
//   deps += (ec + ect*T)*cos(arg) + es*sin(arg)

const NUT_2000B: ReadonlyArray<readonly [
  number,number,number,number,number,
  number,number,number,
  number,number,number
]> = [
  // 1
  [ 0, 0, 0, 0, 1, -172064161.0, -174666.0, 33386.0, 92052331.0, 9086.0, 15377.0],
  // 2
  [ 0, 0, 2,-2, 2, -13170906.0, -13696.0, -13238.0, 5730336.0, -3015.0, -4587.0],
  // 3
  [ 0, 0, 2, 0, 2,  -2276413.0,  -2353.0,   2796.0,  978459.0,  -619.0,   645.0],
  // 4
  [ 0, 0, 0, 0, 2,   2074554.0,   2352.0,  -2635.0, -897492.0,   307.0,  -187.0],
  // 5
  [ 0, 1, 0, 0, 0,   1475877.0, -11817.0,  11817.0,   73871.0,  -184.0, -1924.0],
  // 6
  [ 0, 1, 2,-2, 2,   -516821.0,   1226.0,   -524.0,  224386.0,  -677.0,  -174.0],
  // 7
  [ 1, 0, 0, 0, 0,    711159.0,     73.0,   -872.0,   -6750.0,     0.0,   358.0],
  // 8
  [ 0, 0, 2, 0, 1,   -387298.0,   -367.0,    380.0,  200728.0,    18.0,   318.0],
  // 9
  [ 1, 0, 2, 0, 2,   -301461.0,    -36.0,    816.0,  129025.0,   -63.0,   367.0],
  // 10
  [ 0,-1, 2,-2, 2,    215829.0,   -494.0,    111.0,  -95929.0,   299.0,   132.0],
  // 11
  [ 0, 0, 2,-2, 1,    128227.0,    137.0,    181.0,  -68982.0,    -9.0,    39.0],
  // 12
  [-1, 0, 2, 0, 2,    123457.0,     11.0,     19.0,  -53311.0,    32.0,    -4.0],
  // 13
  [-1, 0, 0, 2, 0,    156994.0,     10.0,   -168.0,   -1235.0,     0.0,    82.0],
  // 14
  [ 1, 0, 0, 0, 1,     63110.0,     63.0,     27.0,  -33228.0,     0.0,    -9.0],
  // 15
  [-1, 0, 0, 0, 1,    -57976.0,    -63.0,   -189.0,   31429.0,     0.0,   -75.0],
  // 16
  [-1, 0, 2, 2, 2,    -59641.0,    -11.0,    149.0,   25543.0,   -11.0,    66.0],
  // 17
  [ 1, 0, 2, 0, 1,    -51613.0,    -42.0,    129.0,   26366.0,     0.0,    78.0],
  // 18
  [-2, 0, 2, 0, 1,     45893.0,     50.0,     31.0,  -24236.0,   -10.0,    20.0],
  // 19
  [ 0, 0, 0, 2, 0,     63384.0,     11.0,   -150.0,   -1220.0,     0.0,    29.0],
  // 20
  [ 0, 0, 2, 2, 2,    -38571.0,     -1.0,    158.0,   16452.0,   -11.0,    68.0],
  // 21
  [ 0,-2, 2,-2, 2,     32481.0,      0.0,      0.0,  -13870.0,     0.0,     0.0],
  // 22
  [-2, 0, 0, 2, 0,    -47722.0,      0.0,    -18.0,     477.0,     0.0,   -25.0],
  // 23
  [ 2, 0, 2, 0, 2,    -31046.0,     -1.0,    131.0,   13238.0,   -11.0,    59.0],
  // 24
  [ 1, 0, 2,-2, 2,     28593.0,      0.0,     -1.0,  -12338.0,    10.0,    -3.0],
  // 25
  [-1, 0, 2, 0, 1,     20441.0,     21.0,     10.0,  -10758.0,     0.0,    -3.0],
  // 26
  [ 2, 0, 0, 0, 0,     29243.0,      0.0,    -74.0,    -609.0,     0.0,    13.0],
  // 27
  [ 0, 0, 2, 0, 0,     25887.0,      0.0,    -66.0,    -550.0,     0.0,    11.0],
  // 28
  [ 0, 1, 0, 0, 1,    -14053.0,    -25.0,     79.0,    8551.0,    -2.0,   -45.0],
  // 29
  [-1, 0, 0, 2, 1,     15164.0,     10.0,     11.0,   -8001.0,     0.0,    -1.0],
  // 30
  [ 0, 2, 2,-2, 2,    -15794.0,     72.0,    -16.0,    6850.0,   -42.0,    -5.0],
  // 31
  [ 0, 0,-2, 2, 0,     21783.0,      0.0,     13.0,    -167.0,     0.0,    13.0],
  // 32
  [ 1, 0, 0,-2, 1,    -12873.0,    -10.0,    -37.0,    6953.0,     0.0,   -14.0],
  // 33
  [ 0,-1, 0, 0, 1,    -12654.0,     11.0,     63.0,    6415.0,     0.0,    26.0],
  // 34
  [-1, 0, 2, 2, 1,    -10204.0,      0.0,     25.0,    5222.0,     0.0,    15.0],
  // 35
  [ 0, 2, 0, 0, 0,     16707.0,    -85.0,    -10.0,     168.0,    -1.0,    10.0],
  // 36
  [ 1, 0, 2, 2, 2,     -7691.0,      0.0,     44.0,    3268.0,     0.0,    19.0],
  // 37
  [-2, 0, 2, 0, 0,    -11024.0,      0.0,    -14.0,     104.0,     0.0,     2.0],
  // 38
  [ 0, 1, 2, 0, 2,      7566.0,    -21.0,    -11.0,   -3250.0,     0.0,    -5.0],
  // 39
  [ 0, 0, 2, 2, 1,     -6637.0,    -11.0,     25.0,    3353.0,     0.0,    14.0],
  // 40
  [ 0,-1, 2, 0, 2,     -7141.0,     21.0,      8.0,    3070.0,     0.0,     4.0],
  // 41
  [ 0, 0, 0, 2, 1,     -6302.0,    -11.0,      2.0,    3272.0,     0.0,     4.0],
  // 42
  [ 1, 0, 2,-2, 1,      5800.0,     10.0,      2.0,   -3045.0,     0.0,    -1.0],
  // 43
  [ 2, 0, 2,-2, 2,      6443.0,      0.0,     -7.0,   -2768.0,     0.0,    -4.0],
  // 44
  [-2, 0, 0, 2, 1,     -5774.0,    -11.0,    -15.0,    3041.0,     0.0,    -5.0],
  // 45
  [ 2, 0, 2, 0, 1,     -5350.0,      0.0,     21.0,    2695.0,     0.0,    12.0],
  // 46
  [ 0,-1, 2,-2, 1,     -4752.0,    -11.0,     -3.0,    2719.0,     0.0,    -3.0],
  // 47
  [ 0, 0, 0,-2, 1,     -4940.0,    -11.0,    -21.0,    2720.0,     0.0,    -9.0],
  // 48
  [-1,-1, 0, 2, 0,      7350.0,      0.0,     -8.0,     -51.0,     0.0,     4.0],
  // 49
  [ 2, 0, 0,-2, 1,      4065.0,      0.0,      6.0,   -2206.0,     0.0,     1.0],
  // 50
  [ 1, 0, 0, 2, 0,      6579.0,      0.0,    -24.0,    -199.0,     0.0,     2.0],
  // 51
  [ 0, 1, 2,-2, 1,      3579.0,      0.0,      5.0,   -1900.0,     0.0,     1.0],
  // 52
  [ 1,-1, 0, 0, 0,      4725.0,      0.0,     -6.0,     -41.0,     0.0,     3.0],
  // 53
  [-2, 0, 2, 0, 2,     -3075.0,      0.0,     -2.0,    1313.0,     0.0,    -1.0],
  // 54
  [ 3, 0, 2, 0, 2,     -2904.0,      0.0,     15.0,    1233.0,     0.0,     7.0],
  // 55
  [ 0,-1, 0, 2, 0,      4348.0,      0.0,    -10.0,     -81.0,     0.0,     2.0],
  // 56
  [ 1,-1, 2, 0, 2,     -2878.0,      0.0,      8.0,    1232.0,     0.0,     4.0],
  // 57
  [ 0, 0, 0, 1, 0,     -4230.0,      0.0,      5.0,     -20.0,     0.0,    -2.0],
  // 58
  [-1,-1, 2, 2, 2,     -2819.0,      0.0,      7.0,    1207.0,     0.0,     3.0],
  // 59
  [-1, 0, 2, 0, 0,     -4056.0,      0.0,      5.0,      40.0,     0.0,    -2.0],
  // 60
  [ 0,-1, 2, 2, 2,     -2647.0,      0.0,     11.0,    1129.0,     0.0,     5.0],
  // 61
  [-2, 0, 0, 0, 1,     -2294.0,      0.0,    -10.0,    1266.0,     0.0,    -4.0],
  // 62
  [ 1, 1, 2, 0, 2,      2481.0,      0.0,     -7.0,   -1062.0,     0.0,    -3.0],
  // 63
  [ 2, 0, 0, 0, 1,      2179.0,      0.0,     -2.0,   -1129.0,     0.0,    -2.0],
  // 64
  [-1, 1, 0, 1, 0,      3276.0,      0.0,      1.0,      -9.0,     0.0,     0.0],
  // 65
  [ 1, 1, 0, 0, 0,     -3389.0,      0.0,      5.0,      35.0,     0.0,    -2.0],
  // 66
  [ 1, 0, 2, 0, 0,      3339.0,      0.0,    -13.0,    -107.0,     0.0,     1.0],
  // 67
  [-1, 0, 2,-2, 1,     -1987.0,      0.0,     -6.0,    1073.0,     0.0,    -2.0],
  // 68
  [ 1, 0, 0, 0, 2,     -1981.0,      0.0,      0.0,     854.0,     0.0,     0.0],
  // 69
  [-1, 0, 0, 1, 0,      4026.0,      0.0,   -353.0,    -553.0,     0.0,  -139.0],
  // 70
  [ 0, 0, 2, 1, 2,      1660.0,      0.0,     -5.0,    -710.0,     0.0,    -2.0],
  // 71
  [-1, 0, 2, 4, 2,     -1521.0,      0.0,      9.0,     647.0,     0.0,     4.0],
  // 72
  [-1, 1, 0, 1, 1,      1464.0,      0.0,    -11.0,    -527.0,     0.0,    -1.0],
  // 73
  [ 0,-2, 2,-2, 1,     -1389.0,      0.0,      3.0,     656.0,     0.0,     1.0],
  // 74
  [ 1,-1, 2, 2, 2,     -1377.0,      0.0,      8.0,     594.0,     0.0,     4.0],
  // 75
  [ 3, 0, 2,-2, 2,      1371.0,      0.0,     -2.0,    -588.0,     0.0,    -1.0],
  // 76
  [ 0, 0, 4,-2, 4,      1341.0,      0.0,      0.0,    -577.0,     0.0,     0.0],
  // 77
  [ 0, 0, 2,-2, 4,     -1316.0,      0.0,      0.0,     567.0,     0.0,     0.0],
]

// ─── Fundamental arguments (Delaunay) ────────────────────────────────────────
// Source: SOFA iauFal03, iauFalp03, iauFaf03, iauFad03, iauFaom03
// T = Julian centuries from J2000.0 (TT)

/** Reduce arcseconds to [0, 2π) radians */
function arcsecToRad(arcsec: number): number {
  const r = (arcsec * ARCSEC_RAD) % (2 * Math.PI)
  return r >= 0 ? r : r + 2 * Math.PI
}

/** Mean anomaly of the Moon l (IAU 2003) */
function fundamentalL(T: number): number {
  return arcsecToRad(
    485868.249036 + T * (1717915923.2178 + T * (31.8792 + T * (0.051635 + T * (-0.00024470))))
  )
}

/** Mean anomaly of the Sun l' (IAU 2003) */
function fundamentalLp(T: number): number {
  return arcsecToRad(
    1287104.793048 + T * (129596581.0481 + T * (-0.5532 + T * (0.000136 + T * (-0.00001149))))
  )
}

/** Moon's argument of latitude F = L - Ω (IAU 2003) */
function fundamentalF(T: number): number {
  return arcsecToRad(
    335779.526232 + T * (1739527262.8478 + T * (-12.7512 + T * (-0.001037 + T * 0.00000417)))
  )
}

/** Mean elongation of the Moon D (IAU 2003) */
function fundamentalD(T: number): number {
  return arcsecToRad(
    1072260.703692 + T * (1602961601.2090 + T * (-6.3706 + T * (0.006593 + T * (-0.00003169))))
  )
}

/** Longitude of Moon's ascending node Ω (IAU 2003) */
function fundamentalOm(T: number): number {
  return arcsecToRad(
    450160.398036 + T * (-6962890.5431 + T * (7.4722 + T * (0.007702 + T * (-0.00005939))))
  )
}

// ─── CIP coordinates ─────────────────────────────────────────────────────────

/**
 * Compute CIP X, Y and CIO locator s using IAU 2006 precession + IAU 2000B nutation.
 *
 * Method:
 *   1. Compute dpsi, deps from the 77-term IAU 2000B luni-solar nutation series.
 *   2. Add to IAU 2006 precession polynomials for X and Y (IERS Conventions 2010 Eq. 5.16).
 *   3. Compute s ≈ -X·Y/2 + polynomial term.
 *
 * Accuracy: < 1 mas over ±50 years from J2000 — well within the 30" library target.
 *
 * Implements the IAU 2000B standard (77-term series, truncated from IAU 2000A's 1306 terms).
 * Accuracy: ~1 mas in X and Y, sufficient for all practical crescent visibility work.
 *
 * @param jdTT - Julian Date in TT
 * @returns { X, Y, s } in radians
 */
export function computeCIPXYs(
  jdTT: number,
): { X: number; Y: number; s: number } {

  const T = (jdTT - J2000) / DAYS_PER_JULIAN_CENTURY

  // Delaunay fundamental arguments
  const l  = fundamentalL(T)
  const lp = fundamentalLp(T)
  const F  = fundamentalF(T)
  const D  = fundamentalD(T)
  const Om = fundamentalOm(T)

  // Accumulate nutation in longitude (dpsi) and obliquity (deps) — units: 0.1 uas
  let dpsi = 0.0
  let deps = 0.0
  for (const [nl, nlp, nF, nD, nOm, ps, pst, pc, ec, ect, es] of NUT_2000B) {
    const arg = nl*l + nlp*lp + nF*F + nD*D + nOm*Om
    const sinA = Math.sin(arg)
    const cosA = Math.cos(arg)
    dpsi += (ps + pst * T) * sinA + pc * cosA
    deps += (ec + ect * T) * cosA + es * sinA
  }

  // Convert 0.1 uas → arcseconds → radians
  const dpsiRad = dpsi * UAS01_TO_ARCSEC * ARCSEC_RAD
  const depsRad = deps * UAS01_TO_ARCSEC * ARCSEC_RAD

  // Mean obliquity eps0 (IAU 2006, arcseconds → radians)
  // Reference: IERS Conventions (2010) Table 5.1
  const eps0 = (
    84381.406
    + T * (-46.836769
    + T * (-0.0001831
    + T * ( 0.00200340
    + T * (-0.000000576
    + T * (-0.0000000434)))))
  ) * ARCSEC_RAD

  // IAU 2006 precession polynomial for X (arcseconds)
  // Reference: IERS Conventions (2010) Table 5.2a, polynomial s_X
  const Xarcsec =
    -0.016617
    + T * ( 2004.191898
    + T * (   -0.4297829
    + T * (   -0.19861834
    + T * (    0.000007578
    + T *      0.0000059285))))

  // IAU 2006 precession polynomial for Y (arcseconds)
  // Reference: IERS Conventions (2010) Table 5.2a, polynomial s_Y
  const Yarcsec =
    -0.006951
    + T * (  -0.025896
    + T * ( -22.4072747
    + T * (   0.00190059
    + T * (   0.001112526
    + T *     0.0000001358))))

  // CIP X, Y: precession polynomial + first-order nutation correction
  const X = Xarcsec * ARCSEC_RAD + dpsiRad * Math.sin(eps0)
  const Y = Yarcsec * ARCSEC_RAD - depsRad

  // CIO locator s ≈ -X·Y/2 + small polynomial (IERS Conventions 2010 Eq. 5.9)
  // Polynomial term: s_poly ≈ -0.041775"·T (arcseconds)
  const sPoly = -0.041775 * T * ARCSEC_RAD
  const s = -X * Y / 2 + sPoly

  return { X, Y, s }
}

// ─── Earth Rotation Angle ────────────────────────────────────────────────────

/**
 * Compute the Earth Rotation Angle (ERA) in radians.
 *
 * ERA is the angle between the Celestial Intermediate Origin (CIO) and the
 * Terrestrial Intermediate Origin (TIO), measured in the equatorial plane.
 * It replaces GMST in the IAU 2000+ Earth rotation model.
 *
 * ERA(UT1) = 2π(0.7790572732640 + 1.00273781191135448 · Du)
 * where Du = JD(UT1) − 2451545.0
 *
 * Reference: IAU 2000 Resolution B1.8; IERS Conventions (2010) §5.4.4
 */
export function computeERA(jdUT1: number): number {
  const Du = jdUT1 - 2451545.0
  const era = 2 * Math.PI * (0.7790572732640 + 1.00273781191135448 * Du)
  return ((era % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
}

// ─── Frame rotation matrices ──────────────────────────────────────────────────

/**
 * Celestial motion matrix Q(t) from CIP X, Y, s.
 * Converts GCRS to the Celestial Intermediate Reference System (CIRS).
 *
 * Uses the exact SOFA iauC2ixys formula:
 *   Q = Rz(-(e+s)) · Ry(d) · Rz(e)
 * where e = atan2(Y, X) and d = asin(sqrt(X²+Y²)).
 *
 * Reference: SOFA iauC2ixys; IERS Conventions (2010) Eq. 5.7
 */
export function celestialMotionMatrix(X: number, Y: number, s: number): Mat3 {
  const r2 = X * X + Y * Y
  const e = r2 > 0 ? Math.atan2(Y, X) : 0
  const d = Math.asin(Math.sqrt(r2))
  return mmmul(rotZ(-(e + s)), mmmul(rotY(d), rotZ(e)))
}

/**
 * Earth rotation matrix R(t) from the ERA.
 * Simple rotation about the CIP pole (z-axis) by ERA.
 */
export function earthRotationMatrix(era: number): Mat3 {
  return rotZ(era)
}

/**
 * Polar motion matrix W(t) from CIP offsets xp, yp.
 * Small correction (< 0.5 arcsec) for the wobble of the Earth's pole.
 *
 * W = Ry(xp) · Rx(−yp)
 * (TIO locator sp is omitted — < 0.001" effect over one year)
 *
 * For moon sighting purposes, default xp = yp = 0 introduces < 30m error
 * in the observer position — negligible compared to refraction uncertainty.
 *
 * @param xp - Pole x-offset in radians (from IERS Bulletin A)
 * @param yp - Pole y-offset in radians (from IERS Bulletin A)
 */
export function polarMotionMatrix(xp: number, yp: number): Mat3 {
  return mmmul(rotY(xp), rotX(-yp))
}

// ─── Full transformation ──────────────────────────────────────────────────────

/**
 * Transform a vector from GCRS (inertial) to ITRS (Earth-fixed).
 *
 * Full chain: [ITRS] = W · R · Q · [GCRS]
 *
 * @param gcrsVec - 3-vector in GCRS frame (km)
 * @param ts - Time scales for the epoch
 * @param xp - Polar motion x (radians, default 0)
 * @param yp - Polar motion y (radians, default 0)
 * @returns Vector in ITRS frame (km)
 */
export function gcrsToItrs(
  gcrsVec: Vec3,
  ts: TimeScales,
  xp = 0,
  yp = 0,
): Vec3 {
  const { X, Y, s } = computeCIPXYs(ts.jdTT)
  const Q = celestialMotionMatrix(X, Y, s)
  const era = computeERA(ts.jdUT1)
  const R = earthRotationMatrix(era)
  const W = polarMotionMatrix(xp, yp)
  // Apply Q first (GCRS→CIRS), then R (CIRS→TIRS), then W (TIRS→ITRS)
  const combined = mmmul(W, mmmul(R, Q))
  return mvmul(combined, gcrsVec)
}

/**
 * Transform a vector from ITRS (Earth-fixed) to GCRS (inertial).
 * Inverse of gcrsToItrs — the combined rotation matrix is orthogonal, so its
 * inverse equals its transpose.
 *
 * @param itrsVec - 3-vector in ITRS frame (km)
 * @param ts - Time scales for the epoch
 * @param xp - Polar motion x (radians, default 0)
 * @param yp - Polar motion y (radians, default 0)
 * @returns Vector in GCRS frame (km)
 */
export function itrsToGcrs(
  itrsVec: Vec3,
  ts: TimeScales,
  xp = 0,
  yp = 0,
): Vec3 {
  const { X, Y, s } = computeCIPXYs(ts.jdTT)
  const Q = celestialMotionMatrix(X, Y, s)
  const era = computeERA(ts.jdUT1)
  const R = earthRotationMatrix(era)
  const W = polarMotionMatrix(xp, yp)
  // [GCRS] = Qᵀ · Rᵀ · Wᵀ · [ITRS]
  const combined = mmmul(mtranspose(Q), mmmul(mtranspose(R), mtranspose(W)))
  return mvmul(combined, itrsVec)
}
