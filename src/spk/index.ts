/**
 * spk — DAF/SPK kernel reader and Chebyshev segment evaluator.
 *
 * JPL planetary ephemerides are distributed as SPK (Spacecraft and Planet Kernel)
 * files using the DAF (Double Precision Array File) binary format. DE442S uses
 * SPK data type 2 (Chebyshev position-only) for all planetary segments.
 *
 * DAF structure:
 *   - File record (1024 bytes): magic bytes 'DAF/SPK', encoding, summary params
 *   - Summary records: each 1024 bytes, linked list, describe each segment
 *   - Data records: Chebyshev coefficient arrays for each segment
 *
 * SPK Type 2 record layout (one record per time interval):
 *   [0]        = MID  (midpoint of interval, ET seconds past J2000)
 *   [1]        = RADIUS (half-width of interval, seconds)
 *   [2..n+1]   = Chebyshev coefficients for X
 *   [n+2..2n+1] = Chebyshev coefficients for Y
 *   [2n+2..3n+1] = Chebyshev coefficients for Z
 *   where n = polynomial degree (RSIZE = 3n + 2)
 *
 * References:
 *   NAIF SPK Required Reading (spk.req)
 *   NAIF DAF Required Reading (daf.req)
 *   SPICE source: SPKE02.f, DAFRA.f
 */

import type { SpkSegment, StateVector } from '../types.js'
import { chebyshevEvalWithDerivative } from '../math/index.js'

// ─── NAIF body IDs ────────────────────────────────────────────────────────────

/** NAIF integer body IDs used in DE442S segment chaining */
export const NAIF_IDS = {
  SSB: 0,              // Solar System Barycenter
  MERCURY_BARYCENTER: 1,
  VENUS_BARYCENTER: 2,
  EMB: 3,              // Earth-Moon Barycenter
  MARS_BARYCENTER: 4,
  JUPITER_BARYCENTER: 5,
  SATURN_BARYCENTER: 6,
  URANUS_BARYCENTER: 7,
  NEPTUNE_BARYCENTER: 8,
  PLUTO_BARYCENTER: 9,
  SUN: 10,
  MOON: 301,
  EARTH: 399,
} as const

/** Frame code for ICRF/J2000 (the inertial reference frame used by DE442S) */
export const FRAME_J2000 = 1

/** DAF record size in bytes */
const DAF_RECORD_SIZE = 1024
const BYTES_PER_DOUBLE = 8

// ─── SPK Kernel ───────────────────────────────────────────────────────────────

/**
 * A loaded SPK kernel with segment index.
 */
export class SpkKernel {
  private readonly buffer: ArrayBuffer
  private readonly segments: SpkSegment[]
  private readonly index: Map<string, SpkSegment[]>
  private readonly le: boolean

  private constructor(buffer: ArrayBuffer, segments: SpkSegment[], le: boolean) {
    this.buffer = buffer
    this.segments = segments
    this.le = le
    this.index = new Map()

    for (const seg of segments) {
      const key = `${seg.target}:${seg.center}`
      const list = this.index.get(key) ?? []
      list.push(seg)
      this.index.set(key, list)
    }
  }

  /** Load a kernel from a binary ArrayBuffer. */
  static fromBuffer(buffer: ArrayBuffer): SpkKernel {
    const { nd, ni, fward, le } = parseDafFileRecord(buffer)
    const segments = parseSummaryRecords(buffer, fward, nd, ni, le)
    return new SpkKernel(buffer, segments, le)
  }

  /** Load a kernel from a file path (Node.js only). */
  static fromFile(path: string): SpkKernel {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    const buf = fs.readFileSync(path)
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    return SpkKernel.fromBuffer(ab as ArrayBuffer)
  }

  /**
   * Compute the state vector (position + velocity) for a body relative to a center.
   * Uses segment chaining when no direct segment exists.
   */
  getState(target: number, center: number, et: number): StateVector {
    const direct = this.findSeg(target, center, et)
    if (direct) return evaluateSegment(this.buffer, direct, et, this.le)
    return this.getChained(target, center, et)
  }

  private findSeg(target: number, center: number, et: number): SpkSegment | null {
    const candidates = this.index.get(`${target}:${center}`)
    if (!candidates) return null
    return candidates.find(s => et >= s.startET && et <= s.endET) ?? null
  }

