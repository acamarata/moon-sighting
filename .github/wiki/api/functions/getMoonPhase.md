[**moon-sighting v1.1.1**](../README.md)

***

[moon-sighting](../README.md) / getMoonPhase

# Function: getMoonPhase()

> **getMoonPhase**(`date?`): [`MoonPhaseResult`](../interfaces/MoonPhaseResult.md)

Defined in: [api/index.ts:487](https://github.com/acamarata/moon-sighting/blob/89fb490051d0263a7d41c954161fb945f1569805/src/api/index.ts#L487)

Compute the Moon's current phase, illumination, and next phase times.

Works WITHOUT a kernel (uses Meeus approximation).

## Parameters

### date?

`Date` = `...`

Date to compute phase for (default: now)

## Returns

[`MoonPhaseResult`](../interfaces/MoonPhaseResult.md)

MoonPhaseResult with illumination, phase name, age, and next events

## Example

```ts
const phase = getMoonPhase(new Date())
console.log(phase.phase)       // 'waxing-crescent'
console.log(phase.phaseName)   // 'Waxing Crescent'
console.log(phase.phaseSymbol) // '🌒'
console.log(phase.illumination)// 14.3 (percent)
console.log(phase.nextFullMoon)// Date object
```
