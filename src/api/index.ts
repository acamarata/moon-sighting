/**
 * api — User-facing functions and kernel management.
 *
 * This is the only module users need to import directly.
 * Everything else in src/ is internal plumbing.
 *
 * Two operating modes:
 *
 * 1. Lite mode (no kernel): getMoonPhase() works without DE442S.
 *    Uses approximate Meeus algorithms. Accurate to ~1° for phase purposes.
 *    Not suitable for crescent sighting reports.
 *
 * 2. Full mode (kernel loaded): getMoonSightingReport() and getSunMoonEvents()
 *    require DE442S. Call initKernels() (or downloadKernels()) first.
 */

import type {
  Observer,
  SightingOptions,
  MoonSightingReport,
  MoonPhaseResult,
  MoonPhaseName,
  SunMoonEvents,
  KernelConfig,
  Vec3,
} from '../types.js'
import { SpkKernel } from '../spk/index.js'
import {
  computeTimeScales,
  jdTTtoET,
  J2000,
} from '../time/index.js'
import {
  getMoonGeocentricState,
  getSunGeocentricState,
  computeIllumination,
  computeCrescentWidth,
  getMoonSunApproximate,
  nearestNewMoon,
} from '../bodies/index.js'
import {
  geodeticToECEF,
  computeAzAlt,
} from '../observer/index.js'
import { itrsToGcrs } from '../frames/index.js'
import {
  getSunMoonEvents as eventsGetSunMoonEvents,
  bestTimeHeuristic,
  bestTimeOptimized,
  computeObservationWindow,
} from '../events/index.js'
import {
  computeCrescentGeometry,
  computeYallop,
  computeOdeh,
  buildGuidanceText,
} from '../visibility/index.js'

// ─── Module-level kernel singleton ─────────────────────────────────────────────

let activeKernel: SpkKernel | null = null

// ─── Cache directory resolution ────────────────────────────────────────────────

/**
 * Resolve the platform-appropriate kernel cache directory.
 */
function resolveCacheDir(override?: string): string {
  if (override) return override
  const { platform, env } = process
  if (platform === 'win32') {
    return `${env['LOCALAPPDATA'] ?? env['APPDATA'] ?? 'C:\\Users\\Public\\AppData\\Local'}\\moon-sighting`
  }
  return `${env['HOME'] ?? '/tmp'}/.cache/moon-sighting`
}

// ─── Download sources ─────────────────────────────────────────────────────────

const NAIF_DE442S_URL = 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp'
const NAIF_LSK_URL    = 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls'

// ─── Kernel lifecycle ─────────────────────────────────────────────────────────

/**
 * Initialize the kernel engine from an already-downloaded kernel.
 * Must be called before getMoonSightingReport() or getSunMoonEvents().
 *
 * Supports three source modes:
 *   - File path (Node.js): initKernels({ planetary: { type: 'file', path: '/path/to/de442s.bsp' } })
 *   - ArrayBuffer (browser): initKernels({ planetary: { type: 'buffer', data: buf, name: 'de442s.bsp' } })
 *   - Auto (Node.js): initKernels() — downloads and caches automatically
 *
 * @param config - Kernel source configuration. Defaults to auto-download.
 */
export async function initKernels(config?: KernelConfig): Promise<void> {
  const source = config?.planetary ?? { type: 'auto' as const }

  let buffer: ArrayBuffer

  if (source.type === 'file') {
    buffer = await readFileAsBuffer(source.path)
  } else if (source.type === 'buffer') {
    buffer = source.data
  } else if (source.type === 'url') {
    const res = await fetch(source.url)
    if (!res.ok) throw new Error(`Failed to fetch kernel from ${source.url}: ${res.status} ${res.statusText}`)
    buffer = await res.arrayBuffer()
  } else {
    // auto: download to local cache, then load
    const paths = await downloadKernels(config)
    buffer = await readFileAsBuffer(paths.planetaryPath)
  }

  activeKernel = SpkKernel.fromBuffer(buffer)
}

