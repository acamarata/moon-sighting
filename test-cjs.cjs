'use strict'

/**
 * moon-sighting CJS test suite
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
  getMoonPosition,
  getMoonIllumination,
  getMoonVisibilityEstimate,
  getMoon,
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
  assert.equal(typeof getMoonPosition, 'function')
  assert.equal(typeof getMoonIllumination, 'function')
  assert.equal(typeof getMoonVisibilityEstimate, 'function')
  assert.equal(typeof getMoon, 'function')
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

console.log('\nCJS getMoonPosition + getMoonIllumination:')

test('getMoonPosition returns valid azimuth/altitude', () => {
  const pos = getMoonPosition(new Date('2025-03-14T20:00:00Z'), 51.5074, -0.1278, 10)
  assert.ok(pos.azimuth >= 0 && pos.azimuth < 360, `azimuth=${pos.azimuth}`)
  assert.ok(pos.altitude >= -90 && pos.altitude <= 90, `altitude=${pos.altitude}`)
  assert.ok(pos.distance > 356000 && pos.distance < 407000, `distance=${pos.distance}`)
  assert.ok(isFinite(pos.parallacticAngle))
})
test('getMoonIllumination near full moon: fraction > 0.85', () => {
  const illum = getMoonIllumination(new Date('2025-03-14T12:00:00Z'))
  assert.ok(illum.fraction > 0.85, `fraction=${illum.fraction.toFixed(3)}`)
  assert.ok(illum.phase > 0.4 && illum.phase < 0.6, `phase=${illum.phase.toFixed(3)}`)
  assert.ok(isFinite(illum.angle))
})
test('getMoonIllumination waxing: isWaxing = true', () => {
  const illum = getMoonIllumination(new Date('2025-03-05T12:00:00Z'))
  assert.equal(illum.isWaxing, true)
})

console.log('\nCJS getMoonPhase phaseName/phaseSymbol:')

test('getMoonPhase.phaseName is a non-empty string', () => {
  const p = getMoonPhase(new Date('2025-03-05T12:00:00Z'))
  assert.ok(typeof p.phaseName === 'string' && p.phaseName.length > 0)
})
test('getMoonPhase.phaseSymbol is a moon emoji', () => {
  const SYMBOLS = new Set(['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'])
  const p = getMoonPhase(new Date('2025-03-05T12:00:00Z'))
  assert.ok(SYMBOLS.has(p.phaseSymbol), `got: ${p.phaseSymbol}`)
})
test('Waxing crescent: phaseName = "Waxing Crescent", phaseSymbol = "🌒"', () => {
  const p = getMoonPhase(new Date('2025-03-05T12:00:00Z'))
  assert.equal(p.phaseName, 'Waxing Crescent')
  assert.equal(p.phaseSymbol, '🌒')
})

console.log('\nCJS getMoonVisibilityEstimate:')

test('getMoonVisibilityEstimate returns valid zone', () => {
  const v = getMoonVisibilityEstimate(new Date('2025-03-02T18:30:00Z'), 51.5074, -0.1278, 10)
  assert.ok(['A', 'B', 'C', 'D'].includes(v.zone), `zone=${v.zone}`)
  assert.ok(isFinite(v.V))
  assert.equal(v.isApproximate, true)
})
test('getMoonVisibilityEstimate near new moon: zone C or D', () => {
  const v = getMoonVisibilityEstimate(new Date('2025-03-29T18:00:00Z'), 21.4225, 39.8262)
  assert.ok(['C', 'D'].includes(v.zone), `zone=${v.zone}`)
})

console.log('\nCJS getMoon:')

test('getMoon returns all four sub-results', () => {
  const m = getMoon(new Date('2025-03-05T20:00:00Z'), 51.5074, -0.1278, 10)
  assert.ok(typeof m.phase === 'object')
  assert.ok(typeof m.position === 'object')
  assert.ok(typeof m.illumination === 'object')
  assert.ok(typeof m.visibility === 'object')
})
test('getMoon.phase.phaseName is non-empty', () => {
  const m = getMoon(new Date('2025-03-05T20:00:00Z'), 51.5074, -0.1278)
  assert.ok(typeof m.phase.phaseName === 'string' && m.phase.phaseName.length > 0)
})
test('getMoon.visibility.isApproximate is true', () => {
  const m = getMoon(new Date(), 51.5074, -0.1278)
  assert.equal(m.visibility.isApproximate, true)
})

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
