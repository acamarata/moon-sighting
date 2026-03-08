/**
 * moon-sighting ESM test suite
 * Runs with: node --test test.mjs
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  // Constants
  YALLOP_THRESHOLDS,
  YALLOP_DESCRIPTIONS,
  ODEH_THRESHOLDS,
  ODEH_DESCRIPTIONS,
  WGS84,
  // API
  getMoonPhase,
  getMoonPosition,
  getMoonIllumination,
  getMoonVisibilityEstimate,
  getMoon,
  initKernels,
  downloadKernels,
  verifyKernels,
  getMoonSightingReport,
  getSunMoonEvents,
} from './dist/index.mjs'

// ─── Constants ────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('YALLOP_THRESHOLDS.A is 0.216', () => {
    assert.equal(YALLOP_THRESHOLDS.A, 0.216)
  })
  it('YALLOP_THRESHOLDS.E is -0.293', () => {
    assert.equal(YALLOP_THRESHOLDS.E, -0.293)
  })
  it('All Yallop thresholds are defined', () => {
    for (const key of ['A', 'B', 'C', 'D', 'E']) {
      assert.ok(typeof YALLOP_THRESHOLDS[key] === 'number', `${key} should be a number`)
    }
  })
  it('Yallop thresholds descend A > B > C > D > E', () => {
    assert.ok(YALLOP_THRESHOLDS.A > YALLOP_THRESHOLDS.B)
    assert.ok(YALLOP_THRESHOLDS.B > YALLOP_THRESHOLDS.C)
    assert.ok(YALLOP_THRESHOLDS.C > YALLOP_THRESHOLDS.D)
    assert.ok(YALLOP_THRESHOLDS.D > YALLOP_THRESHOLDS.E)
  })
  it('ODEH_THRESHOLDS.A is 5.65', () => {
    assert.equal(ODEH_THRESHOLDS.A, 5.65)
  })
  it('ODEH_THRESHOLDS.C is -0.96', () => {
    assert.equal(ODEH_THRESHOLDS.C, -0.96)
  })
  it('Odeh thresholds descend A > B > C', () => {
    assert.ok(ODEH_THRESHOLDS.A > ODEH_THRESHOLDS.B)
    assert.ok(ODEH_THRESHOLDS.B > ODEH_THRESHOLDS.C)
  })
  it('WGS84.a is 6378137.0', () => {
    assert.equal(WGS84.a, 6378137.0)
  })
  it('WGS84.invF is 298.257223563', () => {
    assert.equal(WGS84.invF, 298.257223563)
  })
  it('WGS84.e2 is positive and < 1', () => {
    assert.ok(WGS84.e2 > 0 && WGS84.e2 < 1, `e2=${WGS84.e2}`)
  })
  it('WGS84.b < WGS84.a (oblate spheroid)', () => {
    assert.ok(WGS84.b < WGS84.a)
  })
  it('Yallop descriptions are non-empty strings', () => {
    for (const cat of ['A', 'B', 'C', 'D', 'E', 'F']) {
      assert.ok(typeof YALLOP_DESCRIPTIONS[cat] === 'string' && YALLOP_DESCRIPTIONS[cat].length > 0)
    }
  })
  it('Odeh descriptions are non-empty strings', () => {
    for (const zone of ['A', 'B', 'C', 'D']) {
      assert.ok(typeof ODEH_DESCRIPTIONS[zone] === 'string' && ODEH_DESCRIPTIONS[zone].length > 0)
    }
  })
})

// ─── API function exports ──────────────────────────────────────────────────────

describe('API exports', () => {
  it('getMoonPhase is a function', () => {
    assert.equal(typeof getMoonPhase, 'function')
  })
  it('initKernels is a function', () => {
    assert.equal(typeof initKernels, 'function')
  })
  it('downloadKernels is a function', () => {
    assert.equal(typeof downloadKernels, 'function')
  })
  it('verifyKernels is a function', () => {
    assert.equal(typeof verifyKernels, 'function')
  })
  it('getMoonSightingReport is a function', () => {
    assert.equal(typeof getMoonSightingReport, 'function')
  })
  it('getSunMoonEvents is a function', () => {
    assert.equal(typeof getSunMoonEvents, 'function')
  })
})

// ─── getMoonPhase (synchronous, no kernel) ─────────────────────────────────────

const VALID_PHASES = new Set([
  'new-moon', 'waxing-crescent', 'first-quarter', 'waxing-gibbous',
  'full-moon', 'waning-gibbous', 'last-quarter', 'waning-crescent',
])

const DATE_MARCH_1_2025 = new Date('2025-03-01T12:00:00Z')
const phase_march1 = getMoonPhase(DATE_MARCH_1_2025)

describe('getMoonPhase structure', () => {
  it('returns an object', () => {
    assert.ok(phase_march1 !== null && typeof phase_march1 === 'object')
  })
  it('phase is a valid phase name', () => {
    assert.ok(VALID_PHASES.has(phase_march1.phase), `got: ${phase_march1.phase}`)
  })
  it('illumination is in [0, 100]', () => {
    assert.ok(phase_march1.illumination >= 0 && phase_march1.illumination <= 100,
      `illumination=${phase_march1.illumination}`)
  })
  it('age is >= 0', () => {
    assert.ok(phase_march1.age >= 0, `age=${phase_march1.age}`)
  })
  it('elongationDeg is in [0, 180]', () => {
    assert.ok(phase_march1.elongationDeg >= 0 && phase_march1.elongationDeg <= 180,
      `elongationDeg=${phase_march1.elongationDeg}`)
  })
  it('isWaxing is a boolean', () => {
    assert.equal(typeof phase_march1.isWaxing, 'boolean')
  })
  it('nextNewMoon is a Date', () => {
    assert.ok(phase_march1.nextNewMoon instanceof Date)
  })
  it('prevNewMoon is a Date', () => {
    assert.ok(phase_march1.prevNewMoon instanceof Date)
  })
  it('nextFullMoon is a Date', () => {
    assert.ok(phase_march1.nextFullMoon instanceof Date)
  })
  it('prevNewMoon is before reference date', () => {
    assert.ok(phase_march1.prevNewMoon < DATE_MARCH_1_2025,
      `prevNewMoon=${phase_march1.prevNewMoon.toISOString()}`)
  })
  it('nextNewMoon is after prevNewMoon', () => {
    assert.ok(phase_march1.nextNewMoon > phase_march1.prevNewMoon)
  })
})

describe('getMoonPhase phase boundaries', () => {
  const DATE_FULL_MOON = new Date('2025-03-14T12:00:00Z')
  const phase_full = getMoonPhase(DATE_FULL_MOON)

  it('near full moon: illumination > 85%', () => {
    assert.ok(phase_full.illumination > 85,
      `illumination at full moon=${phase_full.illumination.toFixed(1)}%`)
  })
  it('near full moon: phase is full-moon or waxing/waning gibbous', () => {
    const valid = new Set(['full-moon', 'waxing-gibbous', 'waning-gibbous'])
    assert.ok(valid.has(phase_full.phase), `got: ${phase_full.phase}`)
  })
  it('near full moon: elongation > 120 deg', () => {
    assert.ok(phase_full.elongationDeg > 120, `elongation=${phase_full.elongationDeg}`)
  })

  const DATE_NEW_MOON = new Date('2025-03-29T12:00:00Z')
  const phase_new = getMoonPhase(DATE_NEW_MOON)

  it('near new moon: illumination < 10%', () => {
    assert.ok(phase_new.illumination < 10,
      `illumination at new moon=${phase_new.illumination.toFixed(1)}%`)
  })
  it('near new moon: elongation < 30 deg', () => {
    assert.ok(phase_new.elongationDeg < 30, `elongation=${phase_new.elongationDeg}`)
  })
})

describe('getMoonPhase consistency', () => {
  const DATE_WAXING = new Date('2025-03-05T12:00:00Z')
  const DATE_WANING = new Date('2025-03-20T12:00:00Z')

  it('5 days after new moon: isWaxing = true', () => {
    assert.equal(getMoonPhase(DATE_WAXING).isWaxing, true)
  })
  it('6 days after full moon: isWaxing = false', () => {
    assert.equal(getMoonPhase(DATE_WANING).isWaxing, false)
  })
  it('default date (now) returns valid result', () => {
    const nowPhase = getMoonPhase()
    assert.ok(VALID_PHASES.has(nowPhase.phase))
    assert.ok(nowPhase.illumination >= 0 && nowPhase.illumination <= 100)
  })
  it('synodic month duration is ~29.5 days', () => {
    const synodicMs = phase_march1.nextNewMoon.getTime() - phase_march1.prevNewMoon.getTime()
    const synodicDays = synodicMs / 86400000
    assert.ok(
      synodicDays > 29.0 && synodicDays < 30.1,
      `synodic month=${synodicDays.toFixed(2)} days`,
    )
  })
})

// ─── getMoonPosition ─────────────────────────────────────────────────────────

describe('getMoonPosition', () => {
  const moonPos_london = getMoonPosition(new Date('2025-03-14T20:00:00Z'), 51.5074, -0.1278, 10)

  it('azimuth in [0, 360)', () => {
    assert.ok(moonPos_london.azimuth >= 0 && moonPos_london.azimuth < 360,
      `azimuth=${moonPos_london.azimuth}`)
  })
  it('altitude in [-90, 90]', () => {
    assert.ok(moonPos_london.altitude >= -90 && moonPos_london.altitude <= 90,
      `altitude=${moonPos_london.altitude}`)
  })
  it('distance in lunar orbit range [356000, 407000] km', () => {
    assert.ok(moonPos_london.distance >= 356000 && moonPos_london.distance <= 407000,
      `distance=${moonPos_london.distance.toFixed(0)} km`)
  })
  it('finite parallacticAngle', () => {
    assert.ok(isFinite(moonPos_london.parallacticAngle),
      `parallacticAngle=${moonPos_london.parallacticAngle}`)
  })
  it('default date (now) returns valid result', () => {
    const pos = getMoonPosition(new Date(), 21.4225, 39.8262)
    assert.ok(pos.azimuth >= 0 && pos.azimuth < 360)
    assert.ok(pos.altitude >= -90 && pos.altitude <= 90)
    assert.ok(pos.distance > 350000 && pos.distance < 410000)
  })
})

// ─── getMoonIllumination ─────────────────────────────────────────────────────

describe('getMoonIllumination', () => {
  const illum_full = getMoonIllumination(new Date('2025-03-14T12:00:00Z'))
  const illum_new = getMoonIllumination(new Date('2025-03-29T12:00:00Z'))
  const illum_waxing = getMoonIllumination(new Date('2025-03-05T12:00:00Z'))

  it('near full moon: fraction > 0.85', () => {
    assert.ok(illum_full.fraction > 0.85, `fraction=${illum_full.fraction.toFixed(3)}`)
  })
  it('near full moon: phase close to 0.5', () => {
    assert.ok(illum_full.phase > 0.4 && illum_full.phase < 0.6,
      `phase=${illum_full.phase.toFixed(3)}`)
  })
  it('near new moon: fraction < 0.05', () => {
    assert.ok(illum_new.fraction < 0.05, `fraction=${illum_new.fraction.toFixed(3)}`)
  })
  it('near new moon: phase close to 0 or 1', () => {
    const p = illum_new.phase
    assert.ok(p < 0.08 || p > 0.92, `phase=${p.toFixed(3)}`)
  })
  it('waxing: isWaxing = true', () => {
    assert.equal(illum_waxing.isWaxing, true)
  })
  it('fraction in [0, 1]', () => {
    assert.ok(illum_full.fraction >= 0 && illum_full.fraction <= 1)
    assert.ok(illum_new.fraction >= 0 && illum_new.fraction <= 1)
  })
  it('phase in [0, 1)', () => {
    assert.ok(illum_full.phase >= 0 && illum_full.phase < 1)
    assert.ok(illum_new.phase >= 0 && illum_new.phase < 1)
  })
  it('angle is finite', () => {
    assert.ok(isFinite(illum_full.angle), `angle=${illum_full.angle}`)
  })
  it('default date (now) returns valid result', () => {
    const illum = getMoonIllumination()
    assert.ok(illum.fraction >= 0 && illum.fraction <= 1)
    assert.ok(illum.phase >= 0 && illum.phase < 1)
    assert.equal(typeof illum.isWaxing, 'boolean')
    assert.ok(isFinite(illum.angle))
  })
})

// ─── getMoonPhase phaseName + phaseSymbol ─────────────────────────────────────

describe('getMoonPhase phaseName and phaseSymbol', () => {
  const PHASE_NAMES = new Set([
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
  ])
  const PHASE_SYMBOLS = new Set(['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'])

  it('phaseName is a valid human-readable name', () => {
    const p = getMoonPhase(DATE_MARCH_1_2025)
    assert.ok(PHASE_NAMES.has(p.phaseName), `got: ${p.phaseName}`)
  })
  it('phaseSymbol is a moon emoji', () => {
    const p = getMoonPhase(DATE_MARCH_1_2025)
    assert.ok(PHASE_SYMBOLS.has(p.phaseSymbol), `got: ${p.phaseSymbol}`)
  })
  it('near full moon: phaseName is Full Moon or gibbous', () => {
    const valid = new Set(['Full Moon', 'Waxing Gibbous', 'Waning Gibbous'])
    const p = getMoonPhase(new Date('2025-03-14T12:00:00Z'))
    assert.ok(valid.has(p.phaseName), `got: ${p.phaseName}`)
  })
  it('waxing crescent: phaseName is Waxing Crescent', () => {
    const p = getMoonPhase(new Date('2025-03-05T12:00:00Z'))
    assert.equal(p.phaseName, 'Waxing Crescent')
  })
  it('waxing crescent: phaseSymbol is correct', () => {
    const p = getMoonPhase(new Date('2025-03-05T12:00:00Z'))
    assert.equal(p.phaseSymbol, '🌒')
  })
})

// ─── getMoonVisibilityEstimate ─────────────────────────────────────────────────

describe('getMoonVisibilityEstimate', () => {
  const DATE_VIS_ESTIMATE = new Date('2025-03-02T18:30:00Z')
  const vis = getMoonVisibilityEstimate(DATE_VIS_ESTIMATE, 51.5074, -0.1278, 10)

  it('returns an object', () => {
    assert.ok(vis !== null && typeof vis === 'object')
  })
  it('zone is A, B, C, or D', () => {
    assert.ok(['A', 'B', 'C', 'D'].includes(vis.zone), `got: ${vis.zone}`)
  })
  it('V is finite', () => {
    assert.ok(isFinite(vis.V), `V=${vis.V}`)
  })
  it('ARCL is in [0, 180]', () => {
    assert.ok(vis.ARCL >= 0 && vis.ARCL <= 180, `ARCL=${vis.ARCL}`)
  })
  it('W >= 0', () => {
    assert.ok(vis.W >= 0, `W=${vis.W}`)
  })
  it('isApproximate is true', () => {
    assert.equal(vis.isApproximate, true)
  })
  it('moonAboveHorizon is a boolean', () => {
    assert.equal(typeof vis.moonAboveHorizon, 'boolean')
  })
  it('isVisibleNakedEye matches zone A', () => {
    assert.equal(vis.isVisibleNakedEye, vis.zone === 'A')
  })
  it('isVisibleWithOpticalAid matches zone A or B', () => {
    assert.equal(vis.isVisibleWithOpticalAid, vis.zone === 'A' || vis.zone === 'B')
  })
  it('description is a non-empty string', () => {
    assert.ok(typeof vis.description === 'string' && vis.description.length > 0)
  })
  it('default date works', () => {
    const v = getMoonVisibilityEstimate(new Date(), 21.4225, 39.8262)
    assert.ok(['A', 'B', 'C', 'D'].includes(v.zone))
    assert.ok(isFinite(v.V))
    assert.equal(v.isApproximate, true)
  })
  it('near new moon: zone is D or C', () => {
    const nearNew = getMoonVisibilityEstimate(new Date('2025-03-29T18:00:00Z'), 21.4225, 39.8262)
    assert.ok(['C', 'D'].includes(nearNew.zone), `zone=${nearNew.zone} V=${nearNew.V.toFixed(2)}`)
  })
})

// ─── getMoon ──────────────────────────────────────────────────────────────────

describe('getMoon', () => {
  const moon = getMoon(new Date('2025-03-05T20:00:00Z'), 51.5074, -0.1278, 10)

  it('returns object with phase, position, illumination, visibility', () => {
    assert.ok(typeof moon === 'object')
    assert.ok(typeof moon.phase === 'object')
    assert.ok(typeof moon.position === 'object')
    assert.ok(typeof moon.illumination === 'object')
    assert.ok(typeof moon.visibility === 'object')
  })
  it('phase is consistent with getMoonPhase standalone', () => {
    const standalone = getMoonPhase(new Date('2025-03-05T20:00:00Z'))
    assert.equal(moon.phase.phase, standalone.phase)
    assert.equal(moon.phase.phaseName, standalone.phaseName)
  })
  it('illumination.isWaxing matches phase.isWaxing', () => {
    assert.equal(moon.illumination.isWaxing, moon.phase.isWaxing)
  })
  it('visibility.isApproximate is true', () => {
    assert.equal(moon.visibility.isApproximate, true)
  })
  it('position has valid azimuth and altitude', () => {
    assert.ok(moon.position.azimuth >= 0 && moon.position.azimuth < 360)
    assert.ok(moon.position.altitude >= -90 && moon.position.altitude <= 90)
  })
  it('default date works', () => {
    const m = getMoon(new Date(), 21.4225, 39.8262)
    assert.ok(isFinite(m.position.azimuth))
    assert.ok(isFinite(m.illumination.fraction))
    assert.ok(['A', 'B', 'C', 'D'].includes(m.visibility.zone))
  })
})

// ─── Input validation ─────────────────────────────────────────────────────────

describe('Input validation', () => {
  it('getMoonPhase rejects invalid date', () => {
    assert.throws(() => getMoonPhase(new Date('invalid')), /valid Date/)
  })
  it('getMoonPosition rejects latitude out of range', () => {
    assert.throws(() => getMoonPosition(new Date(), 91, 0), /latitude/)
  })
  it('getMoonPosition rejects longitude out of range', () => {
    assert.throws(() => getMoonPosition(new Date(), 0, 181), /longitude/)
  })
  it('getMoonPosition rejects NaN latitude', () => {
    assert.throws(() => getMoonPosition(new Date(), NaN, 0), /latitude/)
  })
  it('getMoonVisibilityEstimate rejects invalid coordinates', () => {
    assert.throws(() => getMoonVisibilityEstimate(new Date(), -91, 0), /latitude/)
  })
  it('getMoon rejects invalid coordinates', () => {
    assert.throws(() => getMoon(new Date(), 0, 200), /longitude/)
  })
})
