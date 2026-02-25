# Reference Frames

## The problem

The JPL ephemeris gives Moon and Sun positions in the ICRF (International Celestial Reference Frame), an inertial frame aligned to distant quasars. An observer on Earth's surface needs positions in the local horizon frame (azimuth and altitude). Getting from one to the other requires knowing exactly how Earth is oriented in inertial space at the moment of observation.

## The IERS Q·R·W chain

The IERS Conventions (2010) define the standard transformation:

```
[ITRS] = W(t) · R(t) · Q(t) · [GCRS]
```

Where:
- **GCRS** = Geocentric Celestial Reference System (essentially the inertial J2000 frame at Earth's center)
- **ITRS** = International Terrestrial Reference System (Earth-fixed frame, rotates with the solid Earth)
- **Q(t)** = celestial motion matrix (precession + nutation)
- **R(t)** = Earth rotation matrix
- **W(t)** = polar motion matrix

The matrices are applied right-to-left: first Q (inertial → intermediate frame), then R (apply Earth's rotation), then W (correct for pole wobble).

## Q(t): Celestial motion

Q(t) captures the slow drift of Earth's rotation axis due to gravitational torques from the Moon and Sun (precession, ~26,000-year period) and higher-frequency oscillations (nutation, dominant period ~18.6 years).

The IAU 2006 precession model and IAU 2000A nutation model together parameterize Q(t) via three quantities:

- **X, Y:** celestial intermediate pole (CIP) coordinates in radians
- **s:** CIO locator, a small angle that ensures continuity of the CIO position

The CIP X,Y series has:
- A polynomial part (degree 5 in T = Julian centuries from J2000.0)
- 1,306 luni-solar nutation terms
- 687 planetary nutation terms

This is the largest tabular computation in the library. The IAU 2000B model reduces to 77 terms with < 1 milliarcsecond error, an option for lower-accuracy "lite" builds.

The Q matrix from X, Y, s (from IERS Conventions eq. 5.7):

```
Q = Q₁ · Rz(s)
```

Where Q₁ is built from X and Y directly using the exact (non-small-angle) formula, and Rz(s) rotates by the small CIO locator angle s (< 1 arcsec throughout the century).

## R(t): Earth rotation

R(t) is a simple rotation about the CIP (z-axis direction) by the Earth Rotation Angle:

```
ERA(UT1) = 2π × (0.7790572732640 + 1.00273781191135448 × Du)
Du = JD(UT1) − 2451545.0
```

ERA replaced Greenwich Mean Sidereal Time (GMST) in the IAU 2000 model. It is defined directly from UT1 (Earth's rotation) rather than being derived from precession and nutation models, which is conceptually cleaner.

The rate multiplier 1.00273781191135448 (slightly more than 1 revolution per solar day) accounts for Earth's orbital motion around the Sun.

## W(t): Polar motion

The Earth's rotation pole (CIP) does not coincide exactly with the conventional terrestrial pole. The wobble (Chandler wobble + annual wobble + longer-period terms) is described by two angles:

- **xp:** pole x-offset in arcseconds (toward 0° longitude)
- **yp:** pole y-offset in arcseconds (toward 270° longitude)

Typical magnitudes: ≤ 0.3 arcseconds. At the Earth's surface, this introduces errors of < 30 meters if ignored, negligible for crescent sighting work (Moon angular diameter ~0.5°).

moon-sighting defaults to xp = yp = 0. Supply current values from IERS Bulletin A for maximum accuracy.

## IAU 2000A vs 2000B

| Feature | 2000A | 2000B |
|---------|-------|-------|
| Luni-solar terms | 1,306 | 77 |
| Planetary terms | 687 | 0 |
| Max error | < 0.1 mas | < 1 mas |
| Computation | ~2× slower | fast |
| Suitable for | moon sighting | approximate work |

For crescent sighting at the horizon where refraction dominates, 2000B is more than sufficient. moon-sighting defaults to 2000A for correctness; 2000B will be available as a compile-time option for size-sensitive builds.

## From GCRS to local alt/az

After applying Q·R·W:

1. **GCRS → ITRS**: Apply Q, R, W to get Earth-fixed Cartesian coordinates.
2. **Observer ECEF position**: Computed from WGS84 geodetic coordinates.
3. **Topocentric vector**: Subtract observer ECEF from body ECEF (in ITRS). The result is the geocentric vector reduced to the observer's position, the topocentric parallax correction.
4. **ECEF → ENU**: Project the topocentric vector onto the observer's local East-North-Up basis.
5. **ENU → az/alt**: Azimuth = atan2(east, north); altitude = atan2(up, horizontal_distance).

See [Observer Model](Observer-Model) for the WGS84 and ENU computation details.

## Accuracy

With user-supplied EOP (Earth orientation parameters from IERS Bulletin A):
- Azimuth/altitude accuracy: < 0.1 arcsecond (dominated by nutation model error)

With polynomial ΔT approximation (no user EOP):
- Azimuth/altitude accuracy: typically < 5 arcseconds, occasionally up to ~30 arcseconds in pathological ΔT errors

For comparison, the Moon's angular diameter is ~1800 arcseconds, and refraction uncertainty near the horizon is 600–900 arcseconds. The frame transform is not the limiting factor for crescent sighting.

---

*Previous: [Time Scales](Time-Scales) | Next: [Observer Model](Observer-Model)*
