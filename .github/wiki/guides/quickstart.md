# Quick Start

This guide covers the most common use cases in moon-sighting.

## Installation

```bash
pnpm add moon-sighting
```

No peer dependencies. The JPL DE442S ephemeris is bundled.

## Check crescent visibility for a specific date and location

```typescript
import { visibility } from 'moon-sighting';

const result = visibility({
  date: new Date(2023, 2, 22), // March 22, 2023 — evening of 29 Sha'ban 1444
  lat: 21.3891,                 // Mecca, Saudi Arabia
  lng: 39.8579,
  elevation: 277,               // meters above sea level
});

console.log(result.criterion);   // 'yallop' (default)
console.log(result.visible);     // true or false
console.log(result.q);           // Yallop q-value
console.log(result.category);    // 'A' through 'F' (Yallop) or 0/1/2 (Odeh)
```

## Use the Odeh criterion

```typescript
import { visibility } from 'moon-sighting';

const result = visibility({
  date: new Date(2023, 2, 22),
  lat: 51.5,
  lng: -0.12,
  criterion: 'odeh',
});

console.log(result.category); // 0=invisible, 1=optical aid, 2=naked eye
```

## Batch: check a range of dates

```typescript
import { visibility } from 'moon-sighting';

const observer = { lat: 40.71, lng: -74.01, elevation: 10 };

// Check every night for 5 days
const dates = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(2023, 2, 20);
  d.setDate(d.getDate() + i);
  return d;
});

for (const date of dates) {
  const r = visibility({ ...observer, date });
  console.log(`${date.toDateString()}: visible=${r.visible}, q=${r.q?.toFixed(3)}`);
}
```

## CommonJS

```js
const { visibility } = require('moon-sighting');

const result = visibility({
  date: new Date(2023, 2, 22),
  lat: 21.39,
  lng: 39.86,
});

console.log(result.visible);
```

## Result fields

| Field       | Type      | Description                                          |
| ----------- | --------- | ---------------------------------------------------- |
| `visible`   | `boolean` | Whether the crescent is likely visible               |
| `criterion` | `string`  | `'yallop'` or `'odeh'`                               |
| `q`         | `number`  | Yallop q-value (only when criterion is `'yallop'`)   |
| `category`  | `string`  | Yallop A-F or Odeh 0/1/2 category                   |
| `arcl`      | `number`  | Arc of light (degrees)                               |
| `arcv`      | `number`  | Arc of vision (degrees)                              |
| `daz`       | `number`  | Relative azimuth (degrees)                           |
| `w`         | `number`  | Crescent width (arcminutes)                          |

## Next steps

- [API Reference](API-Reference) for the full input/output schema
- [Crescent Visibility](Crescent-Visibility) for a detailed explanation of the Yallop and Odeh criteria
- [Observer Model](Observer-Model) for how observer location affects calculations
