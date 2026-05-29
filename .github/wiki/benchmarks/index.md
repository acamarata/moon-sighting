# Performance Benchmarks

## Computation performance

Measured on Node 22, Apple M2. Input: 100 observer+date combinations.

| Operation | Time |
|---|---|
| `visibility()` — Yallop criterion | ~2.8 ms/call |
| `visibility()` — Odeh criterion | ~2.8 ms/call |
| `visibility()` — changing observer only | ~2.8 ms/call |
| Batch of 30 consecutive nights | ~84 ms total |

The dominant cost is the JPL DE442S ephemeris evaluation (Chebyshev polynomial interpolation). The criterion evaluation (Yallop or Odeh) is negligible by comparison. Switching between criteria has no measurable effect on timing.

For UI use cases, a single call is fast enough to run synchronously. For batch processing (scanning many nights or many locations simultaneously), consider `Promise.all` across concurrent calls or a Worker thread.

## Bundle size

| Module | Min+gz |
|---|---|
| moon-sighting (published package) | ~14 KB |
| DE442S kernel | ~31 MB (downloaded separately, not in npm package) |

The ephemeris kernel is a binary file that users download at runtime (or self-host). It is not bundled in the npm package. See the [Getting Started](../Getting-Started.md) page for setup.

## Reproducing the benchmarks

```typescript
import { visibility } from 'moon-sighting';

const observer = { lat: 21.39, lng: 39.86, elevation: 277 };
const baseDate = new Date(2023, 0, 1);

const dates = Array.from({ length: 100 }, (_, i) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + i);
  return d;
});

const start = performance.now();
for (const date of dates) {
  visibility({ ...observer, date });
}
const elapsed = performance.now() - start;

console.log(`${(elapsed / dates.length).toFixed(1)} ms/call`);
console.log(`${elapsed.toFixed(0)} ms total for ${dates.length} calls`);
```

Run with `node --version` >= 20 after placing the DE442S kernel file in the working directory.
