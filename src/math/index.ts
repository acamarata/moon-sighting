/**
 * math — Core numerical utilities.
 *
 * All computation in this module is pure (no I/O, no state).
 * Uses Float64Array for coefficient storage to match JS engine optimization paths.
 */

import type { Vec3 } from '../types.js'

// ─── Vector operations ────────────────────────────────────────────────────────

/** Add two 3-vectors */
export function vadd(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

/** Subtract b from a */
export function vsub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

/** Scale a 3-vector */
export function vscale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s]
}

/** Dot product */
export function vdot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/** Euclidean norm */
export function vnorm(a: Vec3): number {
  return Math.sqrt(vdot(a, a))
}

/** Cross product */
export function vcross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

/** Unit vector (normalized) */
export function vunit(a: Vec3): Vec3 {
  const n = vnorm(a)
  if (n === 0) throw new RangeError('Cannot normalize a zero vector')
  return vscale(a, 1 / n)
}

/** Angular separation between two direction vectors in radians */
export function angularSep(a: Vec3, b: Vec3): number {
  const cosAngle = Math.max(-1, Math.min(1, vdot(vunit(a), vunit(b))))
  return Math.acos(cosAngle)
}

// ─── 3×3 matrix operations ────────────────────────────────────────────────────

/** 3×3 matrix stored row-major as a 9-element tuple */
export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
]

/** Multiply 3×3 matrix by 3-vector */
export function mvmul(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}

/** Multiply two 3×3 matrices */
export function mmmul(a: Mat3, b: Mat3): Mat3 {
  return [
    a[0]*b[0] + a[1]*b[3] + a[2]*b[6],
    a[0]*b[1] + a[1]*b[4] + a[2]*b[7],
    a[0]*b[2] + a[1]*b[5] + a[2]*b[8],
    a[3]*b[0] + a[4]*b[3] + a[5]*b[6],
    a[3]*b[1] + a[4]*b[4] + a[5]*b[7],
    a[3]*b[2] + a[4]*b[5] + a[5]*b[8],
    a[6]*b[0] + a[7]*b[3] + a[8]*b[6],
    a[6]*b[1] + a[7]*b[4] + a[8]*b[7],
    a[6]*b[2] + a[7]*b[5] + a[8]*b[8],
  ]
}

/** Transpose a 3×3 matrix */
export function mtranspose(m: Mat3): Mat3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]
}

/**
 * Rotation matrix around the X axis by angle θ (radians).
 * Follows right-hand rule.
 */
export function rotX(theta: number): Mat3 {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return [1, 0, 0, 0, c, s, 0, -s, c]
}

/**
 * Rotation matrix around the Y axis by angle θ (radians).
 */
export function rotY(theta: number): Mat3 {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return [c, 0, -s, 0, 1, 0, s, 0, c]
}

/**
 * Rotation matrix around the Z axis by angle θ (radians).
 */
export function rotZ(theta: number): Mat3 {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return [c, s, 0, -s, c, 0, 0, 0, 1]
}

// ─── Chebyshev polynomial evaluation ─────────────────────────────────────────

/**
 * Evaluate a Chebyshev polynomial at a normalized point x ∈ [-1, 1]
 * using the Clenshaw recurrence algorithm.
 *
 * The Clenshaw algorithm is numerically superior to Horner's method for
 * Chebyshev series and is the standard approach in SPICE's SPKE02.
 *
 * @param coeffs - Chebyshev coefficients c[0..n] (degree n polynomial)
 * @param x - Evaluation point, must be in [-1, 1]
 * @returns Polynomial value at x
 */
export function chebyshevEval(coeffs: Float64Array, x: number): number {
  const n = coeffs.length
  if (n === 0) return 0
  if (n === 1) return coeffs[0]

  // Double-x for Clenshaw efficiency
  const x2 = 2 * x
  let b2 = 0
  let b1 = 0

  for (let k = n - 1; k >= 1; k--) {
    const b0 = coeffs[k] + x2 * b1 - b2
    b2 = b1
    b1 = b0
  }

  return coeffs[0] + x * b1 - b2
}

/**
 * Evaluate a Chebyshev polynomial and its derivative simultaneously.
 * Uses the extended Clenshaw recurrence (more efficient than two separate evaluations).
 *
 * @returns [value, derivative] where derivative is with respect to the original time variable
 * @param coeffs - Chebyshev coefficients
 * @param x - Evaluation point in [-1, 1]
 * @param radius - Half-interval width in seconds (for scaling derivative to original time)
 */
