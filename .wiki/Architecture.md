# Architecture

## Module layout

```text
src/
  math/         Numerical utilities
  time/         Time scale conversions
  spk/          JPL kernel reader
  frames/       Earth orientation transforms
  observer/     Observer model and refraction
  bodies/       Moon/Sun state computation
  events/       Rise/set and event finding
  visibility/   Crescent visibility criteria
  api/          User-facing API and kernel management
  cli/          Command-line interface
```

Each module has zero application-level side effects and no circular dependencies. The layering is strict: lower layers never import from higher ones.

```text
math  <──  time  <──  spk  <──  frames  <──  observer  <──  bodies  <──  events  <──  visibility  <──  api
                                                                                                          └──  cli
```

## Data flow for a sighting report

```text
User calls: getMoonSightingReport(date, observer)
   │
   ├── computeTimeScales(date)
   │     UTC → JD(UTC) → ΔAT → JD(TAI) → JD(TT) → JD(TDB) → JD(UT1)
   │
   ├── getSunMoonEvents(date, observer, kernel)
   │     For 48 time samples across the civil day:
   │       computeAzAlt(Moon, observer, ts)
   │       computeAzAlt(Sun, observer, ts)
   │     Brent root-finding on altitude crossings
   │     → sunsetUTC, moonsetUTC, lag, twilight times
   │
   ├── bestTimeHeuristic(sunsetUTC, moonsetUTC)
   │     T_b = T_sunset + (4/9) × Lag
   │
   ├── At best time T_b:
   │     computeTimeScales(T_b)
   │     getMoonGeocentricState(kernel, ET)    ← DE442S SPK evaluation
   │     getSunGeocentricState(kernel, ET)     ← DE442S SPK evaluation
   │     gcrsToItrs(moonGCRS, ts)              ← IERS Q·R·W chain
   │     geodeticToECEF(observer)              ← WGS84
   │     topocentricPosition(moon, observer)   ← parallax correction
   │     enuToAzAlt(moonENU)                   ← local horizon coords
   │
   ├── computeCrescentGeometry(moonAzAlt, sunAzAlt, moonVec, sunVec)
   │     → { ARCL, ARCV, DAZ, W, lag }
   │
   ├── computeYallop(geometry, W')             ← q parameter, category A–F
   ├── computeOdeh(geometry)                   ← V parameter, zone A–D
   │
   └── buildGuidanceText(...)
         → "Best time to look: ..."
```

## Ephemeris evaluation

The DE442S kernel is the most important external dependency. It is a JPL SPK file containing Chebyshev polynomial fits to the positions of the Sun, Moon, and planets from 1849 to 2150. Reading it requires:

1. **DAF parser:** reads the binary Double Precision Array File header, iterates summary records, and builds a segment index keyed by (target, center) NAIF ID pairs.

2. **Segment chaining:** DE442S does not store Moon-relative-to-Earth directly. Instead it stores Moon-relative-to-EMB and Earth-relative-to-EMB; the code adds these vectors to get Moon-relative-to-Earth. Similarly for Sun-relative-to-Earth via SSB segments.

3. **Type 2 Chebyshev evaluation:** each time interval has a fixed set of Chebyshev coefficients. Given an ET, the code locates the correct record, computes the normalized time argument x ∈ [−1, 1], and evaluates the degree-n polynomial via the Clenshaw recurrence for each of X, Y, Z.

See [Ephemeris](Ephemeris) for the full technical description.

## Frame transformation

JPL ephemerides are expressed in the ICRF (International Celestial Reference Frame), essentially the J2000 inertial frame. Topocentric alt/az requires Earth-fixed (ITRS) coordinates. The transformation chain (IERS Conventions 2010) is:

```text
[ITRS] = W(t) · R(t) · Q(t) · [GCRS]
```

- **Q(t):** IAU 2006 precession + IAU 2000A nutation (celestial motion), parameterized by CIP coordinates X, Y and CIO locator s.
- **R(t):** Earth rotation angle (ERA) from UT1, a simple rotation about the pole.
- **W(t):** polar motion (xp, yp), typically < 0.5 arcsec; defaults to zero.

This is the largest code in the project (large nutation series tables), but far smaller than the ephemeris data.

See [Reference Frames](Reference-Frames) for implementation details.

## Observer model

Observer position is computed in three stages:

1. **Geodetic → ECEF:** WGS84 ellipsoid, exact formula using N(φ) (prime vertical radius of curvature). Output in meters.
2. **ECEF → GCRS:** Apply the inverse of the Q·R·W transform (since ECEF = ITRS, and GCRS is the inertial frame at that epoch).
3. **Topocentric parallax:** Subtract observer GCRS vector from body GCRS vector to get the topocentric direction.
4. **ENU → az/alt:** Project topocentric vector onto local East-North-Up basis, then compute azimuth and altitude.

Atmospheric refraction (Bennett 1982) is applied as a post-processing step on the computed altitude. For the Yallop/Odeh criteria, airless (refraction-free) altitudes are used. For rise/set times and practical "where to look" output, refracted altitudes are used.

See [Observer Model](Observer-Model) for details.

## Two operating modes

**Full mode** (kernel loaded): all features available, DE442S accuracy.

**Lite mode** (no kernel): `getMoonPhase()` only. Uses Meeus Ch. 25 (Sun) and Ch. 47 (Moon) low-accuracy positions. Error is < 1° in ecliptic longitude. Not suitable for crescent sighting reports.

The API is designed so `getMoonPhase()` never throws for missing kernel; it always works.

## Performance design

- Segment index is built once at kernel load time: O(1) lookup by (target, center, ET).
- Chebyshev records are cached per segment (last-used-record cache). Repeated evaluations in the same time interval cost only the polynomial evaluation, not a binary search.
- `Float64Array` for coefficient storage enables V8/SpiderMonkey typed array optimization paths.
- Clenshaw recurrence avoids the instability of naive power series and is numerically identical to the SPICE SPKE02 implementation.
- The rise/set solver samples at 30-minute intervals before applying Brent, meaning each event finder costs ~48 ephemeris evaluations for bracketing plus ~10 iterations of Brent per root. Total per event: ~60–100 evaluations, each taking tens of microseconds.

Target: a full sighting report (sunset + moonset + best-time geometry + Yallop + Odeh) in 5–15 ms on Node.js.

## Error budget

A crescent sighting report's accuracy is limited by the worst source in the chain:

| Source | Contribution |
| ------ | ------------ |
| DE442S position error | < 1 km (~0.001 arcsec at Moon distance) |
| IERS Q·R·W transform (with user-supplied EOP) | < 1 mas |
| IERS Q·R·W transform (polynomial ΔT approximation) | < 5 arcsec |
| WGS84 observer position | < 1 m (negligible in angle) |
| Bennett refraction (standard atmosphere) | < 1 arcmin for alt > 5° |
| Bennett refraction (non-standard conditions) | up to 15 arcmin near horizon |

In practice, refraction uncertainty dominates all other error sources for crescent sighting near the horizon.

---

*Previous: [API Reference](API-Reference) | Next: [Crescent Visibility](Crescent-Visibility)*