  private getChained(target: number, center: number, et: number): StateVector {
    const ssb = NAIF_IDS.SSB
    const emb = NAIF_IDS.EMB

    // Moon relative to Earth: Moon-EMB minus Earth-EMB
    if (target === NAIF_IDS.MOON && center === NAIF_IDS.EARTH) {
      const s1 = this.findSeg(NAIF_IDS.MOON, emb, et)
      const s2 = this.findSeg(NAIF_IDS.EARTH, emb, et)
      if (s1 && s2) {
        return subtractSV(
          evaluateSegment(this.buffer, s1, et, this.le),
          evaluateSegment(this.buffer, s2, et, this.le),
        )
      }
    }

    // Earth relative to Moon (inverse)
    if (target === NAIF_IDS.EARTH && center === NAIF_IDS.MOON) {
      const s1 = this.findSeg(NAIF_IDS.EARTH, emb, et)
      const s2 = this.findSeg(NAIF_IDS.MOON, emb, et)
      if (s1 && s2) {
        return subtractSV(
          evaluateSegment(this.buffer, s1, et, this.le),
          evaluateSegment(this.buffer, s2, et, this.le),
        )
      }
    }

    // Sun relative to Earth
    if (target === NAIF_IDS.SUN && center === NAIF_IDS.EARTH) {
      const sSunSsb = this.findSeg(NAIF_IDS.SUN, ssb, et)
      const sEmbSsb = this.findSeg(emb, ssb, et)
      const sEarthEmb = this.findSeg(NAIF_IDS.EARTH, emb, et)
      if (sSunSsb && sEmbSsb && sEarthEmb) {
        const svSunSsb = evaluateSegment(this.buffer, sSunSsb, et, this.le)
        const svEmbSsb = evaluateSegment(this.buffer, sEmbSsb, et, this.le)
        const svEarthEmb = evaluateSegment(this.buffer, sEarthEmb, et, this.le)
        // Earth/SSB = EMB/SSB - Earth/EMB
        const earthSsb = subtractSV(svEmbSsb, svEarthEmb)
        return subtractSV(svSunSsb, earthSsb)
      }
    }

    // Generic two-hop via SSB
    const sTargetSsb = this.findSeg(target, ssb, et)
    const sCenterSsb = this.findSeg(center, ssb, et)
    if (sTargetSsb && sCenterSsb) {
      return subtractSV(
        evaluateSegment(this.buffer, sTargetSsb, et, this.le),
        evaluateSegment(this.buffer, sCenterSsb, et, this.le),
      )
    }

    throw new Error(`SpkKernel: no path for target=${target} center=${center} et=${et}`)
  }

  getSegments(): ReadonlyArray<SpkSegment> {
    return this.segments
  }
}

// ─── DAF parsing ──────────────────────────────────────────────────────────────

function parseDafFileRecord(buffer: ArrayBuffer): {
  nd: number; ni: number; fward: number; bward: number; free: number; le: boolean
} {
  const dv = new DataView(buffer)

  // Detect endianness by reading ND (should be 2 for DE442S SPK)
  let le = true
  let nd = dv.getInt32(8, true)
  if (nd < 1 || nd > 100) {
    nd = dv.getInt32(8, false)
    le = false
  }

  const ni = dv.getInt32(12, le)
  const fward = dv.getInt32(256, le)
  const bward = dv.getInt32(260, le)
  const free = dv.getInt32(264, le)

  return { nd, ni, fward, bward, free, le }
}

