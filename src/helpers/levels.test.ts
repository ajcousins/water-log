import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getLevelStatus } from './levels'

/** Target equal to pace span (840) so expected ml amounts are exact integers. */
const TARGET = 840

function setClock(hours: number, minutes = 0) {
  vi.setSystemTime(new Date(2026, 0, 15, hours, minutes, 0))
}

describe('getLevelStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns met when current reaches the target', () => {
    setClock(15)
    expect(getLevelStatus(TARGET, TARGET)).toBe('met')
    expect(getLevelStatus(TARGET + 100, TARGET)).toBe('met')
  })

  it('returns good at 6am or earlier regardless of intake', () => {
    setClock(6)
    expect(getLevelStatus(0, TARGET)).toBe('good')

    setClock(5, 30)
    expect(getLevelStatus(0, TARGET)).toBe('good')
  })

  describe('at 13:00 (halfway on the good pace line)', () => {
    beforeEach(() => setClock(13))

    it('returns good at or above 50% of target', () => {
      expect(getLevelStatus(420, TARGET)).toBe('good')
      expect(getLevelStatus(500, TARGET)).toBe('good')
    })

    it('returns low between the low and good pace lines', () => {
      // low expects (13:00 - 9:00) / 14h = 240/840
      expect(getLevelStatus(240, TARGET)).toBe('low')
      expect(getLevelStatus(419, TARGET)).toBe('low')
    })

    it('returns very low below the low pace line', () => {
      expect(getLevelStatus(239, TARGET)).toBe('very-low')
      expect(getLevelStatus(0, TARGET)).toBe('very-low')
    })
  })

  describe('pace lines shifted by 3 hours', () => {
    it('at 10:00, good needs ~29% and low needs ~7%', () => {
      setClock(10)
      // good: (10:00 - 6:00) / 14h = 240/840
      // low:  (10:00 - 9:00) / 14h = 60/840
      expect(getLevelStatus(240, TARGET)).toBe('good')
      expect(getLevelStatus(239, TARGET)).toBe('low')
      expect(getLevelStatus(60, TARGET)).toBe('low')
      expect(getLevelStatus(59, TARGET)).toBe('very-low')
    })

    it('at 9:00 with 0%, returns low (low line still at 0%)', () => {
      setClock(9)
      expect(getLevelStatus(0, TARGET)).toBe('low')
    })

    it('at 12:00 with 0%, returns very low', () => {
      setClock(12)
      expect(getLevelStatus(0, TARGET)).toBe('very-low')
    })
  })

  it('after 8pm, good requires the full target (otherwise low/very low by shifted lines)', () => {
    setClock(20)
    expect(getLevelStatus(TARGET - 1, TARGET)).toBe('low')

    // low line reaches 100% at 11pm; at 8pm low expects 11/14 of target
    const lowExpected = (20 * 60 - 9 * 60)
    expect(getLevelStatus(lowExpected, TARGET)).toBe('low')
    expect(getLevelStatus(lowExpected - 1, TARGET)).toBe('very-low')
  })
})
