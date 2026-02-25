'use strict'

/**
 * moon-calc CJS test suite
 * Runs with: node test-cjs.cjs
 * Verifies the CommonJS build is functional.
 */

const assert = require('node:assert/strict')
const {
  YALLOP_THRESHOLDS,
  YALLOP_DESCRIPTIONS,
  ODEH_THRESHOLDS,
  ODEH_DESCRIPTIONS,
  WGS84,
  getMoonPhase,
  initKernels,
  downloadKernels,
  verifyKernels,
  getMoonSightingReport,
  getSunMoonEvents,
} = require('./dist/index.cjs')

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

console.log('CJS compatibility:')

test('require() works', () => {
  assert.ok(YALLOP_THRESHOLDS !== undefined)
})
test('YALLOP_THRESHOLDS.A is 0.216', () => {
  assert.equal(YALLOP_THRESHOLDS.A, 0.216)
})
test('ODEH_THRESHOLDS.A is 5.65', () => {
  assert.equal(ODEH_THRESHOLDS.A, 5.65)
})
test('WGS84.a is 6378137.0', () => {
  assert.equal(WGS84.a, 6378137.0)
})
test('All API functions are exported', () => {
  assert.equal(typeof getMoonPhase, 'function')
  assert.equal(typeof initKernels, 'function')
  assert.equal(typeof downloadKernels, 'function')
  assert.equal(typeof verifyKernels, 'function')
  assert.equal(typeof getMoonSightingReport, 'function')
  assert.equal(typeof getSunMoonEvents, 'function')
})

console.log('\nCJS getMoonPhase:')

test('getMoonPhase returns valid phase', () => {
  const valid = new Set([
    'new-moon', 'waxing-crescent', 'first-quarter', 'waxing-gibbous',
    'full-moon', 'waning-gibbous', 'last-quarter', 'waning-crescent',
  ])
  const p = getMoonPhase(new Date('2025-03-14T12:00:00Z'))
  assert.ok(valid.has(p.phase), `got: ${p.phase}`)
})
test('getMoonPhase illumination in [0, 100]', () => {
  const p = getMoonPhase(new Date('2025-03-01T12:00:00Z'))
  assert.ok(p.illumination >= 0 && p.illumination <= 100)
})
test('getMoonPhase near full moon has high illumination', () => {
  const p = getMoonPhase(new Date('2025-03-14T12:00:00Z'))
  assert.ok(p.illumination > 85, `illumination=${p.illumination.toFixed(1)}%`)
})
test('getMoonPhase Dates are Date objects', () => {
  const p = getMoonPhase(new Date('2025-03-01T12:00:00Z'))
  assert.ok(p.nextNewMoon instanceof Date)
  assert.ok(p.prevNewMoon instanceof Date)
  assert.ok(p.nextFullMoon instanceof Date)
})

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
