import { DEFAULT_SETTINGS, type Settings } from './domain'

const SETTINGS_KEY = 'water-log:settings'
const TOTALS_KEY = 'water-log:totals'

type TotalsMap = Record<string, number>

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
