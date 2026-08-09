import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './domain'
import {
  appendAdjustment,
  loadAdjustments,
  loadDailyTotal,
  loadLastUpdated,
  loadMinMetAt,
  loadSettings,
  clearMinMetAt,
  migrateTotalsToAdjustments,
  saveMinMetAt,
  saveSettings,
} from './storage'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    key() {
      return null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    },
  }
}

describe('persistence', () => {
  it('returns default Settings when nothing is stored', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips Settings', () => {
    const storage = memoryStorage()
    const settings = {
      ...DEFAULT_SETTINGS,
      minimumTarget: 1800,
      small: 200,
    }
    saveSettings(storage, settings)
    expect(loadSettings(storage)).toEqual(settings)
  })

  it('treats a missing Day as 0 ml', () => {
    expect(loadDailyTotal(memoryStorage(), '2026-07-30')).toBe(0)
  })

  it('records Adjustments and derives Daily Total as max(0, sum)', () => {
    const storage = memoryStorage()
    appendAdjustment(storage, '2026-07-30', 150, 1000)
    appendAdjustment(storage, '2026-07-30', 400, 2000)
    expect(loadDailyTotal(storage, '2026-07-30')).toBe(550)
    expect(loadAdjustments(storage, '2026-07-30')).toHaveLength(2)
    expect(loadDailyTotal(storage, '2026-07-29')).toBe(0)
  })

  it('floors Daily Total at 0 when Adjustments sum negative', () => {
    const storage = memoryStorage()
    appendAdjustment(storage, '2026-07-30', 100, 1)
    appendAdjustment(storage, '2026-07-30', -100, 2)
    appendAdjustment(storage, '2026-07-30', -100, 3)
    expect(loadDailyTotal(storage, '2026-07-30')).toBe(0)
  })

  it('migrates a legacy Daily Total into one Adjustment', () => {
    const storage = memoryStorage()
    storage.setItem(
      'water-log:totals',
      JSON.stringify({ '2026-07-30': 900 }),
    )
    storage.setItem(
      'water-log:updated-at',
      JSON.stringify({ '2026-07-30': 1_722_000_000_000 }),
    )
    migrateTotalsToAdjustments(storage)
    expect(loadDailyTotal(storage, '2026-07-30')).toBe(900)
    const adjustments = loadAdjustments(storage, '2026-07-30')
    expect(adjustments).toHaveLength(1)
    expect(adjustments[0]?.amount).toBe(900)
    expect(adjustments[0]?.at).toBe(1_722_000_000_000)
  })

  it('treats a missing last-updated as null', () => {
    expect(loadLastUpdated(memoryStorage(), '2026-07-30')).toBeNull()
  })

  it('uses the latest Adjustment time as last-updated', () => {
    const storage = memoryStorage()
    appendAdjustment(storage, '2026-07-30', 150, 1_000)
    appendAdjustment(storage, '2026-07-30', 50, 5_000)
    expect(loadLastUpdated(storage, '2026-07-30')).toBe(5_000)
    expect(loadLastUpdated(storage, '2026-07-29')).toBeNull()
  })

  it('rewrites and clears Minimum Target met time', () => {
    const storage = memoryStorage()
    expect(loadMinMetAt(storage, '2026-07-30')).toBeNull()
    saveMinMetAt(storage, '2026-07-30', 100)
    expect(loadMinMetAt(storage, '2026-07-30')).toBe(100)
    saveMinMetAt(storage, '2026-07-30', 200)
    expect(loadMinMetAt(storage, '2026-07-30')).toBe(200)
    clearMinMetAt(storage, '2026-07-30')
    expect(loadMinMetAt(storage, '2026-07-30')).toBeNull()
  })
})
