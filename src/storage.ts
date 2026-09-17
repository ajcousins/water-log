import {
  dailyTotalFromAdjustments,
  DEFAULT_SETTINGS,
  MAX_PRESET_LABEL_LENGTH,
  MAX_PRESETS,
  type Adjustment,
  type Preset,
  type Settings,
} from './domain'

const SETTINGS_KEY = 'water-log:settings'
const TOTALS_KEY = 'water-log:totals'
const ADJUSTMENTS_KEY = 'water-log:adjustments'
const UPDATED_AT_KEY = 'water-log:updated-at'
const MIN_MET_AT_KEY = 'water-log:min-met-at'
const MIGRATED_KEY = 'water-log:adjustments-migrated'
const OUTBOUND_KEY = 'water-log:outbound-adjustments'

type TotalsMap = Record<string, number>
type AdjustmentsMap = Record<string, Adjustment[]>
type TimestampMap = Record<string, number>

type LegacySettingsJson = {
  minimumTarget?: unknown
  maximumTarget?: unknown
  presets?: unknown
  small?: unknown
  large?: unknown
}

function cloneDefaultSettings(): Settings {
  return {
    minimumTarget: DEFAULT_SETTINGS.minimumTarget,
    maximumTarget: DEFAULT_SETTINGS.maximumTarget,
    presets: DEFAULT_SETTINGS.presets.map((preset) => ({ ...preset })),
  }
}

function parsePresetList(value: unknown): Preset[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  if (value.length > MAX_PRESETS) return null
  const presets: Preset[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const record = item as { label?: unknown; amount?: unknown }
    if (typeof record.label !== 'string') return null
    const label = record.label.trim()
    if (label.length === 0 || label.length > MAX_PRESET_LABEL_LENGTH) return null
    if (seen.has(label)) return null
    seen.add(label)
    const amount = Number(record.amount)
    if (!Number.isInteger(amount) || amount <= 0) return null
    presets.push({ label, amount })
  }
  return presets
}

