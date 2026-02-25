/**
 * moon-calc ESM test suite
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

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