function parseSummaryRecords(
  buffer: ArrayBuffer,
  fward: number,
  nd: number,
  ni: number,
  le: boolean,
): SpkSegment[] {
  const dv = new DataView(buffer)
  const segments: SpkSegment[] = []
  const summaryBytes = nd * BYTES_PER_DOUBLE + ni * 4

  let recordNum = fward

  while (recordNum !== 0) {
    const recOffset = (recordNum - 1) * DAF_RECORD_SIZE

    // Control area: 3 doubles at start of record
    const nextRecord = dv.getFloat64(recOffset, le)
    const nSummaries = Math.round(dv.getFloat64(recOffset + 16, le))

    let offset = recOffset + 24  // skip 3 control doubles (24 bytes)

    for (let i = 0; i < nSummaries; i++) {
      if (offset + summaryBytes > buffer.byteLength) break

      const startET = dv.getFloat64(offset, le)
      const endET = dv.getFloat64(offset + 8, le)
      offset += nd * BYTES_PER_DOUBLE

      const target = dv.getInt32(offset, le)
      const center = dv.getInt32(offset + 4, le)
      const frame = dv.getInt32(offset + 8, le)
      const dataType = dv.getInt32(offset + 12, le) as 2 | 3
      const beginAddr = dv.getInt32(offset + 16, le)
      const endAddr = dv.getInt32(offset + 20, le)
      offset += ni * 4

      const dataOffset = (beginAddr - 1) * BYTES_PER_DOUBLE
      const dataSize = endAddr - beginAddr + 1

      segments.push({ target, center, frame, dataType, startET, endET, dataOffset, dataSize })
    }

    recordNum = Math.round(nextRecord)
  }

  return segments
}

// ─── Segment evaluation ───────────────────────────────────────────────────────

function evaluateSegment(
  buffer: ArrayBuffer,
  seg: SpkSegment,
  et: number,
  le: boolean,
): StateVector {
  if (seg.dataType === 2) return evaluateType2(buffer, seg, et, le)
  if (seg.dataType === 3) return evaluateType3(buffer, seg, et, le)
  throw new Error(`Unsupported SPK segment type: ${seg.dataType}`)
}

/**
 * Evaluate a Type 2 SPK segment at the given ET.
 */
export function evaluateType2(
  buffer: ArrayBuffer,
  seg: SpkSegment,
  et: number,
  le = true,
): StateVector {
  const dv = new DataView(buffer)
  const endOffset = seg.dataOffset + seg.dataSize * BYTES_PER_DOUBLE

  // Directory at end of data (4 doubles before the data end)
  const N = dv.getFloat64(endOffset - BYTES_PER_DOUBLE, le)
  const rsize = dv.getFloat64(endOffset - 2 * BYTES_PER_DOUBLE, le)
  const intlen = dv.getFloat64(endOffset - 3 * BYTES_PER_DOUBLE, le)
  const init = dv.getFloat64(endOffset - 4 * BYTES_PER_DOUBLE, le)

  // degree = (rsize - 2) / 3  (Type 2 stores 3 components)
  const degree = Math.round((rsize - 2) / 3)
  const nCoeffs = degree + 1

  let recIdx = Math.floor((et - init) / intlen)
  recIdx = Math.max(0, Math.min(Math.round(N) - 1, recIdx))

  const recOffset = seg.dataOffset + recIdx * rsize * BYTES_PER_DOUBLE
  const mid = dv.getFloat64(recOffset, le)
  const radius = dv.getFloat64(recOffset + BYTES_PER_DOUBLE, le)
  const x = (et - mid) / radius

  const xC = readCoeffs(dv, recOffset + 2 * BYTES_PER_DOUBLE, nCoeffs, le)
  const yC = readCoeffs(dv, recOffset + (2 + nCoeffs) * BYTES_PER_DOUBLE, nCoeffs, le)
  const zC = readCoeffs(dv, recOffset + (2 + 2 * nCoeffs) * BYTES_PER_DOUBLE, nCoeffs, le)

  const [px, vx] = chebyshevEvalWithDerivative(xC, x, radius)
  const [py, vy] = chebyshevEvalWithDerivative(yC, x, radius)
  const [pz, vz] = chebyshevEvalWithDerivative(zC, x, radius)

  return { position: [px, py, pz], velocity: [vx, vy, vz] }
}

/**
 * Evaluate a Type 3 SPK segment at the given ET.
 * Type 3 stores separate position and velocity Chebyshev fits.
 */