/** Read a file into an ArrayBuffer (Node.js only). */
async function readFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
  const { readFile } = await import('node:fs/promises')
  const buf = await readFile(filePath)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

/**
 * Download the DE442S planetary kernel and naif0012.tls leap-second kernel
 * to the local cache directory. Verifies the download by SHA-256 checksum
 * when a checksum is supplied via config.checksumOverride.
 *
 * @param config - Optional kernel config (to customize cache directory or checksum)
 * @returns Paths where kernels were saved
 */
export async function downloadKernels(config?: KernelConfig): Promise<{
  planetaryPath: string
  leapSecondsPath: string
}> {
  const cacheDir = resolveCacheDir(config?.cacheDir)
  const { mkdir, writeFile } = await import('node:fs/promises')
  const { existsSync } = await import('node:fs')
  const { join } = await import('node:path')

  await mkdir(cacheDir, { recursive: true })

  const planetaryPath  = join(cacheDir, 'de442s.bsp')
  const leapSecondsPath = join(cacheDir, 'naif0012.tls')

  if (!existsSync(planetaryPath)) {
    process.stdout.write('Downloading de442s.bsp from NAIF... ')
    const res = await fetch(NAIF_DE442S_URL)
    if (!res.ok) throw new Error(`Failed to download de442s.bsp: ${res.status} ${res.statusText}`)
    const buf = await res.arrayBuffer()
    await writeFile(planetaryPath, Buffer.from(buf))
    console.log(`done (${(buf.byteLength / 1048576).toFixed(1)} MB)`)

    if (config?.checksumOverride) {
      const actual = await sha256File(planetaryPath)
      if (actual !== config.checksumOverride.toLowerCase()) {
        throw new Error(
          `de442s.bsp checksum mismatch.\n  Expected: ${config.checksumOverride}\n  Got:      ${actual}`,
        )
      }
    }
  } else {
    console.log('de442s.bsp already cached.')
  }

  if (!existsSync(leapSecondsPath)) {
    process.stdout.write('Downloading naif0012.tls from NAIF... ')
    const res = await fetch(NAIF_LSK_URL)
    if (!res.ok) throw new Error(`Failed to download naif0012.tls: ${res.status} ${res.statusText}`)
    const text = await res.text()
    await writeFile(leapSecondsPath, text, 'utf8')
    console.log('done.')
  } else {
    console.log('naif0012.tls already cached.')
  }

  return { planetaryPath, leapSecondsPath }
}

/** Compute the SHA-256 hex digest of a local file. */
async function sha256File(filePath: string): Promise<string> {
  const { createHash } = await import('node:crypto')
  const { readFile } = await import('node:fs/promises')
  const buf = await readFile(filePath)
  return createHash('sha256').update(buf).digest('hex')
}

/**
 * Verify that locally cached kernels exist (and match checksums if supplied).
 *
 * @param config - Optional kernel config (to customize cache directory or checksum)
 * @returns { ok, errors[] } — ok is true when all checks pass
 */
