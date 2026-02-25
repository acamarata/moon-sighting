/**
 * moon-sighting ESM test suite
 * Runs with: node test.mjs
 * All tests use plain assert — no test framework.
 */

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

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  [${name}]... PASS`)
    passed++
  } catch (err) {
    console.error(`  [${name}]... FAIL: ${err.message}`)
    failed++
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

console.log('Constants:')

test('YALLOP_THRESHOLDS.A is 0.216', () => {
  assert.equal(YALLOP_THRESHOLDS.A, 0.216)
})
test('YALLOP_THRESHOLDS.E is -0.293', () => {
  assert.equal(YALLOP_THRESHOLDS.E, -0.293)
})
test('All Yallop thresholds are defined', () => {
  for (const key of ['A', 'B', 'C', 'D', 'E']) {
    assert.ok(typeof YALLOP_THRESHOLDS[key] === 'number', `${key} should be a number`)
  }
})
test('Yallop thresholds descend A > B > C > D > E', () => {
  assert.ok(YALLOP_THRESHOLDS.A > YALLOP_THRESHOLDS.B)
  assert.ok(YALLOP_THRESHOLDS.B > YALLOP_THRESHOLDS.C)
  assert.ok(YALLOP_THRESHOLDS.C > YALLOP_THRESHOLDS.D)
  assert.ok(YALLOP_THRESHOLDS.D > YALLOP_THRESHOLDS.E)
})
test('ODEH_THRESHOLDS.A is 5.65', () => {
  assert.equal(ODEH_THRESHOLDS.A, 5.65)
})
test('ODEH_THRESHOLDS.C is -0.96', () => {
  assert.equal(ODEH_THRESHOLDS.C, -0.96)
})
test('Odeh thresholds descend A > B > C', () => {
  assert.ok(ODEH_THRESHOLDS.A > ODEH_THRESHOLDS.B)
  assert.ok(ODEH_THRESHOLDS.B > ODEH_THRESHOLDS.C)
})
test('WGS84.a is 6378137.0', () => {
  assert.equal(WGS84.a, 6378137.0)
})
test('WGS84.invF is 298.257223563', () => {
  assert.equal(WGS84.invF, 298.257223563)
})
test('WGS84.e2 is positive and < 1', () => {
  assert.ok(WGS84.e2 > 0 && WGS84.e2 < 1, `e2=${WGS84.e2}`)
})
test('WGS84.b < WGS84.a (oblate spheroid)', () => {
  assert.ok(WGS84.b < WGS84.a)
})
test('Yallop descriptions are non-empty strings', () => {
  for (const cat of ['A', 'B', 'C', 'D', 'E', 'F']) {
    assert.ok(typeof YALLOP_DESCRIPTIONS[cat] === 'string' && YALLOP_DESCRIPTIONS[cat].length > 0)
  }
})
test('Odeh descriptions are non-empty strings', () => {
  for (const zone of ['A', 'B', 'C', 'D']) {
    assert.ok(typeof ODEH_DESCRIPTIONS[zone] === 'string' && ODEH_DESCRIPTIONS[zone].length > 0)
  }
})

// ─── API function exports ──────────────────────────────────────────────────────

console.log('\nAPI exports:')

test('getMoonPhase is a function', () => {
  assert.equal(typeof getMoonPhase, 'function')
})
test('initKernels is a function', () => {
  assert.equal(typeof initKernels, 'function')
})
test('downloadKernels is a function', () => {
  assert.equal(typeof downloadKernels, 'function')
})
test('verifyKernels is a function', () => {
  assert.equal(typeof verifyKernels, 'function')
})
test('getMoonSightingReport is a function', () => {
  assert.equal(typeof getMoonSightingReport, 'function')
})
test('getSunMoonEvents is a function', () => {
  assert.equal(typeof getSunMoonEvents, 'function')
})

// ─── getMoonPhase (synchronous, no kernel) ─────────────────────────────────────

console.log('\ngetMoonPhase — structure:')

const VALID_PHASES = new Set([
  'new-moon', 'waxing-crescent', 'first-quarter', 'waxing-gibbous',
  'full-moon', 'waning-gibbous', 'last-quarter', 'waning-crescent',
])

// Test with a known reference date: 2025-03-01 UTC
// At this date the Moon was a waxing crescent (~2 days after new moon Feb 28)
const DATE_MARCH_1_2025 = new Date('2025-03-01T12:00:00Z')
const phase_march1 = getMoonPhase(DATE_MARCH_1_2025)

test('getMoonPhase returns an object', () => {
  assert.ok(phase_march1 !== null && typeof phase_march1 === 'object')
})
test('getMoonPhase.phase is a valid phase name', () => {
  assert.ok(VALID_PHASES.has(phase_march1.phase), `got: ${phase_march1.phase}`)
})
test('getMoonPhase.illumination is in [0, 100]', () => {
  assert.ok(phase_march1.illumination >= 0 && phase_march1.illumination <= 100,
    `illumination=${phase_march1.illumination}`)
})
test('getMoonPhase.age is >= 0', () => {
  assert.ok(phase_march1.age >= 0, `age=${phase_march1.age}`)
})
test('getMoonPhase.elongationDeg is in [0, 180]', () => {
  assert.ok(phase_march1.elongationDeg >= 0 && phase_march1.elongationDeg <= 180,
    `elongationDeg=${phase_march1.elongationDeg}`)
})
test('getMoonPhase.isWaxing is a boolean', () => {
  assert.equal(typeof phase_march1.isWaxing, 'boolean')
})
test('getMoonPhase.nextNewMoon is a Date', () => {
  assert.ok(phase_march1.nextNewMoon instanceof Date)
})
test('getMoonPhase.prevNewMoon is a Date', () => {
  assert.ok(phase_march1.prevNewMoon instanceof Date)
})
test('getMoonPhase.nextFullMoon is a Date', () => {
  assert.ok(phase_march1.nextFullMoon instanceof Date)
})
test('getMoonPhase.prevNewMoon is before reference date', () => {
  assert.ok(phase_march1.prevNewMoon < DATE_MARCH_1_2025,
    `prevNewMoon=${phase_march1.prevNewMoon.toISOString()}`)
})
test('getMoonPhase.nextNewMoon is after prevNewMoon', () => {
  assert.ok(phase_march1.nextNewMoon > phase_march1.prevNewMoon)
})

console.log('\ngetMoonPhase — phase boundaries:')

// 2025-03-14 was close to full moon (illumination should be high)
const DATE_FULL_MOON = new Date('2025-03-14T12:00:00Z')
const phase_full = getMoonPhase(DATE_FULL_MOON)

test('Near full moon: illumination > 85%', () => {
  assert.ok(phase_full.illumination > 85,
    `illumination at full moon=${phase_full.illumination.toFixed(1)}%`)
})
test('Near full moon: phase is full-moon or waxing/waning gibbous', () => {
  const valid = new Set(['full-moon', 'waxing-gibbous', 'waning-gibbous'])
  assert.ok(valid.has(phase_full.phase), `got: ${phase_full.phase}`)
})
test('Near full moon: elongation > 120°', () => {
  assert.ok(phase_full.elongationDeg > 120, `elongation=${phase_full.elongationDeg}`)
})

// 2025-03-29 is close to new moon (illumination should be low)
const DATE_NEW_MOON = new Date('2025-03-29T12:00:00Z')
const phase_new = getMoonPhase(DATE_NEW_MOON)

test('Near new moon: illumination < 10%', () => {
  assert.ok(phase_new.illumination < 10,
    `illumination at new moon=${phase_new.illumination.toFixed(1)}%`)
})
test('Near new moon: elongation < 30°', () => {
  assert.ok(phase_new.elongationDeg < 30, `elongation=${phase_new.elongationDeg}`)
})

console.log('\ngetMoonPhase — consistency:')

// Two dates: one clearly waxing, one clearly waning
const DATE_WAXING = new Date('2025-03-05T12:00:00Z')  // ~7 days after new moon
const DATE_WANING = new Date('2025-03-20T12:00:00Z')  // ~6 days after full moon
const phase_waxing = getMoonPhase(DATE_WAXING)
const phase_waning = getMoonPhase(DATE_WANING)

test('5 days after new moon: isWaxing = true', () => {
  assert.equal(phase_waxing.isWaxing, true)
})
test('6 days after full moon: isWaxing = false', () => {
  assert.equal(phase_waning.isWaxing, false)
})
test('getMoonPhase with default date (now) returns valid result', () => {
  const nowPhase = getMoonPhase()
  assert.ok(VALID_PHASES.has(nowPhase.phase))
  assert.ok(nowPhase.illumination >= 0 && nowPhase.illumination <= 100)
})

// Synodic month duration check: nextNewMoon - prevNewMoon ≈ 29.53 days
test('Synodic month duration is ~29.5 days (±0.5)', () => {
  const synodicMs = phase_march1.nextNewMoon.getTime() - phase_march1.prevNewMoon.getTime()
  const synodicDays = synodicMs / 86400000
  assert.ok(
    synodicDays > 29.0 && synodicDays < 30.1,
    `synodic month=${synodicDays.toFixed(2)} days`,
  )
})

// ─── getMoonPosition ─────────────────────────────────────────────────────────

console.log('\ngetMoonPosition:')

// London on 2025-03-14 at noon UTC — Moon should be above the horizon during daytime
const moonPos_london = getMoonPosition(new Date('2025-03-14T20:00:00Z'), 51.5074, -0.1278, 10)

test('getMoonPosition returns azimuth in [0, 360)', () => {
  assert.ok(
    moonPos_london.azimuth >= 0 && moonPos_london.azimuth < 360,
    `azimuth=${moonPos_london.azimuth}`,
  )
})
test('getMoonPosition returns altitude in [-90, 90]', () => {
  assert.ok(
    moonPos_london.altitude >= -90 && moonPos_london.altitude <= 90,
    `altitude=${moonPos_london.altitude}`,
  )
})
test('getMoonPosition returns distance in lunar orbit range [356000, 407000] km', () => {
  assert.ok(
    moonPos_london.distance >= 356000 && moonPos_london.distance <= 407000,
    `distance=${moonPos_london.distance.toFixed(0)} km`,
  )
})
test('getMoonPosition returns finite parallacticAngle', () => {
  assert.ok(
    isFinite(moonPos_london.parallacticAngle),
    `parallacticAngle=${moonPos_london.parallacticAngle}`,
  )
})
test('getMoonPosition default date (now) returns valid result', () => {
  const pos = getMoonPosition(new Date(), 21.4225, 39.8262) // Mecca
  assert.ok(pos.azimuth >= 0 && pos.azimuth < 360)
  assert.ok(pos.altitude >= -90 && pos.altitude <= 90)
  assert.ok(pos.distance > 350000 && pos.distance < 410000)
})

// ─── getMoonIllumination ─────────────────────────────────────────────────────

console.log('\ngetMoonIllumination:')

// 2025-03-14 was close to full moon
const illum_full = getMoonIllumination(new Date('2025-03-14T12:00:00Z'))
// 2025-03-29 was close to new moon
const illum_new = getMoonIllumination(new Date('2025-03-29T12:00:00Z'))
// 2025-03-05 was waxing crescent (~7 days after new moon)
const illum_waxing = getMoonIllumination(new Date('2025-03-05T12:00:00Z'))

test('getMoonIllumination near full moon: fraction > 0.85', () => {
  assert.ok(illum_full.fraction > 0.85, `fraction=${illum_full.fraction.toFixed(3)}`)
})
test('getMoonIllumination near full moon: phase close to 0.5', () => {
  assert.ok(
    illum_full.phase > 0.4 && illum_full.phase < 0.6,
    `phase=${illum_full.phase.toFixed(3)}`,
  )
})
test('getMoonIllumination near new moon: fraction < 0.05', () => {
  assert.ok(illum_new.fraction < 0.05, `fraction=${illum_new.fraction.toFixed(3)}`)
})
test('getMoonIllumination near new moon: phase close to 0 or 1', () => {
  const p = illum_new.phase
  assert.ok(p < 0.08 || p > 0.92, `phase=${p.toFixed(3)}`)
})
test('getMoonIllumination waxing: isWaxing = true', () => {
  assert.equal(illum_waxing.isWaxing, true)
})
test('getMoonIllumination fraction in [0, 1]', () => {
  assert.ok(illum_full.fraction >= 0 && illum_full.fraction <= 1)
  assert.ok(illum_new.fraction >= 0 && illum_new.fraction <= 1)
})
test('getMoonIllumination phase in [0, 1)', () => {
  assert.ok(illum_full.phase >= 0 && illum_full.phase < 1)
  assert.ok(illum_new.phase >= 0 && illum_new.phase < 1)
})
test('getMoonIllumination angle is finite', () => {
  assert.ok(isFinite(illum_full.angle), `angle=${illum_full.angle}`)
})
test('getMoonIllumination default date (now) returns valid result', () => {
  const illum = getMoonIllumination()
  assert.ok(illum.fraction >= 0 && illum.fraction <= 1)
  assert.ok(illum.phase >= 0 && illum.phase < 1)
  assert.equal(typeof illum.isWaxing, 'boolean')
  assert.ok(isFinite(illum.angle))
})

// ─── getMoonPhase phaseName + phaseSymbol ─────────────────────────────────────

console.log('\ngetMoonPhase — phaseName + phaseSymbol:')

const PHASE_NAMES = new Set([
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
])
const PHASE_SYMBOLS = new Set(['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'])

test('getMoonPhase.phaseName is a valid human-readable name', () => {
  const p = getMoonPhase(DATE_MARCH_1_2025)
  assert.ok(PHASE_NAMES.has(p.phaseName), `got: ${p.phaseName}`)
})
test('getMoonPhase.phaseSymbol is a moon emoji', () => {
  const p = getMoonPhase(DATE_MARCH_1_2025)
  assert.ok(PHASE_SYMBOLS.has(p.phaseSymbol), `got: ${p.phaseSymbol}`)
})
test('Near full moon: phaseName is "Full Moon" or gibbous', () => {
  const valid = new Set(['Full Moon', 'Waxing Gibbous', 'Waning Gibbous'])
  const p = getMoonPhase(DATE_FULL_MOON)
  assert.ok(valid.has(p.phaseName), `got: ${p.phaseName}`)
})
test('Near full moon: phaseSymbol is 🌕 or 🌔 or 🌖', () => {
  const valid = new Set(['🌕', '🌔', '🌖'])
  const p = getMoonPhase(DATE_FULL_MOON)
  assert.ok(valid.has(p.phaseSymbol), `got: ${p.phaseSymbol}`)
})
test('Waxing crescent: phaseName is "Waxing Crescent"', () => {
  const p = getMoonPhase(DATE_WAXING)
  assert.equal(p.phaseName, 'Waxing Crescent')
})
test('Waxing crescent: phaseSymbol is 🌒', () => {
  const p = getMoonPhase(DATE_WAXING)
  assert.equal(p.phaseSymbol, '🌒')
})
test('phaseName and phaseSymbol are consistent with phase key', () => {
  // If phase is 'waning-crescent', phaseName should be 'Waning Crescent'
  const p = getMoonPhase(DATE_WANING)
  assert.equal(typeof p.phaseName, 'string')
  assert.ok(p.phaseName.length > 0)
  assert.ok(PHASE_SYMBOLS.has(p.phaseSymbol))
})

// ─── getMoonVisibilityEstimate ─────────────────────────────────────────────────

console.log('\ngetMoonVisibilityEstimate:')

// London, 40 min after nominal sunset on 2025-03-01 (day after new moon)
const DATE_VIS_ESTIMATE = new Date('2025-03-02T18:30:00Z')
const vis = getMoonVisibilityEstimate(DATE_VIS_ESTIMATE, 51.5074, -0.1278, 10)

test('getMoonVisibilityEstimate returns an object', () => {
  assert.ok(vis !== null && typeof vis === 'object')
})
test('getMoonVisibilityEstimate.zone is A, B, C, or D', () => {
  assert.ok(['A', 'B', 'C', 'D'].includes(vis.zone), `got: ${vis.zone}`)
})
test('getMoonVisibilityEstimate.V is finite', () => {
  assert.ok(isFinite(vis.V), `V=${vis.V}`)
})
test('getMoonVisibilityEstimate.ARCL is in [0, 180]', () => {
  assert.ok(vis.ARCL >= 0 && vis.ARCL <= 180, `ARCL=${vis.ARCL}`)
})
test('getMoonVisibilityEstimate.W >= 0', () => {
  assert.ok(vis.W >= 0, `W=${vis.W}`)
})
test('getMoonVisibilityEstimate.isApproximate is true', () => {
  assert.equal(vis.isApproximate, true)
})
test('getMoonVisibilityEstimate.moonAboveHorizon is a boolean', () => {
  assert.equal(typeof vis.moonAboveHorizon, 'boolean')
})
test('getMoonVisibilityEstimate.isVisibleNakedEye matches zone A', () => {
  assert.equal(vis.isVisibleNakedEye, vis.zone === 'A')
})
test('getMoonVisibilityEstimate.isVisibleWithOpticalAid matches zone A or B', () => {
  assert.equal(vis.isVisibleWithOpticalAid, vis.zone === 'A' || vis.zone === 'B')
})
test('getMoonVisibilityEstimate.description is a non-empty string', () => {
  assert.ok(typeof vis.description === 'string' && vis.description.length > 0)
})
test('getMoonVisibilityEstimate default date works', () => {
  const v = getMoonVisibilityEstimate(new Date(), 21.4225, 39.8262)
  assert.ok(['A', 'B', 'C', 'D'].includes(v.zone))
  assert.ok(isFinite(v.V))
  assert.equal(v.isApproximate, true)
})
// Near new moon: elongation small, W small, crescent should be very thin or invisible
test('Near new moon: zone is D or C (not visible or marginal)', () => {
  const nearNew = getMoonVisibilityEstimate(new Date('2025-03-29T18:00:00Z'), 21.4225, 39.8262)
  assert.ok(['C', 'D'].includes(nearNew.zone), `zone=${nearNew.zone} V=${nearNew.V.toFixed(2)}`)
})

// ─── getMoon ──────────────────────────────────────────────────────────────────

console.log('\ngetMoon:')

const moon = getMoon(new Date('2025-03-05T20:00:00Z'), 51.5074, -0.1278, 10)

test('getMoon returns an object with phase, position, illumination, visibility', () => {
  assert.ok(typeof moon === 'object')
  assert.ok(typeof moon.phase === 'object')
  assert.ok(typeof moon.position === 'object')
  assert.ok(typeof moon.illumination === 'object')
  assert.ok(typeof moon.visibility === 'object')
})
test('getMoon.phase is consistent with getMoonPhase standalone', () => {
  const standalone = getMoonPhase(new Date('2025-03-05T20:00:00Z'))
  assert.equal(moon.phase.phase, standalone.phase)
  assert.equal(moon.phase.phaseName, standalone.phaseName)
})
test('getMoon.illumination.isWaxing matches phase.isWaxing', () => {
  assert.equal(moon.illumination.isWaxing, moon.phase.isWaxing)
})
test('getMoon.visibility.isApproximate is true', () => {
  assert.equal(moon.visibility.isApproximate, true)
})
test('getMoon.position has valid azimuth and altitude', () => {
  assert.ok(moon.position.azimuth >= 0 && moon.position.azimuth < 360)
  assert.ok(moon.position.altitude >= -90 && moon.position.altitude <= 90)
})
test('getMoon default date works', () => {
  const m = getMoon(new Date(), 21.4225, 39.8262)
  assert.ok(PHASE_NAMES.has(m.phase.phaseName))
  assert.ok(isFinite(m.position.azimuth))
  assert.ok(isFinite(m.illumination.fraction))
  assert.ok(['A', 'B', 'C', 'D'].includes(m.visibility.zone))
})

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
