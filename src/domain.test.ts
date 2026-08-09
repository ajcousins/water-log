import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  FILL_TRANSITION_MS,
  addToDailyTotal,
  dailyTotalFromAdjustments,
  exceedsMaximumTarget,
  fillCrossingDelayMs,
  fillThresholdCrossingDelayMs,
  formatClockTime,
  formatDayLabel,
  isToday,
  removeFromDailyTotal,
  shiftDay,
  shouldFireFireworks,
  toDayKey,
  validateSettings,
  vesselFillRatio,
  vesselMarkAmounts,
} from './domain'

describe('Daily Total', () => {
  it('increases by the given amount', () => {
    expect(addToDailyTotal(200, 150)).toBe(350)
  })

  it('floors at 0 when removing more than the total', () => {
    expect(removeFromDailyTotal(200, 400)).toBe(0)
  })

  it('removes without going negative when amount fits', () => {
    expect(removeFromDailyTotal(500, 100)).toBe(400)
  })

  it('is max(0, sum of Adjustments)', () => {
    expect(dailyTotalFromAdjustments([{ amount: 150 }, { amount: 400 }])).toBe(
      550,
    )
    expect(
      dailyTotalFromAdjustments([{ amount: 100 }, { amount: -100 }, { amount: -100 }]),
    ).toBe(0)
    expect(dailyTotalFromAdjustments([])).toBe(0)
  })
})

describe('Fireworks', () => {
  it('fires when an increase lands exactly on the Minimum Target', () => {
    expect(shouldFireFireworks(1400, 1500, 1500)).toBe(true)
  })

  it('fires when an increase passes above the Minimum Target', () => {
    expect(shouldFireFireworks(1400, 1600, 1500)).toBe(true)
  })

  it('does not fire when already at or above the Minimum Target', () => {
    expect(shouldFireFireworks(1500, 1600, 1500)).toBe(false)
  })

  it('does not fire when decreasing past the Minimum Target', () => {
    expect(shouldFireFireworks(1600, 1400, 1500)).toBe(false)
  })

  it('does not fire when staying below the Minimum Target', () => {
    expect(shouldFireFireworks(1000, 1400, 1500)).toBe(false)
  })
})

describe('fillCrossingDelayMs', () => {
  it('returns 0 when the total does not cross the Minimum Target', () => {
    expect(fillCrossingDelayMs(1000, 1400, 1500, 2500)).toBe(0)
  })

  it('returns about half the duration for a midway cross', () => {
    // from 1000→2000 with min 1500 on max 2500: ratios 0.4→0.8, cross 0.6 → 50%
    expect(fillCrossingDelayMs(1000, 2000, 1500, 2500)).toBe(
      Math.round(0.5 * FILL_TRANSITION_MS),
    )
  })

  it('returns a small delay when starting near the Minimum Target', () => {
    // from 1480→2000, min 1500, max 2500: ~3.8% of duration
    expect(fillCrossingDelayMs(1480, 2000, 1500, 2500)).toBe(
      Math.round(((0.6 - 1480 / 2500) / (2000 / 2500 - 1480 / 2500)) * FILL_TRANSITION_MS),
    )
  })

  it('returns delay at the Minimum Target ratio when filling from empty to full', () => {
    // from 0→2500, min 1500: cross at 0.6 → 60% of duration
    expect(fillCrossingDelayMs(0, 2500, 1500, 2500)).toBe(
      Math.round(0.6 * FILL_TRANSITION_MS),
    )
  })
})

describe('fillThresholdCrossingDelayMs', () => {
  it('returns delay when dropping below the Minimum Target', () => {
    // from 2000→1000, min 1500, max 2500: 0.8→0.4, cross 0.6 → 50%
    expect(fillThresholdCrossingDelayMs(2000, 1000, 1500, 2500)).toBe(
      Math.round(0.5 * FILL_TRANSITION_MS),
    )
  })

  it('returns null when staying on the same side of the Minimum Target', () => {
    expect(fillThresholdCrossingDelayMs(1000, 1400, 1500, 2500)).toBeNull()
    expect(fillThresholdCrossingDelayMs(1600, 2000, 1500, 2500)).toBeNull()
  })
})

describe('Settings', () => {
  it('accepts defaults where Minimum Target is below Maximum Target', () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toEqual({ ok: true })
  })

  it('rejects when Minimum Target equals Maximum Target', () => {
    expect(
      validateSettings({
        ...DEFAULT_SETTINGS,
        minimumTarget: 2000,
        maximumTarget: 2000,
      }),
    ).toEqual({ ok: false, error: 'Minimum Target must be less than Maximum Target' })
  })

  it('rejects when Minimum Target is above Maximum Target', () => {
    expect(
      validateSettings({
        ...DEFAULT_SETTINGS,
        minimumTarget: 2500,
        maximumTarget: 1500,
      }),
    ).toEqual({ ok: false, error: 'Minimum Target must be less than Maximum Target' })
  })
})

describe('Vessel', () => {
  it('is empty at 0', () => {
    expect(vesselFillRatio(0, 2500)).toBe(0)
  })

  it('is full at the Maximum Target', () => {
    expect(vesselFillRatio(2500, 2500)).toBe(1)
  })

  it('clamps fill at 1 when Daily Total exceeds Maximum Target', () => {
    expect(vesselFillRatio(3000, 2500)).toBe(1)
  })

  it('marks exceed Maximum Target only when strictly greater', () => {
    expect(exceedsMaximumTarget(2500, 2500)).toBe(false)
    expect(exceedsMaximumTarget(2501, 2500)).toBe(true)
  })

  it('lists 200 ml marks up to Maximum Target', () => {
    expect(vesselMarkAmounts(1000)).toEqual([200, 400, 600, 800, 1000])
  })
})

describe('Day', () => {
  it('formats a Day label like Thu, 30 Jul 2026', () => {
    expect(formatDayLabel(new Date(2026, 6, 30))).toBe('Thu, 30 Jul 2026')
  })

  it('keys a Day as YYYY-MM-DD in local time', () => {
    expect(toDayKey(new Date(2026, 6, 30))).toBe('2026-07-30')
  })

  it('shifts a Day by calendar days', () => {
    expect(toDayKey(shiftDay(new Date(2026, 6, 30), -1))).toBe('2026-07-29')
  })

  it('recognises today in local time', () => {
    const now = new Date(2026, 6, 30, 15, 0, 0)
    expect(isToday(new Date(2026, 6, 30), now)).toBe(true)
    expect(isToday(new Date(2026, 6, 29), now)).toBe(false)
  })
})

describe('formatClockTime', () => {
  it('formats a local 24-hour HH:mm timestamp', () => {
    const at = new Date(2026, 6, 30, 14, 8, 0).getTime()
    expect(formatClockTime(at)).toBe('14:08')
  })

  it('zero-pads single-digit hours and minutes', () => {
    const at = new Date(2026, 6, 30, 9, 5, 0).getTime()
    expect(formatClockTime(at)).toBe('09:05')
  })
})