export function evaluateType3(
  buffer: ArrayBuffer,
  seg: SpkSegment,
  et: number,
  le = true,
): StateVector {
  const dv = new DataView(buffer)
  const endOffset = seg.dataOffset + seg.dataSize * BYTES_PER_DOUBLE

  const N = dv.getFloat64(endOffset - BYTES_PER_DOUBLE, le)
  const rsize = dv.getFloat64(endOffset - 2 * BYTES_PER_DOUBLE, le)
  const intlen = dv.getFloat64(endOffset - 3 * BYTES_PER_DOUBLE, le)
  const init = dv.getFloat64(endOffset - 4 * BYTES_PER_DOUBLE, le)

  const degree = Math.round((rsize - 2) / 6)
  const nCoeffs = degree + 1

  let recIdx = Math.floor((et - init) / intlen)
  recIdx = Math.max(0, Math.min(Math.round(N) - 1, recIdx))

  const recOffset = seg.dataOffset + recIdx * rsize * BYTES_PER_DOUBLE
  const mid = dv.getFloat64(recOffset, le)
  const radius = dv.getFloat64(recOffset + BYTES_PER_DOUBLE, le)
  const x = (et - mid) / radius

  const xPC = readCoeffs(dv, recOffset + 2 * BYTES_PER_DOUBLE, nCoeffs, le)
  const yPC = readCoeffs(dv, recOffset + (2 + nCoeffs) * BYTES_PER_DOUBLE, nCoeffs, le)
  const zPC = readCoeffs(dv, recOffset + (2 + 2 * nCoeffs) * BYTES_PER_DOUBLE, nCoeffs, le)
  const xVC = readCoeffs(dv, recOffset + (2 + 3 * nCoeffs) * BYTES_PER_DOUBLE, nCoeffs, le)
  const yVC = readCoeffs(dv, recOffset + (2 + 4 * nCoeffs) * BYTES_PER_DOUBLE, nCoeffs, le)
  const zVC = readCoeffs(dv, recOffset + (2 + 5 * nCoeffs) * BYTES_PER_DOUBLE, nCoeffs, le)

  const px = chebyshevEvalWithDerivative(xPC, x, radius)[0]
  const py = chebyshevEvalWithDerivative(yPC, x, radius)[0]
  const pz = chebyshevEvalWithDerivative(zPC, x, radius)[0]
  // Type 3: velocity polynomial evaluated at x gives km/s directly
  const vx = chebyshevEvalWithDerivative(xVC, x, radius)[0]
  const vy = chebyshevEvalWithDerivative(yVC, x, radius)[0]
  const vz = chebyshevEvalWithDerivative(zVC, x, radius)[0]

  return { position: [px, py, pz], velocity: [vx, vy, vz] }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readCoeffs(dv: DataView, offset: number, n: number, le: boolean): Float64Array {
  const arr = new Float64Array(n)
  for (let k = 0; k < n; k++) {
    arr[k] = dv.getFloat64(offset + k * BYTES_PER_DOUBLE, le)
  }
  return arr
}

function subtractSV(a: StateVector, b: StateVector): StateVector {
  return {
    position: [
      a.position[0] - b.position[0],
      a.position[1] - b.position[1],
      a.position[2] - b.position[2],
    ],
    velocity: [
      a.velocity[0] - b.velocity[0],
      a.velocity[1] - b.velocity[1],
      a.velocity[2] - b.velocity[2],
    ],
  }
}

// ─── Leap-second kernel ───────────────────────────────────────────────────────

/**
 * Parse a NAIF LSK (Leap Second Kernel) text file.
 * Extracts DELTET/DELTA_AT pairs and converts to (JD_UTC, deltaAT) pairs.
 */
export function parseLsk(text: string): ReadonlyArray<readonly [number, number]> {
  const results: [number, number][] = []

  const match = text.match(/DELTET\/DELTA_AT\s*=\s*\(\s*([\s\S]*?)\)/m)
  if (!match) return results

  const block = match[1]
  const months: Record<string, number> = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  }

  const pairRe = /(-?\d+(?:\.\d+)?)\s*,\s*@(\d{4})-([A-Z]{3})-(\d{1,2})/g
  let m: RegExpExecArray | null

  while ((m = pairRe.exec(block)) !== null) {
    const deltaAT = parseFloat(m[1])
    const year = parseInt(m[2])
    const month = months[m[3]] ?? 1
    const day = parseInt(m[4])

    // Gregorian to JD (noon = integer JD)
    const a = Math.floor((14 - month) / 12)
    const y = year + 4800 - a
    const mo = month + 12 * a - 3
    const jdNoon = day + Math.floor((153 * mo + 2) / 5) + 365 * y +
      Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
    // Midnight = JD - 0.5
    results.push([jdNoon - 0.5, deltaAT])
  }

  return results
}