export function chebyshevEvalWithDerivative(
  coeffs: Float64Array,
  x: number,
  radius: number,
): [number, number] {
  const n = coeffs.length
  if (n === 0) return [0, 0]
  if (n === 1) return [coeffs[0], 0]

  const x2 = 2 * x
  let b2 = 0; let b1 = 0
  let db2 = 0; let db1 = 0

  for (let k = n - 1; k >= 1; k--) {
    const b0 = coeffs[k] + x2 * b1 - b2
    const db0 = 2 * b1 + x2 * db1 - db2
    b2 = b1; b1 = b0
    db2 = db1; db1 = db0
  }

  const value = coeffs[0] + x * b1 - b2
  const dvalue = b1 + x * db1 - db2
  // Scale derivative from normalized domain back to seconds
  return [value, dvalue / radius]
}

// ─── Root finding ─────────────────────────────────────────────────────────────

/**
 * Find a root of f(t) in [a, b] using Brent's method.
 * Requires f(a) and f(b) to have opposite signs.
 *
 * Brent's method combines bisection, secant, and inverse quadratic interpolation
 * for guaranteed convergence with superlinear speed in practice.
 *
 * @param f - Function to find root of
 * @param a - Left bracket
 * @param b - Right bracket
 * @param tol - Tolerance (default 1e-9 seconds for astronomical work)
 * @param maxIter - Maximum iterations (default 64)
 * @returns Root location, or null if bracket does not contain a sign change
 */
export function brentRoot(
  f: (t: number) => number,
  a: number,
  b: number,
  tol = 1e-9,
  maxIter = 64,
): number | null {
  let fa = f(a)
  let fb = f(b)

  // No sign change in bracket
  if (fa * fb > 0) return null

  // Swap so |f(b)| <= |f(a)|
  if (Math.abs(fa) < Math.abs(fb)) {
    ;[a, b] = [b, a]
    ;[fa, fb] = [fb, fa]
  }

  let c = a
  let fc = fa
  let mflag = true
  let s = 0
  let d = 0

  for (let i = 0; i < maxIter; i++) {
    if (Math.abs(b - a) < tol) return b

    if (fa !== fc && fb !== fc) {
      // Inverse quadratic interpolation
      s =
        (a * fb * fc) / ((fa - fb) * (fa - fc)) +
        (b * fa * fc) / ((fb - fa) * (fb - fc)) +
        (c * fa * fb) / ((fc - fa) * (fc - fb))
    } else {
      // Secant method
      s = b - fb * ((b - a) / (fb - fa))
    }

    const cond1 = s < (3 * a + b) / 4 || s > b
    const cond2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2
    const cond3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2
    const cond4 = mflag && Math.abs(b - c) < tol
    const cond5 = !mflag && Math.abs(c - d) < tol

    if (cond1 || cond2 || cond3 || cond4 || cond5) {
      s = (a + b) / 2
      mflag = true
    } else {
      mflag = false
    }

    const fs = f(s)
    d = c
    c = b
    fc = fb

    if (fa * fs < 0) {
      b = s
      fb = fs
    } else {
      a = s
      fa = fs
    }

    if (Math.abs(fa) < Math.abs(fb)) {
      ;[a, b] = [b, a]
      ;[fa, fb] = [fb, fa]
    }
  }

  return b
}

/**
 * Find all roots of f(t) in [a, b] by adaptive subdivision then Brent.
 * Used for finding rise/set events where multiple crossings may occur in a day.
 *
 * @param f - Function to find roots of
 * @param a - Start of search interval
 * @param b - End of search interval
 * @param steps - Number of initial subdivision steps (default 48 for 30-min resolution over a day)
 * @returns Array of root locations
 */
export function findRoots(
  f: (t: number) => number,
  a: number,
  b: number,
  steps = 48,
): number[] {
  const dt = (b - a) / steps
  const roots: number[] = []
  let tPrev = a
  let fPrev = f(a)

  for (let i = 1; i <= steps; i++) {
    const t = a + i * dt
    const ft = f(t)

    if (fPrev * ft <= 0) {
      // Sign change in [tPrev, t] — apply Brent's method
      const root = brentRoot(f, tPrev, t, 1e-9, 64)
      if (root !== null) {
        // Deduplicate roots that are too close together
        if (roots.length === 0 || Math.abs(root - roots[roots.length - 1]) > 1e-6) {
          roots.push(root)
        }
      }
    }

    tPrev = t
    fPrev = ft
  }

  return roots
}

// ─── Angle utilities ─────────────────────────────────────────────────────────

/** Convert degrees to radians */
export const DEG2RAD = Math.PI / 180

/** Convert radians to degrees */
export const RAD2DEG = 180 / Math.PI

/** Normalize an angle to [0, 2π) */
export function mod2pi(angle: number): number {
  const twoPi = 2 * Math.PI
  return ((angle % twoPi) + twoPi) % twoPi
}

/** Normalize an angle in degrees to [0, 360) */
export function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** Normalize an angle in degrees to [-180, 180) */
export function normalizeDeg180(deg: number): number {
  deg = mod360(deg)
  return deg >= 180 ? deg - 360 : deg
}