export function loadSettings(storage: Storage): Settings {
  const raw = storage.getItem(SETTINGS_KEY)
  if (!raw) return cloneDefaultSettings()
  try {
    const parsed = JSON.parse(raw) as LegacySettingsJson
    const minimumTarget =
      Number(parsed.minimumTarget) || DEFAULT_SETTINGS.minimumTarget
    const maximumTarget =
      Number(parsed.maximumTarget) || DEFAULT_SETTINGS.maximumTarget

    const fromList = parsePresetList(parsed.presets)
    if (fromList) {
      return { minimumTarget, maximumTarget, presets: fromList }
    }

    const small = Number(parsed.small)
    const large = Number(parsed.large)
    if (
      Number.isInteger(small) &&
      small > 0 &&
      Number.isInteger(large) &&
      large > 0
    ) {
      const migrated: Settings = {
        minimumTarget,
        maximumTarget,
        presets: [
          { label: 'Small', amount: small },
          { label: 'Large', amount: large },
        ],
      }
      saveSettings(storage, migrated)
      return migrated
    }

    return cloneDefaultSettings()
  } catch {
    return cloneDefaultSettings()
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

function loadAdjustmentsMap(storage: Storage): AdjustmentsMap {
  const raw = storage.getItem(ADJUSTMENTS_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as AdjustmentsMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveAdjustmentsMap(storage: Storage, map: AdjustmentsMap): void {
  storage.setItem(ADJUSTMENTS_KEY, JSON.stringify(map))
}

function loadTimestampMap(storage: Storage, key: string): TimestampMap {
  const raw = storage.getItem(key)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as TimestampMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadTimestamp(storage: Storage, key: string, dayKey: string): number | null {
  const value = loadTimestampMap(storage, key)[dayKey]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function saveTimestamp(
  storage: Storage,
  key: string,
  dayKey: string,
  at: number,
): void {
  const map = loadTimestampMap(storage, key)
  map[dayKey] = at
  storage.setItem(key, JSON.stringify(map))
}

function newAdjustmentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `adj-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** One-time: convert legacy per-Day totals into a single Adjustment each. */
export function migrateTotalsToAdjustments(storage: Storage): void {
  if (storage.getItem(MIGRATED_KEY) === '1') return

  const totals = loadTotals(storage)
  const map = loadAdjustmentsMap(storage)
  const updatedAt = loadTimestampMap(storage, UPDATED_AT_KEY)
  let changed = false

  for (const [dayKey, total] of Object.entries(totals)) {
    if (typeof total !== 'number' || !Number.isFinite(total) || total <= 0) continue
    const existing = map[dayKey]
    if (existing && existing.length > 0) continue
    const at =
      typeof updatedAt[dayKey] === 'number' && Number.isFinite(updatedAt[dayKey])
        ? updatedAt[dayKey]
        : Date.now()
    map[dayKey] = [{ id: newAdjustmentId(), amount: total, at }]
    changed = true
  }

  if (changed) saveAdjustmentsMap(storage, map)
  storage.setItem(MIGRATED_KEY, '1')
}

export function loadAdjustments(storage: Storage, dayKey: string): Adjustment[] {
  migrateTotalsToAdjustments(storage)
  const list = loadAdjustmentsMap(storage)[dayKey]
  return Array.isArray(list) ? list : []
}

/** All local Adjustments across Days, each tagged with its dayKey. */
export function loadAllAdjustments(
  storage: Storage,
): Array<Adjustment & { dayKey: string }> {
  migrateTotalsToAdjustments(storage)
  const map = loadAdjustmentsMap(storage)
  const result: Array<Adjustment & { dayKey: string }> = []
  for (const [dayKey, list] of Object.entries(map)) {
    if (!Array.isArray(list)) continue
    for (const adjustment of list) {
      result.push({ ...adjustment, dayKey })
    }
  }
  return result
}

export function appendAdjustment(
  storage: Storage,
  dayKey: string,
  amount: number,
  at: number = Date.now(),
): Adjustment {
  migrateTotalsToAdjustments(storage)
  const map = loadAdjustmentsMap(storage)
  const list = Array.isArray(map[dayKey]) ? [...map[dayKey]] : []
  const adjustment: Adjustment = {
    id: newAdjustmentId(),
    amount,
    at,
  }
  list.push(adjustment)
  map[dayKey] = list
  saveAdjustmentsMap(storage, map)
  saveTimestamp(storage, UPDATED_AT_KEY, dayKey, at)
  return adjustment
}

export function replaceDayAdjustments(
  storage: Storage,
  dayKey: string,
  adjustments: Adjustment[],
): void {
  migrateTotalsToAdjustments(storage)
  const map = loadAdjustmentsMap(storage)
  map[dayKey] = [...adjustments]
  saveAdjustmentsMap(storage, map)
  if (adjustments.length === 0) {
    const updated = loadTimestampMap(storage, UPDATED_AT_KEY)
    delete updated[dayKey]
    storage.setItem(UPDATED_AT_KEY, JSON.stringify(updated))
    return
  }
  const latest = adjustments.reduce(
    (max, adjustment) => Math.max(max, adjustment.at),
    0,
  )
  saveTimestamp(storage, UPDATED_AT_KEY, dayKey, latest)
}

/** Union by id; existing local rows kept when ids match. */
export function mergeAdjustmentsById(
  storage: Storage,
  incoming: Array<Adjustment & { dayKey: string }>,
): void {
  migrateTotalsToAdjustments(storage)
  const map = loadAdjustmentsMap(storage)
  for (const item of incoming) {
    const list = Array.isArray(map[item.dayKey]) ? [...map[item.dayKey]] : []
    if (!list.some((existing) => existing.id === item.id)) {
      list.push({ id: item.id, amount: item.amount, at: item.at })
      map[item.dayKey] = list
      saveTimestamp(storage, UPDATED_AT_KEY, item.dayKey, item.at)
    }
  }
  saveAdjustmentsMap(storage, map)
}

function loadOutbound(storage: Storage): Array<Adjustment & { dayKey: string }> {
  const raw = storage.getItem(OUTBOUND_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<Adjustment & { dayKey: string }>
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveOutbound(
  storage: Storage,
  queue: Array<Adjustment & { dayKey: string }>,
): void {
  storage.setItem(OUTBOUND_KEY, JSON.stringify(queue))
}

export function enqueueOutboundAdjustment(
  storage: Storage,
  dayKey: string,
  adjustment: Adjustment,
): void {
  const queue = loadOutbound(storage)
  if (queue.some((item) => item.id === adjustment.id)) return
  queue.push({ ...adjustment, dayKey })
  saveOutbound(storage, queue)
}

export function loadOutboundAdjustments(
  storage: Storage,
): Array<Adjustment & { dayKey: string }> {
  return loadOutbound(storage)
}

export function removeOutboundAdjustment(storage: Storage, id: string): void {
  saveOutbound(
    storage,
    loadOutbound(storage).filter((item) => item.id !== id),
  )
}

export function loadDailyTotal(storage: Storage, dayKey: string): number {
  return dailyTotalFromAdjustments(loadAdjustments(storage, dayKey))
}

export function loadLastUpdated(
  storage: Storage,
  dayKey: string,
): number | null {
  const adjustments = loadAdjustments(storage, dayKey)
  if (adjustments.length === 0) {
    return loadTimestamp(storage, UPDATED_AT_KEY, dayKey)
  }
  return adjustments.reduce(
    (latest, adjustment) => Math.max(latest, adjustment.at),
    0,
  )
}

export function saveLastUpdated(
  storage: Storage,
  dayKey: string,
  at: number,
): void {
  saveTimestamp(storage, UPDATED_AT_KEY, dayKey, at)
}

export function loadMinMetAt(storage: Storage, dayKey: string): number | null {
  return loadTimestamp(storage, MIN_MET_AT_KEY, dayKey)
}

export function saveMinMetAt(
  storage: Storage,
  dayKey: string,
  at: number,
): void {
  saveTimestamp(storage, MIN_MET_AT_KEY, dayKey, at)
}

export function clearMinMetAt(storage: Storage, dayKey: string): void {
  const map = loadTimestampMap(storage, MIN_MET_AT_KEY)
  if (!(dayKey in map)) return
  delete map[dayKey]
  storage.setItem(MIN_MET_AT_KEY, JSON.stringify(map))
}
