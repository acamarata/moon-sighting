# Ephemeris

## What is DE442S?

DE442 is the current JPL planetary ephemeris, integrated in May 2024. It incorporates Uranus occultation data and additional spacecraft ranging from Mars orbiters and Juno (Jupiter). DE442S is the "short" variant, covering 1849-12-26 to 2150-01-22 (TDB) and weighing 31 MB, practical for download and distribution.

The full DE442 file covers a much longer time span (~114 MB) and is not needed for moon sighting applications. For dates before 1849 or after 2150, you would need the full kernel.

The kernel is distributed by NASA's Navigation and Ancillary Information Facility (NAIF) at:
`https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp`

## SPK file format

SPK (Spacecraft and Planet Kernel) files use the DAF (Double Precision Array File) binary format. DAF is a flexible array-of-records format designed by NAIF for efficient random access.

### File structure

```
├── File record (1024 bytes)
│     Magic: 'NAIF/DAF'
│     ND: number of double-precision summary components (2 for SPK)
│     NI: number of integer summary components (6 for SPK)
│     FWARD: record number of first summary record
│     BWARD: record number of last summary record
│
├── Summary record 1 (1024 bytes)
│     Next/Prev record pointers
│     N: count of summaries in this record
│     [Summary 1: 2 doubles + 6 ints per segment]
│       doubles: start_ET, end_ET
│       ints: target, center, frame, type, begin_addr, end_addr
│
├── Summary record 2 ...
│
└── Data records (variable, Chebyshev coefficients)
```

### Endianness

NAIF kernels are created on the platform that generated them (typically IEEE little-endian for modern kernels). The file record contains an endianness flag; moon-calc reads this and byte-swaps doubles as needed.

### Summary record navigation

Summary records form a doubly-linked list. FWARD and BWARD in the file record give the first and last summary record numbers. Each summary record links to the next via its header. Segment index construction reads all summary records at load time.

## SPK segment types

DE442S uses Type 2 (Chebyshev polynomial position) for all planetary segments.

### Type 2: Chebyshev position-only

Each record covers a fixed time interval and stores coefficients for X, Y, Z:

```
[0]        = MID    (interval midpoint, ET seconds past J2000)
[1]        = RADIUS (interval half-width, seconds)
[2..n+1]   = X Chebyshev coefficients C_0..C_n
[n+2..2n+1] = Y Chebyshev coefficients C_0..C_n
[2n+2..3n+1] = Z Chebyshev coefficients C_0..C_n
```

The polynomial degree n is derived from RSIZE (record size in doubles):
```
n = (RSIZE - 2) / 3 - 1
```

Velocity is computed by differentiating the Chebyshev polynomial analytically (using the recurrence relation for Chebyshev derivatives), not by finite differencing.

### Type 3: Chebyshev position + velocity

Type 3 stores separate Chebyshev fits for position and velocity. The structure has 6 coefficient arrays (X, Y, Z for position; X, Y, Z for velocity). Used for some satellite ephemerides; moon-calc implements it for forward compatibility.

## Chebyshev evaluation

The Clenshaw recurrence evaluates a degree-n Chebyshev series in O(n) operations with good numerical stability:

```
Evaluate T_k(x) for x ∈ [-1, 1]:

b_{n+1} = 0
b_{n+2} = 0
for k = n downto 0:
    b_k = c_k + 2x·b_{k+1} - b_{k+2}
result = (b_0 - b_2) / 2  [for standard Clenshaw]
```

For moon-calc's implementation (where the constant term c_0 appears differently), we use the SPICE convention:

```
result = c_0 + x·b_1 - b_2
```

This produces the position. Velocity requires the derivative d(result)/dt, computed via the Chebyshev derivative recurrence, not by finite differencing, which would lose accuracy.

Transforming from normalized domain back to physical time:
```
x = (et - MID) / RADIUS
dx/dt = 1/RADIUS
d(result)/dt = d(result)/dx · dx/dt
```

## Segment chaining

DE442S does not provide Moon-relative-to-Earth directly. It provides:

```
Moon (301) relative to Earth-Moon Barycenter (3)
Earth (399) relative to Earth-Moon Barycenter (3)
Earth-Moon Barycenter (3) relative to SSB (0)
Sun (10) relative to SSB (0)
```

The required vectors are assembled by vector addition:

```
Moon relative to Earth = [Moon - EMB] - [Earth - EMB]
Sun relative to Earth  = [Sun - SSB] - [EMB - SSB] - [Earth - EMB]
                                       (Earth relative to SSB)
```

The SPK kernel class handles this automatically via a `getState(target, center, et)` interface that recursively chains segments.

## Kernel acquisition

The library supports four acquisition modes:

**auto** (default): Downloads from NAIF on first use, caches locally, verifies by SHA-256. The checksum is bundled in the library and corresponds to the NAIF distribution as of the library release.

**file**: Provide a local path. Useful when the kernel is already downloaded or for offline environments.

**buffer**: Provide an `ArrayBuffer`. Works in browsers and any runtime. The user is responsible for fetching the kernel.

**url**: Provide a custom URL. The library streams the download and verifies the checksum.

## Performance

On first load, the segment index is built in one pass over the summary records. This is fast (~5 ms for DE442S). The data records are not read at load time; they are accessed on demand.

Subsequent calls cache the last-used Chebyshev record per segment, so repeated evaluations in the same time interval cost only the polynomial evaluation (~microseconds).

For batch evaluation (e.g., scanning 1000 times across a year for calendar generation), the segment cache means most evaluations hit the same record and incur no I/O. The total cost scales with the number of distinct time intervals, not the number of evaluations.

## Verification

moon-calc's ephemeris evaluations can be verified against:

1. **SPICE:** the reference implementation from NAIF. Using the same kernel and the same (target, center, frame, ET) arguments, SPICE should produce identical results (to floating-point precision) because both use the same binary data and the same Chebyshev algorithm.

2. **JPL Horizons:** NASA's online ephemeris service, which uses the same JPL ephemerides. Provides tabular output for arbitrary times and locations.

See [Validation](Validation) for the test methodology.

---

*Previous: [Crescent Visibility](Crescent-Visibility) | Next: [Time Scales](Time-Scales)*
