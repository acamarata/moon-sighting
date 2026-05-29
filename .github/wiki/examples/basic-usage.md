# Basic Usage Examples

## Basic crescent visibility check

```typescript
import { visibility } from 'moon-sighting';

const result = visibility({
  date: new Date(2023, 2, 22),  // March 22, 2023 (month is 0-indexed)
  lat: 21.39,
  lng: 39.86,
  elevation: 277,
});

console.log(result.visible);    // true or false
console.log(result.q?.toFixed(3));  // Yallop q-value, e.g. '0.216'
```

## Use Odeh criterion

```typescript
import { visibility } from 'moon-sighting';

const result = visibility({
  date: new Date(2023, 2, 22),
  lat: 40.0,
  lng: -75.0,
  elevation: 100,
  criterion: 'odeh',
});

console.log(result.visible);    // true or false
console.log(result.category);   // Odeh category string
```

## Check visibility from multiple cities

```typescript
import { visibility } from 'moon-sighting';

const newMoonDate = new Date(2023, 2, 22);

const cities = [
  { name: 'Mecca',    lat: 21.39, lng: 39.86, elevation: 277 },
  { name: 'London',   lat: 51.51, lng: -0.13, elevation: 11  },
  { name: 'New York', lat: 40.71, lng: -74.00, elevation: 10 },
  { name: 'Karachi',  lat: 24.86, lng: 67.01, elevation: 13  },
];

for (const city of cities) {
  const r = visibility({ ...city, date: newMoonDate });
  console.log(`${city.name}: ${r.visible ? 'visible' : 'not visible'} (q=${r.q?.toFixed(3)})`);
}
```

## Scan multiple nights for first visibility

```typescript
import { visibility } from 'moon-sighting';

function findFirstVisible(observer: { lat: number; lng: number; elevation: number }, startDate: Date, maxDays = 5) {
  for (let i = 0; i < maxDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const r = visibility({ ...observer, date });
    if (r.visible) {
      return { date, result: r };
    }
  }
  return null;
}

const observer = { lat: 21.39, lng: 39.86, elevation: 277 };
const startDate = new Date(2023, 2, 21);  // March 21, 2023

const firstVisible = findFirstVisible(observer, startDate);
if (firstVisible) {
  console.log('First visible:', firstVisible.date.toDateString());
  console.log('q-value:', firstVisible.result.q?.toFixed(3));
}
```

## CJS usage

```javascript
const { visibility } = require('moon-sighting');

const result = visibility({
  date: new Date(2023, 2, 22),
  lat: 21.39,
  lng: 39.86,
  elevation: 277,
});

console.log(result.visible);
```
