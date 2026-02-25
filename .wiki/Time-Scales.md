# Time Scales

Getting time right is the most error-prone part of an astronomy library. moon-sighting implements a complete conversion chain from the user's familiar UTC input to the internal TDB time argument required by the JPL ephemeris.

## The time scale chain

```text
User input (Date / ISO string)
    │
    ▼
UTC — Coordinated Universal Time
    │ + ΔAT (leap seconds, integer steps)
    ▼
TAI — International Atomic Time
    │ + 32.184 s (exact, by definition)
    ▼
TT  — Terrestrial Time (formerly ET)
    │ + periodic correction (~1.7 ms max)
    ▼
TDB — Barycentric Dynamical Time  ← used by JPL DE442S

Also needed:
UTC + (UT1 - UTC)                 ← from IERS Bulletin A
    ▼
UT1 — Universal Time 1            ← used for Earth Rotation Angle
```

## UTC: Coordinated Universal Time

UTC is the international time standard, synchronized to TAI via occasional leap second insertions. JavaScript's `Date` object stores Unix time (seconds since 1970-01-01 00:00:00 UTC), which is equivalent to UTC ignoring leap seconds.

## TAI: International Atomic Time

TAI = UTC + ΔAT, where ΔAT is the cumulative leap second count. ΔAT grows in 1-second steps whenever the IERS determines that Earth's rotation has slowed enough. As of 2024, ΔAT = 37 seconds.

moon-sighting ships the complete leap-second table (through 2017) and parses the NAIF LSK kernel (`naif0012.tls`) to stay current when the user downloads it.

## TT: Terrestrial Time

TT = TAI + 32.184 seconds exactly. This exact offset is the definition. TT replaced the old Ephemeris Time (ET) designation in IAU 1991; for practical purposes TT and the old ET are identical.

TT is the primary argument for Earth-based positional calculations: precession-nutation series, mean orbital elements, and topocentric corrections all use TT (expressed as Julian centuries from J2000.0).

```text
T = (JD_TT − 2451545.0) / 36525.0   (Julian centuries from J2000.0)
```

## TDB: Barycentric Dynamical Time

TDB is the time coordinate for the JPL ephemeris. It differs from TT by a periodic term (relativistic clock correction for the eccentricity of Earth's orbit) that never exceeds 1.7 milliseconds:

```text
TDB − TT ≈ 0.001658 s × sin(g) + 0.000014 s × sin(2g)
g = 357.53° + 0.9856003° × (JD_TT − 2451545.0)   (Sun's mean anomaly)
```

For crescent sighting purposes this ~1 ms difference is negligible (Moon moves ~30 arcsec/second, so 1 ms → ~0.03 arcsec position error). moon-sighting applies the correction anyway to be consistent with SPICE.

In the SPICE system, the internal time argument is called ET (Ephemeris Time) and is expressed as seconds past J2000.0 TDB:

```text
ET = (JD_TDB − 2451545.0) × 86400.0
```

## UT1: Universal Time 1

UT1 is the measure of Earth's actual rotation angle. It tracks mean solar time at the Greenwich meridian and is needed to compute the Earth Rotation Angle (ERA), which determines the relationship between the inertial celestial frame and the Earth-fixed terrestrial frame.

UT1 differs from UTC by at most ±0.9 seconds (the IERS inserts leap seconds before this threshold is reached). The difference UT1 − UTC is published in IERS Bulletin A, updated weekly.

For applications requiring maximum accuracy, supply the current `ut1utc` value from IERS Bulletin A to `Observer.ut1utc`. This eliminates the primary source of error in the Earth orientation model.

## ΔT: the historical problem

ΔT = TT − UT1 combines the accumulated leap seconds plus the sub-second UT1 − UTC offset. It grows roughly parabolically over historical timescales as Earth's rotation gradually slows.

In 2024, ΔT ≈ 69.2 seconds. The built-in polynomial (Espenak-Meeus) approximates ΔT without IERS data:

- Error within ±5 seconds for 1950–2050
- Error grows to ±30 seconds at 1800 and ±100 seconds at 1600
- Forward extrapolation beyond 2050 is unreliable (ΔT growth rate varies)

For historical crescent analysis (e.g., verifying ancient sightings), the ΔT uncertainty is often the dominant error source, not the ephemeris.

## Julian Day

All internal time arithmetic uses Julian Day (JD), a continuous count of days since noon on January 1, 4713 BC (Julian calendar). This avoids calendar ambiguity and makes time differences trivial.

J2000.0 epoch:

```text
JD = 2451545.0  (2000 Jan 1, 12:00:00 TT)
```

Converting JavaScript Date to JD:

```text
JD(UTC) = Date.getTime() / 86400000 + 2440587.5
```

The constant 2440587.5 is JD for 1970-01-01 00:00:00 UTC.

## Leap-second kernel

The NAIF LSK (`naif0012.tls`) is a plain-text file in NAIF text kernel format. It contains the ΔAT table and the constants needed to compute TDB from TT. moon-sighting parses this file when the user downloads kernels, ensuring the library always reflects the latest leap seconds. The hardcoded table in `time/index.ts` serves as a fallback when no LSK is provided.

---

*Previous: [Ephemeris](Ephemeris) | Next: [Reference Frames](Reference-Frames)*
