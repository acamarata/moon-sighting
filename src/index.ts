/**
 * moon-sighting — High-accuracy lunar crescent visibility and moon sighting calculations.
 *
 * Uses JPL DE442S ephemerides with full IERS Earth orientation for precise
 * topocentric Sun/Moon positions. Implements the Yallop (NAO TN 69) and
 * Odeh (Experimental Astronomy 2006) crescent visibility criteria.
 *
 * Quick start:
 *   import { getMoonSightingReport } from 'moon-sighting'
 *
 *   const report = await getMoonSightingReport(new Date('2025-03-01'), {
 *     lat: 51.5, lon: -0.1, elevation: 20, name: 'London'
 *   })
 *   console.log(report.yallop.category, report.guidance)
 */

// ─── Primary API ──────────────────────────────────────────────────────────────

export {
  getMoonSightingReport,
  getMoonPhase,
  getMoonPosition,
  getMoonIllumination,
  getMoonVisibilityEstimate,
  getMoon,
  getSunMoonEvents,
  initKernels,
  downloadKernels,
  verifyKernels,
} from './api/index.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export type {
  // Observer
  Observer,
  // Results
  MoonSightingReport,
  MoonPhaseResult,
  MoonPhaseName,
  MoonPosition,
  MoonIlluminationResult,
  MoonVisibilityEstimate,
  MoonSnapshot,
  SunMoonEvents,
  CrescentGeometry,
  YallopResult,
  YallopCategory,
  OdehResult,
  OdehZone,
  // Configuration
  KernelConfig,
  KernelSource,
  SightingOptions,
  // Time
  TimeScales,
  // Geometry primitives
  AzAlt,
  Vec3,
  StateVector,
  // Ephemeris internals (for advanced use)
  SpkSegment,
  ChebRecord,
} from './types.js'

// ─── Constants ────────────────────────────────────────────────────────────────

export {
  YALLOP_THRESHOLDS,
  YALLOP_DESCRIPTIONS,
  ODEH_THRESHOLDS,
  ODEH_DESCRIPTIONS,
  WGS84,
} from './types.js'
