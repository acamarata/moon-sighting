/**
 * Generates the cross-language parity fixture consumed by the Dart port.
 *
 * Covers the four functions both ports implement: getMoonPhase, getMoonIllumination,
 * getMoonPosition and getMoonVisibilityEstimate. The kernel-backed entry points
 * (getMoonSightingReport, getSunMoonEvents) are JavaScript-only — they need SPK kernels the
 * Dart port does not ship — so they are out of scope here by construction, not by omission.
 *
 * Usage, from the repository root:
 *
 *   pnpm build
 *   node tool/generate-parity-fixture-moon.mjs > ../moon-sighting-dart/test/fixtures/cross_language_golden.json
 *
 * Values are emitted at full double precision. The Dart suite compares with a relative
 * tolerance sized to the observed difference between the two runtimes' transcendental
 * functions, which is a few parts in 1e12 — far below any physically meaningful quantity here
 * and far above nothing, since bit-identical sin/cos across two runtimes is not guaranteed.
 *
 * Regenerate only when an intentional algorithm change lands in both ports.
 */

import { getMoonPhase, getMoonIllumination, getMoonPosition, getMoonVisibilityEstimate } from "../dist/index.mjs";

const instants = [];
for (let d = 0; d < 30; d += 3) instants.push(Date.UTC(2026, 7, 1 + d, 12));
for (const m of [0, 3, 6, 9]) instants.push(Date.UTC(2026, m, 15, 6));
instants.push(Date.UTC(2026, 0, 18, 19, 52));
instants.push(Date.UTC(2026, 0, 3, 10, 3));
instants.push(Date.UTC(1990, 5, 21, 0));
instants.push(Date.UTC(2050, 5, 21, 0));

const places = [
  ["Makkah", 21.4225, 39.8262],
  ["London", 51.5074, -0.1278],
  ["Jakarta", -6.2088, 106.8456],
  ["Reykjavik", 64.1466, -21.9426],
];

// Full double precision. Rounding the fixture would mean the Dart suite compares against
// this script's rounding rather than against the JavaScript result, and at a tight tolerance
// that rounding dominates the real difference.
const round = (n) => n;

const out = { phase: [], illumination: [], position: [], visibility: [] };

for (const ms of instants) {
  const d = new Date(ms);
  const iso = d.toISOString();

  const p = getMoonPhase(d);
  out.phase.push({
    iso, phase: p.phase, phaseName: p.phaseName,
    illumination: round(p.illumination), age: round(p.age),
    elongationDeg: round(p.elongationDeg), isWaxing: p.isWaxing,
  });

  const il = getMoonIllumination(d);
  out.illumination.push({
    iso, fraction: round(il.fraction), phase: round(il.phase),
    angle: round(il.angle), isWaxing: il.isWaxing,
  });

  for (const [name, lat, lon] of places) {
    const pos = getMoonPosition(d, lat, lon);
    out.position.push({
      iso, place: name,
      azimuth: round(pos.azimuth), altitude: round(pos.altitude),
      distance: round(pos.distance), parallacticAngle: round(pos.parallacticAngle),
    });

    const v = getMoonVisibilityEstimate(d, lat, lon);
    out.visibility.push({
      iso, place: name, V: round(v.V), zone: v.zone,
      ARCL: round(v.ARCL), ARCV: round(v.ARCV),
    });
  }
}

console.log(JSON.stringify(out, null, 0));
