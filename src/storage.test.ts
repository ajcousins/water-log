import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './domain'
import {
  loadDailyTotal,
  loadLastUpdated,
  loadMinMetAt,
  loadSettings,
  clearMinMetAt,
  saveDailyTotal,
  saveLastUpdated,
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

  it('round-trips a Daily Total for a Day', () => {
    const storage = memoryStorage()
    saveDailyTotal(storage, '2026-07-30', 900)
    expect(loadDailyTotal(storage, '2026-07-30')).toBe(900)
    expect(loadDailyTotal(storage, '2026-07-29')).toBe(0)
  })

  it('treats a missing last-updated as null', () => {
    expect(loadLastUpdated(memoryStorage(), '2026-07-30')).toBeNull()
  })

  it('round-trips a last-updated timestamp for a Day', () => {
    const storage = memoryStorage()
    saveLastUpdated(storage, '2026-07-30', 1_722_000_000_000)
    expect(loadLastUpdated(storage, '2026-07-30')).toBe(1_722_000_000_000)
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
