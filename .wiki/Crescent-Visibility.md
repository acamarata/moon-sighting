# Crescent Visibility Criteria

The new crescent moon is visible when it has moved far enough from the Sun, climbed high enough above the horizon at sunset, and formed a wide enough arc to overcome sky brightness and atmospheric extinction. No criterion can guarantee a sighting. Real-world results depend on atmospheric clarity, observer acuity, and optical equipment.

moon-sighting implements two complementary published criteria and outputs both simultaneously, so applications can explain the prediction in terms of either model.

## The five geometric quantities

All major crescent criteria reduce to five observational quantities computed at a canonical "best time" shortly after sunset.

### ARCL: Arc of light (elongation)

The angular separation between the Sun and Moon, measured topocentrically (from the observer, not from Earth's center). This is the true elongation. It determines whether a crescent has begun to form at all: below the Danjon limit (roughly 7°), the Moon is too close to the Sun for the illuminated sliver to survive atmospheric and physiological scattering. ARCL drives the crescent width W.

### ARCV: Arc of vision

Moon altitude minus Sun altitude, both computed without refraction ("airless"). When the Sun is below the horizon, this is approximately the Moon's altitude above the horizon. It controls how dark the sky background is at the moment the crescent is observed. A higher ARCV means a darker sky and a more favorable contrast ratio. This is the primary discriminant in both Yallop and Odeh.

### DAZ: Relative azimuth

Sun azimuth minus Moon azimuth. Positive when the Moon is north of the Sun; negative when south. This affects the geometry of the crescent's orientation and how much sky brightness surrounds it, but plays a secondary role in both criteria.

### W: Topocentric crescent width

The linear width of the illuminated crescent in arc minutes. It serves as a proxy for intrinsic crescent brightness: a thicker crescent is easier to see than a thin one at the same ARCV. Both Yallop and Odeh express the minimum detectable ARCV as a polynomial in W. W is geometrically related to ARCL; as elongation grows, the crescent fattens.

### Lag

The time difference in minutes between moonset and sunset. A positive lag means the Moon sets after the Sun, creating a window for observation. The Yallop/Odeh heuristic computes best time as `T_sunset + 4/9 × Lag`.

## Yallop q-test (NAO TN 69, 1997)

Bernard Yallop's criterion was published in 1997 as Royal Greenwich Observatory Technical Note 69. It defined a standard set of computational procedures and produced the q-parameter, a continuous score that maps to six letter categories.

### Formula

```text
q = (ARCV - arcv_min(W')) / 10
```

Where `W'` is the topocentric crescent width in arc minutes and `arcv_min` is the empirically derived polynomial:

```text
arcv_min(W) = 11.8371 - 6.3226·W + 0.7319·W² - 0.1018·W³
```

This polynomial represents the minimum ARCV observed in historical crescent sightings as a function of crescent width. When `q > 0`, the observed ARCV exceeds the historical minimum, meaning the crescent is potentially visible. The division by 10 is a scaling convention; the thresholds are chosen so that the categories span a meaningful range.

### Categories

| Category | q range | Meaning |
| -------- | ------- | ------- |
| A | q > +0.216 | Easily visible to the naked eye |
| B | q > −0.014 | Visible under perfect conditions |
| C | q > −0.160 | May need optical aid to locate; naked eye possible |
| D | q > −0.232 | Optical aid necessary; naked eye not possible |
| E | q > −0.293 | Not visible even with telescope |
| F | q ≤ −0.293 | Below Danjon limit; crescent cannot form |

Category F corresponds to ARCL below roughly 7° (the Danjon limit), where the Moon is geometrically too close to the Sun for the crescent arc to sustain itself.

### W' vs W

Yallop defines two variants of crescent width. The geocentric W uses the semi-diameter of the Moon and Sun at their geocentric distances. The topocentric W' (W-prime) applies a parallax-based correction because the Moon's apparent diameter changes by ~1% between the geocenter and a surface observer at typical latitudes. moon-sighting computes W' directly from the topocentric state vector.

### Implementation notes

- ARCV must be the airless (refraction-free) altitude difference.
- W' must be in arc minutes (the polynomial constants assume this).
- The q thresholds are stated to three decimal places in Yallop's Table 1.

## Odeh criterion (Experimental Astronomy, 2006)

Mohammad Odeh published an updated criterion in 2006 using a larger observational database, including ICOP (Islamic Crescent Observation Project) records collected over multiple decades.

### Odeh formula

```text
V = ARCV - arcv_min(W)
```

The polynomial `arcv_min(W)` is identical to Yallop's formulation. The difference is in the zone boundaries (finer calibration) and in which form of W to use.

```text
V = ARCV - (11.8371 - 6.3226·W + 0.7319·W² - 0.1018·W³)
```

### Zones

| Zone | V range | Meaning |
| ---- | ------- | ------- |
| A | V ≥ 5.65 | Visible with naked eye |
| B | V ≥ 2.00 | Visible with optical aid; may be naked eye under excellent conditions |
| C | V ≥ −0.96 | Visible with optical aid only |
| D | V < −0.96 | Not visible even with optical aid |

### Key differences from Yallop

Odeh provides:

1. **Finer zone boundaries** based on a larger and more systematic observational dataset.
2. **Best-time formula:** the T_b = T_s + 4/9 × Lag expression appears explicitly in Odeh's derivation, though it originates with Yallop.
3. **No F category:** Odeh's Zone D subsumes the Danjon-limit cases.

### Which criterion to trust?

Both criteria agree in the clear cases: large ARCV and wide crescent = visible; very small ARCV or negative W' = not visible. They diverge in the boundary region (Zones B/C, Categories B/C/D), which is inherently uncertain regardless of the model.

In practice, use both: if Yallop says A or B and Odeh says A or B, the crescent is very likely visible. If they disagree near the boundary, treat the result as uncertain and specify weather and optical aid conditions explicitly.

## Best-time computation

### Heuristic (default)

```text
T_b = T_sunset + (4/9) × Lag
```

For a typical 90-minute lag this gives approximately 40 minutes after sunset, which is when the sky has darkened enough for crescent contrast while the Moon is still well above the horizon.

### Optimized (optional)

moon-sighting can scan the interval from sunset to moonset, computing the Odeh V parameter at each step and finding the time that maximizes it. This handles high-latitude cases where the Moon's altitude changes quickly and the heuristic can be significantly off.

## Observation window

The library returns a `bestTimeWindowUTC` of ±20 minutes around the best time, giving observers a practical range to watch for the crescent rather than a single instant.

## Limitations

- Refraction uncertainty dominates below 5° altitude. The Bennett formula assumes a standard atmosphere; real conditions can differ by 5–15 arcminutes near the horizon.
- Atmospheric extinction (aerosols, dust) is not modeled. The Schaefer physics-based approach exists in the literature but is not included in this library.
- Urban light pollution reduces effective visibility but is not accounted for by any criterion.
- Observer acuity varies: the criteria are calibrated for average human vision without optical correction.

## Physics-based model (Schaefer, not included)

The Schaefer (1988, 1991) and Doggett-Schaefer contrast threshold model provides a more rigorous treatment of crescent visibility by computing:

- Sky background luminance at the Moon's position
- Atmospheric extinction as a function of aerosol optical depth
- Crescent surface brightness
- Contrast threshold relative to sky background

This approach requires additional atmospheric inputs (aerosol optical depth, humidity proxy) and produces probabilistic visibility estimates rather than deterministic zones. It is not part of this library, but the Yallop and Odeh criteria remain the standard for practical Islamic calendar work.

---

*Previous: [Architecture](Architecture) | Next: [Ephemeris](Ephemeris)*
