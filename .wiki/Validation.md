# Validation

moon-calc is validated at multiple levels: kernel parsing, ephemeris evaluation, frame transforms, and full sighting reports. The goal is to make each component independently verifiable against authoritative references.

## Validation philosophy

Crescent visibility criteria depend on a chain of computations, each of which can introduce errors. Validating the end result (Yallop category) alone is insufficient. A wrong category can result from an error in any step. The validation strategy separates:

1. **Ephemeris evaluation:** does the kernel parsing produce the right position?
2. **Frame transforms:** does the IERS chain produce the right ITRS position?
3. **Topocentric position:** does the observer model produce the right az/alt?
4. **Crescent geometry:** do ARCL, ARCV, DAZ, W match reference implementations?
5. **Visibility criteria:** do the q and V parameters match published examples?

## Reference implementations

### SPICE (CSPICE / SpiceyPy)

NASA NAIF's SPICE toolkit is the authoritative reference for reading JPL ephemerides. It is written in C (CSPICE) with Python bindings (SpiceyPy). Using the same kernel (`de442s.bsp`) and the same time/frame arguments, SPICE should produce positions that are bit-identical to moon-calc's output (to double-precision floating-point).

Any deviation in the SPK Chebyshev evaluation from SPICE indicates a parsing or algorithm error in moon-calc.

**How to compare:**
```python
import spiceypy as spice
spice.furnsh('de442s.bsp')
spice.furnsh('naif0012.tls')

# Moon relative to Earth center in J2000 at ET
et = spice.str2et('2025-03-29 20:00:00 UTC')
state, lt = spice.spkezr('301', et, 'J2000', 'NONE', '399')
print(state[:3])  # position in km
```

The moon-calc equivalent:
```ts
const kernel = SpkKernel.fromFile('de442s.bsp')
const ts = computeTimeScales(new Date('2025-03-29T20:00:00Z'))
const state = kernel.getState(NAIF_IDS.MOON, NAIF_IDS.EARTH, jdTTtoET(ts.jdTT))
```

Expected agreement: < 1 meter (floating-point evaluation precision).

### JPL Horizons

JPL Horizons is the online solar system ephemeris service. It uses the same JPL ephemerides and provides tabular output for:
- Apparent RA/Dec and az/alt for any observer and time
- Observer-centered quantities (elongation, illumination, phase angle)
- Rise/transit/set times

Horizons uses SPICE internally, so it represents an independent end-to-end validation of the full pipeline including frame transforms and refraction.

**How to use for validation:**
Go to https://ssd.jpl.nasa.gov/horizons/, select:
- Target body: Moon (or Sun)
- Observer location: user-defined geodetic lat/lon/elevation
- Time span: the date of interest
- Output quantities: Observer az/alt, Illuminated fraction, Elongation

Compare Horizons' output with moon-calc's topocentric az/alt. Differences of < 30 arcseconds indicate the frame transforms are correct.

## Acceptance thresholds

| Quantity | Expected error vs SPICE | Notes |
|----------|------------------------|-------|
| Geocentric position | < 1 m (< 0.001 arcsec) | SPK parsing precision |
| Topocentric az/alt (with EOP) | < 0.1 arcsec | Frame transform precision |
| Topocentric az/alt (polynomial ΔT) | < 30 arcsec | ΔT polynomial error |
| ARCL | < 1 arcsec | Derived from positions |
| ARCV | < 30 arcsec | Dominated by ΔT uncertainty |
| Yallop q | < 0.005 | q is dimensionless; <0.005 difference = same category in most cases |
| Sunset/moonset | < 10 seconds | Root-finding convergence |

## Validation suite

The test harness will:

1. Load `de442s.bsp` and evaluate Moon/Sun states at 1000 randomly sampled times within 1849–2150.
2. Compare each result against SPICE output for the same kernel, time, and frames.
3. For 50 geographically diverse locations × 12 months, compute full sighting reports and compare ARCL, ARCV, DAZ, W, q, and V against reference implementations.
4. For the same 50 locations, compare Horizons tabular output with moon-calc's az/alt at the same times.

The suite is run in CI on major releases. Raw comparison data (SPICE reference outputs) is stored as CSV files in the test fixtures directory.

## Spot-check cases

Historical crescent sightings from the ICOP database can serve as sanity checks. A positive sighting report from ICOP should correspond to Yallop A or B, and Odeh A or B, at the recording location and date. A failed sighting should correspond to Yallop C–F / Odeh C–D.

Be cautious: ICOP records include weather and observer acuity information that the criteria cannot account for. A clear Zone A (easily visible) sighting that was missed due to clouds or poor horizon is not a failure of the criterion.

## Known limitations

**Near-horizon refraction.** The Bennett formula assumes standard atmospheric conditions. At altitudes below 3°, real refraction can vary by ±20% from the standard value. The validation harness cannot test this without actual atmospheric measurements.

**Historical delta-T.** For dates before 1800, the Espenak-Meeus polynomial error can exceed 1 minute. Sighting analysis for ancient dates requires user-supplied ΔT from Morrison & Stephenson or similar.

**Polar and extreme latitudes.** In Arctic regions, the Sun can be below the horizon for days or weeks. The event finder handles circumpolar conditions (no rise or set during the search window) by returning null for the missing events.

---

*Previous: [Observer Model](Observer-Model) | Next: [API Reference](API-Reference)*
