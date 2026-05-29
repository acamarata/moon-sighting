# Advanced Usage

## Batch processing multiple nights

```typescript
import { visibility } from 'moon-sighting';

const observer = { lat: 21.39, lng: 39.86, elevation: 277 };

function findFirstVisibleNight(startDate: Date, maxDays = 5) {
  for (let i = 0; i < maxDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const r = visibility({ ...observer, date });
    if (r.visible) return { date, result: r };
  }
  return null;
}
```

## Comparing criteria

Both Yallop and Odeh criteria are supported. They often agree, but can differ near threshold cases:

```typescript
import { visibility } from 'moon-sighting';

const params = {
  date: new Date(2023, 2, 22),
  lat: 40.0,
  lng: -75.0,
  elevation: 100,
};

const yallop = visibility({ ...params, criterion: 'yallop' });
const odeh   = visibility({ ...params, criterion: 'odeh' });

console.log('Yallop visible:', yallop.visible, 'q:', yallop.q?.toFixed(3));
console.log('Odeh visible:',   odeh.visible,   'category:', odeh.category);
```

## Working with the raw angular parameters

The result object includes intermediate angular values for custom analysis:

```typescript
import { visibility } from 'moon-sighting';

const r = visibility({
  date: new Date(2023, 2, 22),
  lat: 21.39,
  lng: 39.86,
  elevation: 277,
});

// Arc of light (ARCL) and arc of vision (ARCV) in degrees
// These are the primary inputs to both the Yallop and Odeh criteria
console.log('ARCL:', r.arcl.toFixed(2), 'deg');
console.log('ARCV:', r.arcv.toFixed(2), 'deg');
console.log('DAZ:', r.daz.toFixed(2), 'deg');
console.log('W:', r.w.toFixed(2), 'arcmin');
```

## Elevation effect

Observer elevation extends the visible horizon slightly. For most land-based observations, the effect on crescent visibility is small (less than a few percent of the q-value). Coastal or mountaintop observations with clear western horizon benefit most.

```typescript
import { visibility } from 'moon-sighting';

const base = { date: new Date(2023, 2, 22), lat: 21.39, lng: 39.86, criterion: 'yallop' };

const seaLevel = visibility({ ...base, elevation: 0 });
const mountain = visibility({ ...base, elevation: 2000 });

console.log('Sea level q:', seaLevel.q?.toFixed(4));
console.log('2000m q:', mountain.q?.toFixed(4));
```

## Time zone handling

`date` is interpreted as a local Date object. For consistent results across environments, construct the date in UTC and adjust for the observer's local sunset time:

```typescript
// March 22, 2023 at 18:30 local time in Mecca (UTC+3 = 15:30 UTC)
const date = new Date(Date.UTC(2023, 2, 22, 15, 30, 0));
const r = visibility({ date, lat: 21.39, lng: 39.86, elevation: 277 });
```

The library computes sunset and moon positions at the provided timestamp. Pass the expected observation time (around sunset) for most accurate results.
