# Observer Model and Refraction

## WGS84 ellipsoid

The library uses the WGS84 (World Geodetic System 1984) reference ellipsoid, which is the standard for GPS coordinates, Google Maps, and most modern mapping systems.

Key constants:
```
a = 6378137.0 m        (semi-major axis, equatorial radius)
1/f = 298.257223563    (inverse flattening)
b = a × (1 − f)        (semi-minor axis, polar radius ≈ 6356752 m)
e² = 2f − f²           (first eccentricity squared ≈ 0.00669438)
```

The shape is an oblate spheroid: slightly wider at the equator than at the poles (~21 km difference).

## Geodetic to ECEF

Given geodetic latitude φ (degrees, north positive), longitude λ (degrees, east positive), and height h (meters above ellipsoid):

```
N(φ) = a / sqrt(1 − e² sin²φ)   (prime vertical radius of curvature)

X = (N + h) cos φ cos λ
Y = (N + h) cos φ sin λ
Z = (N(1 − e²) + h) sin φ
```

The result is in meters in the ECEF (Earth-Centered, Earth-Fixed) frame, which is identical to the ITRS (International Terrestrial Reference System) at a given epoch.

Note: geodetic latitude φ is NOT the same as geocentric latitude. For a point on the equator (φ = 0°), both agree. At φ = 45°, the geocentric latitude is about 0.2° less. The distinction matters because the Moon's parallax correction (topocentric vs geocentric position) depends on the observer's actual 3D position.

## ECEF to geodetic

The inverse transformation (ECEF → geodetic) uses Bowring's iterative method, which converges in 2–3 iterations to full double-precision accuracy. This is needed when mapping ECEF coordinates back to lat/lon.

## Local ENU basis

The local East-North-Up (ENU) frame is the observer's natural coordinate system. Its basis vectors in ECEF are:

```
East  = (−sin λ, cos λ, 0)
North = (−sin φ cos λ, −sin φ sin λ, cos φ)
Up    = (cos φ cos λ, cos φ sin λ, sin φ)
```

These are unit vectors. To convert a topocentric ECEF displacement Δ (in meters) to ENU:
```
e = East · Δ
n = North · Δ
u = Up · Δ
```

## ENU to azimuth/altitude

```
azimuth = atan2(e, n)    [radians, convert to degrees, normalize to [0°, 360°)]
altitude = atan2(u, sqrt(e² + n²))   [degrees]
```

Azimuth is measured from North, clockwise: 0° = North, 90° = East, 180° = South, 270° = West.

Altitude is the angle above the horizontal plane: 0° = horizon, 90° = zenith, negative = below horizon.

## Topocentric parallax

The Moon's geocentric position (from the ephemeris) differs from its topocentric position (as seen by a surface observer) because the Moon is close enough that the baseline between Earth's center and the observer's surface position is significant. This is the diurnal parallax.

The correction is simply:
```
topocentric_direction = moon_ITRS − observer_ITRS
```

The Moon's horizontal parallax is approximately 57 arcminutes, meaning the topocentric and geocentric azimuths can differ by up to ~57' (about 1°). For the Sun, the parallax is ~8.7 arcseconds, small but not negligible.

## Atmospheric refraction

The atmosphere bends light from celestial objects upward as they approach the horizon, making them appear higher than their geometric position. The effect is:

- ~34 arcminutes at the geometric horizon (altitude = 0°)
- ~10 arcminutes at altitude 5°
- ~1 arcminute at altitude 20°
- ~0.1 arcminute above 45°

### Bennett (1982) formula

The Bennett formula is the standard practical approximation, accepted by the IAU and widely used in software:

```
R = cot(h + 7.31 / (h + 4.4)) / 60   [degrees]
```

Where h is the geometric (airless) altitude in degrees, and R is the refraction correction to add to h. The constants were derived by fitting to observational data.

With pressure P (millibars) and temperature T (Celsius) corrections:

```
R_actual = R × (P / 1010) × (283 / (273 + T))
```

Standard conditions: P = 1013.25 mbar, T = 15°C. The correction factors adjust for non-standard density.

### Accuracy limits

The Bennett formula is accurate to:
- ~0.1 arcminute for h > 5°
- ~0.5 arcminute for h = 2°–5°
- ~1–2 arcminutes for h < 2°
- Fails below h ≈ −0.5° (below the geometric horizon, refraction becomes strongly non-linear)

In practice, the dominant uncertainty near the horizon is atmospheric variability: temperature inversions, humidity gradients, and dust can shift refraction by 5–15 arcminutes from the standard formula. No formula based solely on pressure and temperature can capture this.

This is why crescent sighting criteria use "airless" (refraction-free) altitudes for ARCV: the criteria were calibrated from historical observations without correcting individual atmospheric conditions, so applying a standard refraction would introduce a systematic bias.

### When to apply refraction

| Use case | Mode |
|----------|------|
| Yallop ARCV input | Airless |
| Odeh ARCV input | Airless |
| Sunset/moonset threshold | Standard refraction |
| "Where to look" altitude output | Standard refraction |
| Civil/nautical/astronomical twilight | Standard refraction |

moon-sighting computes both airless and apparent altitudes for each body position and uses the appropriate one for each purpose.

---

*Previous: [Reference Frames](Reference-Frames) | Next: [Validation](Validation)*
