import { DEFAULT_SETTINGS, type Settings } from './domain'

const SETTINGS_KEY = 'water-log:settings'
const TOTALS_KEY = 'water-log:totals'
const UPDATED_AT_KEY = 'water-log:updated-at'

type TotalsMap = Record<string, number>
type UpdatedAtMap = Record<string, number>

export function loadSettings(storage: Storage): Settings {
  const raw = storage.getItem(SETTINGS_KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      minimumTarget: Number(parsed.minimumTarget) || DEFAULT_SETTINGS.minimumTarget,
      maximumTarget: Number(parsed.maximumTarget) || DEFAULT_SETTINGS.maximumTarget,
      small: Number(parsed.small) || DEFAULT_SETTINGS.small,
      large: Number(parsed.large) || DEFAULT_SETTINGS.large,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(storage: Storage, settings: Settings): void {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function loadTotals(storage: Storage): TotalsMap {
  const raw = storage.getItem(TOTALS_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as TotalsMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function loadDailyTotal(storage: Storage, dayKey: string): number {
  const value = loadTotals(storage)[dayKey]
  return typeof value === 'number' && value >= 0 ? value : 0
}

export function saveDailyTotal(
  storage: Storage,
  dayKey: string,
  total: number,
): void {
  const totals = loadTotals(storage)
  totals[dayKey] = total
  storage.setItem(TOTALS_KEY, JSON.stringify(totals))
}

function loadUpdatedAtMap(storage: Storage): UpdatedAtMap {
  const raw = storage.getItem(UPDATED_AT_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as UpdatedAtMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function loadLastUpdated(
  storage: Storage,
  dayKey: string,
): number | null {
  const value = loadUpdatedAtMap(storage)[dayKey]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function saveLastUpdated(
  storage: Storage,
  dayKey: string,
  at: number,
): void {
  const map = loadUpdatedAtMap(storage)
  map[dayKey] = at
  storage.setItem(UPDATED_AT_KEY, JSON.stringify(map))
}
