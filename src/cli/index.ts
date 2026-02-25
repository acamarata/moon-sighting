/**
 * moon-calc CLI
 *
 * Commands:
 *   moon-calc download-kernels    Download DE442S and naif0012.tls to cache
 *   moon-calc verify-kernels      Verify cached kernels by SHA-256 checksum
 *   moon-calc sighting <lat> <lon> [date]   Print a sighting report
 *   moon-calc phase [date]        Print current moon phase
 *   moon-calc benchmark           Run performance benchmark
 */

import {
  initKernels,
  downloadKernels,
  verifyKernels,
  getMoonSightingReport,
  getMoonPhase,
} from '../api/index.js'

const args = process.argv.slice(2)
const command = args[0]

async function main() {
  switch (command) {
    case 'download-kernels':
      await cmdDownloadKernels()
      break
    case 'verify-kernels':
      await cmdVerifyKernels()
      break
    case 'sighting':
      await cmdSighting(args.slice(1))
      break
    case 'phase':
      cmdPhase(args[1])
      break
    case 'benchmark':
      await cmdBenchmark()
      break
    default:
      printHelp()
      process.exit(command ? 1 : 0)
  }
}

function printHelp() {
  console.log(`moon-calc — Lunar crescent visibility calculator

Commands:
  download-kernels              Download DE442S and naif0012.tls to cache
  verify-kernels                Verify cached kernels by SHA-256
  sighting <lat> <lon> [date]   Print sighting report (date: YYYY-MM-DD, default today)
  phase [date]                  Print moon phase (date: YYYY-MM-DD, default today)
  benchmark                     Run performance benchmark

Examples:
  moon-calc download-kernels
  moon-calc sighting 51.5 -0.1 2025-03-29
  moon-calc sighting 21.4 39.8  # Mecca
  moon-calc phase 2025-03-01`)
}

async function cmdDownloadKernels() {
  await downloadKernels()
  console.log('Kernels ready.')
}

async function cmdVerifyKernels() {
  const result = await verifyKernels()
  if (result.ok) {
    console.log('Kernels OK.')
  } else {
    for (const err of result.errors) console.error(err)
    process.exit(1)
  }
}

async function cmdSighting(cmdArgs: string[]) {
  const lat = parseFloat(cmdArgs[0] ?? '')
  const lon = parseFloat(cmdArgs[1] ?? '')
  const dateStr = cmdArgs[2] ?? new Date().toISOString().slice(0, 10)

  if (isNaN(lat) || isNaN(lon)) {
    console.error('Usage: moon-calc sighting <lat> <lon> [YYYY-MM-DD]')
    process.exit(1)
  }

  const date = new Date(`${dateStr}T00:00:00Z`)
  if (isNaN(date.getTime())) {
    console.error(`Invalid date: ${dateStr}. Use YYYY-MM-DD format.`)
    process.exit(1)
  }

  console.log(`Computing sighting report for ${lat}°N ${lon}°E on ${dateStr}...`)
  await initKernels()

  const report = await getMoonSightingReport(date, { lat, lon, elevation: 0 })

  console.log('')
  console.log(`Sunset:    ${fmtDate(report.sunsetUTC)}`)
  console.log(`Moonset:   ${fmtDate(report.moonsetUTC)}`)
  console.log(`Best time: ${fmtDate(report.bestTimeUTC)}`)
  console.log(`Lag:       ${report.lagMinutes !== null ? Math.round(report.lagMinutes) + ' min' : 'N/A'}`)
  console.log('')

  if (report.geometry) {
    const g = report.geometry
    console.log(`ARCL:      ${g.ARCL.toFixed(2)}°`)
    console.log(`ARCV:      ${g.ARCV.toFixed(2)}°`)
    console.log(`DAZ:       ${g.DAZ.toFixed(2)}°`)
    console.log(`W:         ${g.W.toFixed(3)} arcmin`)
  }

  if (report.yallop && report.odeh) {
    console.log('')
    console.log(`Yallop:    ${report.yallop.category} — ${report.yallop.description}`)
    console.log(`Odeh:      ${report.odeh.zone} — ${report.odeh.description}`)
  }

  console.log('')
  console.log(report.guidance)
}

function cmdPhase(dateStr?: string) {
  const date = dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date()
  if (isNaN(date.getTime())) {
    console.error(`Invalid date: ${dateStr}. Use YYYY-MM-DD format.`)
    process.exit(1)
  }

  const phase = getMoonPhase(date)

  console.log(`Moon phase for ${date.toISOString().slice(0, 10)}:`)
  console.log(`  Phase:        ${phase.phase}`)
  console.log(`  Illumination: ${phase.illumination.toFixed(1)}%`)
  console.log(`  Age:          ${phase.age.toFixed(1)} hours`)
  console.log(`  Elongation:   ${phase.elongationDeg.toFixed(1)}°`)
  console.log(`  Waxing:       ${phase.isWaxing}`)
  console.log(`  Prev new:     ${phase.prevNewMoon.toISOString().slice(0, 16)} UTC`)
  console.log(`  Next new:     ${phase.nextNewMoon.toISOString().slice(0, 16)} UTC`)
  console.log(`  Next full:    ${phase.nextFullMoon.toISOString().slice(0, 16)} UTC`)
}

async function cmdBenchmark() {
  console.log('moon-calc benchmark\n')

  // Benchmark 1: getMoonPhase (no kernel needed)
  const N_PHASE = 10000
  const phaseStart = performance.now()
  for (let i = 0; i < N_PHASE; i++) {
    getMoonPhase(new Date(Date.UTC(2025, 2, 1 + (i % 28))))
  }
  const phaseMs = performance.now() - phaseStart
  console.log(`getMoonPhase × ${N_PHASE}: ${phaseMs.toFixed(1)} ms  (${(phaseMs / N_PHASE * 1000).toFixed(1)} µs/call)`)

  // Benchmark 2: kernel load
  const loadStart = performance.now()
  await initKernels()
  const loadMs = performance.now() - loadStart
  console.log(`initKernels (cold/cached): ${loadMs.toFixed(1)} ms`)

  // Benchmark 3: single sighting report
  const observer = { lat: 51.5074, lon: -0.1278, elevation: 10 }
  const reportStart = performance.now()
  await getMoonSightingReport(new Date('2025-03-29T00:00:00Z'), observer)
  const reportMs = performance.now() - reportStart
  console.log(`getMoonSightingReport (single): ${reportMs.toFixed(1)} ms`)
}

/** Format a nullable Date as a short UTC string. */
function fmtDate(d: Date | null): string {
  if (!d) return 'N/A'
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