export async function verifyKernels(config?: KernelConfig): Promise<{
  ok: boolean
  errors: string[]
}> {
  const cacheDir = resolveCacheDir(config?.cacheDir)
  const { existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const errors: string[] = []

  const planetaryPath  = join(cacheDir, 'de442s.bsp')
  const leapSecondsPath = join(cacheDir, 'naif0012.tls')

  if (!existsSync(planetaryPath)) {
    errors.push(`de442s.bsp not found at ${planetaryPath}. Run downloadKernels() first.`)
  } else if (config?.checksumOverride) {
    const actual = await sha256File(planetaryPath)
    if (actual !== config.checksumOverride.toLowerCase()) {
      errors.push(
        `de442s.bsp checksum mismatch.\n  Expected: ${config.checksumOverride}\n  Got:      ${actual}`,
      )
    }
  }

  if (!existsSync(leapSecondsPath)) {
    errors.push(`naif0012.tls not found at ${leapSecondsPath}. Run downloadKernels() first.`)
  }

  return { ok: errors.length === 0, errors }
}

// ─── Kernel resolution ─────────────────────────────────────────────────────────

/**
 * Resolve a SpkKernel from the given config or module singleton.
 * If neither is available, triggers auto-download.
 */
async function resolveKernel(config?: KernelConfig): Promise<SpkKernel> {
  if (config?.planetary) {
    const source = config.planetary
    if (source.type === 'file') {
      return SpkKernel.fromBuffer(await readFileAsBuffer(source.path))
    } else if (source.type === 'buffer') {
      return SpkKernel.fromBuffer(source.data)
    } else if (source.type === 'url') {
      const res = await fetch(source.url)
      if (!res.ok) throw new Error(`Failed to fetch kernel: ${res.status}`)
      return SpkKernel.fromBuffer(await res.arrayBuffer())
    }
  }

  if (activeKernel) return activeKernel

  // auto-init as last resort
  await initKernels(config)
  if (!activeKernel) throw new Error('Kernel failed to initialize. Call initKernels() before computing.')
  return activeKernel
}

// ─── Primary API ──────────────────────────────────────────────────────────────

/**
 * Compute a complete moon sighting report for a date and location.
 *
 * Returns all quantities needed for Islamic crescent sighting determination:
 * sunset/moonset times, best observation time, crescent geometry (ARCL, ARCV,
 * DAZ, W, Lag), Yallop category, Odeh zone, and plain-language guidance.
 *
 * Requires initKernels() to have been called first (or pass kernels in options).
 *
 * @param date - Date to check (UTC midnight or any time on that civil day)
 * @param observer - Observer location and environmental parameters
 * @param options - Optional configuration for refraction model, best-time method, etc.
 * @returns Complete MoonSightingReport
 *
 * @example
 * ```ts
 * await initKernels()
 * const report = await getMoonSightingReport(new Date('2025-03-01'), {
 *   lat: 51.5074, lon: -0.1278, elevation: 10, name: 'London'
 * })
 * console.log(report.yallop.category)  // 'A' through 'F'
 * console.log(report.guidance)         // "Best time to look: ..."
 * ```
 */
export async function getMoonSightingReport(
  date: Date,
  observer: Observer,
  options?: SightingOptions,
): Promise<MoonSightingReport> {
  const kernel = await resolveKernel(options?.kernels)

  // Event times (sunset, moonset, twilight, rise)
  const events = eventsGetSunMoonEvents(date, observer, kernel)
  const { sunsetUTC, moonsetUTC } = events

  if (!sunsetUTC || !moonsetUTC) {
    return buildNullReport(date, observer, events, 'DE442S', false)
  }

  // Best observation time
  const method = options?.bestTimeMethod ?? 'heuristic'
  let bestTimeResult: { bestTimeUTC: Date; lagMinutes: number } | null = null

  if (method === 'optimized') {
    const opt = bestTimeOptimized(sunsetUTC, moonsetUTC, kernel, observer)
    if (opt) bestTimeResult = { bestTimeUTC: opt.bestTimeUTC, lagMinutes: opt.lagMinutes }
  }
  if (!bestTimeResult) {
    bestTimeResult = bestTimeHeuristic(sunsetUTC, moonsetUTC)
  }

  if (!bestTimeResult) {
    return buildNullReport(date, observer, events, 'DE442S', false)
  }

  const { bestTimeUTC, lagMinutes } = bestTimeResult
  const bestTimeWindowUTC = computeObservationWindow(bestTimeUTC)

  // Time scales and ephemeris time at best time
  const ts = computeTimeScales(bestTimeUTC, observer.ut1utc, observer.deltaT)
  const et = jdTTtoET(ts.jdTT)

  // Body positions in GCRS (geocentric)
  const moonGCRS = getMoonGeocentricState(kernel, et).position
  const sunGCRS  = getSunGeocentricState(kernel, et).position

  // Observer ITRS position (km) from geodetic coordinates
  const obsECEF = geodeticToECEF(observer.lat, observer.lon, observer.elevation)
  const obsITRS: Vec3 = [obsECEF[0] / 1000, obsECEF[1] / 1000, obsECEF[2] / 1000]

  // Convert to GCRS (inertial frame) — required for correct topocentric subtraction
  // GCRS body vectors (from SPK) and observer must be in the same frame before subtracting
  const obsGCRS = itrsToGcrs(obsITRS, ts)

  // Airless alt/az — required by Yallop/Odeh criteria
  const moonAirless = computeAzAlt(moonGCRS, observer, ts, true)
  const sunAirless  = computeAzAlt(sunGCRS,  observer, ts, true)
  // Apparent alt/az (with refraction) — for guidance text
  const moonApparent = computeAzAlt(moonGCRS, observer, ts, false)

  // Illumination and moon age
  const illumData = computeIllumination(moonGCRS, sunGCRS)
  const illumination = illumData.illumination * 100
  const prevNewMoonJD = nearestNewMoon(ts.jdTT - 15)
  const moonAgeHours = (ts.jdTT - prevNewMoonJD) * 24

  // Topocentric vectors for crescent geometry (GCRS - observer GCRS)
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

  const geometry = computeCrescentGeometry(
    moonAirless,
    sunAirless,
    moonTopo,
    sunTopo,
    sunsetUTC,
    moonsetUTC,
  )

  const { Wprime } = computeCrescentWidth(moonTopo, geometry.ARCL)
  const yallop = computeYallop(geometry, Wprime)
  const odeh   = computeOdeh(geometry)

  const moonAboveHorizon = moonAirless.altitude > 0
  const sightingPossible = moonAboveHorizon && lagMinutes > 0

  const guidance = buildGuidanceText(
    yallop,
    odeh,
    moonApparent.azimuth,
    moonApparent.altitude,
    bestTimeUTC,
    lagMinutes,
  )

  return {
    date,
    observer,
    sunsetUTC,
    moonsetUTC,
    lagMinutes,
    bestTimeUTC,
    bestTimeWindowUTC,
    moonPosition: moonApparent,
    sunPosition: sunAirless,
    illumination,
    moonAge: moonAgeHours,
    geometry,
    yallop,
    odeh,
    guidance,
    ephemerisSource: 'DE442S',
    moonAboveHorizon,
    sightingPossible,
  }
}

/** Build a null report for cases where sighting geometry cannot be computed. */
function buildNullReport(
  date: Date,
  observer: Observer,
  events: SunMoonEvents,
  source: 'DE442S' | 'approximate',
  sightingPossible: boolean,
): MoonSightingReport {
  return {
    date,
    observer,
    sunsetUTC:  events.sunsetUTC,
    moonsetUTC: events.moonsetUTC,
    lagMinutes: null,
    bestTimeUTC: null,
    bestTimeWindowUTC: null,
    moonPosition: null,
    sunPosition: null,
    illumination: null,
    moonAge: null,
    geometry: null,
    yallop: null,
    odeh: null,
    guidance: 'Sighting not possible: sunset or moonset could not be determined for this date and location.',
    ephemerisSource: source,
    moonAboveHorizon: null,
    sightingPossible,
  }
}

/**
 * Compute the Moon's current phase, illumination, and next phase times.
 *
 * Works WITHOUT a kernel (uses Meeus approximation).
 *
 * @param date - Date to compute phase for (default: now)
 * @returns MoonPhaseResult with illumination, phase name, age, and next events
 *
 * @example
 * ```ts
 * const phase = getMoonPhase(new Date())
 * console.log(phase.phase)          // 'waxing-crescent'
 * console.log(phase.illumination)   // 14.3 (percent)
 * console.log(phase.nextFullMoon)   // Date object
 * ```
 */
export function getMoonPhase(date = new Date()): MoonPhaseResult {
  const ts = computeTimeScales(date)
  const { moonGCRS, sunGCRS } = getMoonSunApproximate(ts.jdTT)

  const { illumination, elongationDeg, isWaxing } = computeIllumination(moonGCRS, sunGCRS)
  const illuminationPct = illumination * 100

  // Age in hours since previous new moon
  // Search 15 days back/forward to ensure we clear the current lunation boundary
  const prevNewMoonJD = nearestNewMoon(ts.jdTT - 15)
  const age = (ts.jdTT - prevNewMoonJD) * 24

  const phaseName = elongationToPhase(elongationDeg, isWaxing)

  const nextNewMoonJD  = nearestNewMoon(ts.jdTT + 15)
  const nextFullMoonJD = nearestFullMoon(ts.jdTT)

  return {
    phase: phaseName,
    illumination: illuminationPct,
    age,
    elongationDeg,
    isWaxing,
    nextNewMoon:  jdToJSDate(nextNewMoonJD),
    nextFullMoon: jdToJSDate(nextFullMoonJD),
    prevNewMoon:  jdToJSDate(prevNewMoonJD),
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Convert JD to a UTC Date. */
function jdToJSDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000)
}

/**
 * Approximate the nearest full moon JD using Meeus Ch. 49 (full moon k = n + 0.5).
 * Full moon corrections differ from new moon; these are from Meeus Table 49.A.
 */
function nearestFullMoon(jdTT: number): number {
  const Y = 2000 + (jdTT - J2000) / 365.25
  const kBase = Math.round((Y - 2000.0) * 12.3685)
  // Check the full moons on either side of the nearest new moon (k ± 0.5)
  const k1 = kBase - 0.5
  const k2 = kBase + 0.5
  const jde1 = fullMoonJDE(k1)
  const jde2 = fullMoonJDE(k2)
  const d1 = Math.abs(jde1 - jdTT)
  const d2 = Math.abs(jde2 - jdTT)
  return d1 < d2 ? jde1 : jde2
}

/** Full moon JDE for a half-integer k (Meeus Ch. 49, Table 49.A). */
function fullMoonJDE(k: number): number {
  const T = k / 1236.85
  const DEG = Math.PI / 180

  let JDE = 2451550.09766
    + 29.530588861 * k
    + 0.00015437 * T * T
    - 0.000000150 * T * T * T
    + 0.00000000073 * T * T * T * T

  const M  = (2.5534 + 29.10535670 * k - 0.0000014 * T * T) * DEG
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T) * DEG
  const Fc = (160.7108 + 390.67050284 * k - 0.0016118 * T * T) * DEG
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * DEG
  const E  = 1 - 0.002516 * T - 0.0000074 * T * T

  JDE +=
    -0.40614 * Math.sin(Mp)
    + 0.17302 * E * Math.sin(M)
    + 0.01614 * Math.sin(2 * Mp)
    + 0.01043 * Math.sin(2 * Fc)
    + 0.00734 * E * Math.sin(Mp - M)
    - 0.00515 * E * Math.sin(Mp + M)
    + 0.00209 * E * E * Math.sin(2 * M)
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

/**
 * Map elongation and waxing direction to a named phase.
 * Boundaries: new (<5°), crescent (5-85°), quarter (85-95°), gibbous (95-175°), full (>175°).
 */
function elongationToPhase(elongationDeg: number, isWaxing: boolean): MoonPhaseName {
  const e = elongationDeg
  if (e < 5)   return 'new-moon'
  if (e > 175) return 'full-moon'
  if (e < 85)  return isWaxing ? 'waxing-crescent' : 'waning-crescent'
  if (e < 95)  return isWaxing ? 'first-quarter'   : 'last-quarter'
  return isWaxing ? 'waxing-gibbous' : 'waning-gibbous'
}

/**
 * Get rise, set, and twilight times for the Sun and Moon on a given date.
 *
 * Requires initKernels() for accurate results.
 *
 * @param date - Date to compute events for
 * @param observer - Observer location
 * @param options - Optional kernel configuration
 * @returns SunMoonEvents with all times in UTC
 */
export async function getSunMoonEvents(
  date: Date,
  observer: Observer,
  options?: Pick<SightingOptions, 'kernels'>,
): Promise<SunMoonEvents> {
  const kernel = await resolveKernel(options?.kernels)
  return eventsGetSunMoonEvents(date, observer, kernel)
}
