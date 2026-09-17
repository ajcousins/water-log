export type Preset = {
  label: string
  amount: number
}

export type Settings = {
  minimumTarget: number
  maximumTarget: number
  presets: Preset[]
}

export const MAX_PRESETS = 8
export const MAX_PRESET_LABEL_LENGTH = 18
export const NEW_PRESET_AMOUNT = 200

export const DEFAULT_SETTINGS: Settings = {
  minimumTarget: 1500,
  maximumTarget: 2500,
  presets: [
    { label: 'Small', amount: 150 },
    { label: 'Large', amount: 400 },
  ],
}

export type SettingsValidation =
  | { ok: true }
  | { ok: false; error: string }

export type Adjustment = {
  id: string
  amount: number
  at: number
}

export function dailyTotalFromAdjustments(
  adjustments: readonly Pick<Adjustment, 'amount'>[],
): number {
  const sum = adjustments.reduce((total, adjustment) => total + adjustment.amount, 0)
  return Math.max(0, sum)
}

export function addToDailyTotal(current: number, amount: number): number {
  return current + amount
}

export function removeFromDailyTotal(current: number, amount: number): number {
  return Math.max(0, current - amount)
}

export function shouldFireFireworks(
  previous: number,
  next: number,
  minimumTarget: number,
): boolean {
  return previous < minimumTarget && next >= minimumTarget
}

/** Duration of the Vessel fill height transition; keep in sync with Vessel CSS. */
export const FILL_TRANSITION_MS = 700

/**
 * Delay until a linear fill animation from previous→next would reach the Minimum Target line.
 * Works for crossing upward or downward. Returns null when the fill does not cross the line.
 */
export function fillThresholdCrossingDelayMs(
  previous: number,
  next: number,
  minimumTarget: number,
  maximumTarget: number,
  durationMs: number = FILL_TRANSITION_MS,
): number | null {
  const crossedUp = previous < minimumTarget && next >= minimumTarget
  const crossedDown = previous >= minimumTarget && next < minimumTarget
  if (!crossedUp && !crossedDown) return null

  const from = vesselFillRatio(previous, maximumTarget)
  const to = vesselFillRatio(next, maximumTarget)
  if (from === to) return 0

  const cross =
    maximumTarget <= 0
      ? 0
      : Math.min(1, Math.max(0, minimumTarget / maximumTarget))
  const progress = (cross - from) / (to - from)
  if (progress < 0 || progress > 1) return 0
  return Math.round(progress * durationMs)
}

/**
 * Delay until a linear fill animation from previous→next would reach the Minimum Target.
 * Returns 0 when fireworks should not fire.
 */
export function fillCrossingDelayMs(
  previous: number,
  next: number,
  minimumTarget: number,
  maximumTarget: number,
  durationMs: number = FILL_TRANSITION_MS,
): number {
  if (!shouldFireFireworks(previous, next, minimumTarget)) return 0
  return (
    fillThresholdCrossingDelayMs(
      previous,
      next,
      minimumTarget,
      maximumTarget,
      durationMs,
    ) ?? 0
  )
}

export function validateSettings(settings: Settings): SettingsValidation {
  if (settings.minimumTarget >= settings.maximumTarget) {
    return {
      ok: false,
      error: 'Minimum Target must be less than Maximum Target',
    }
  }

  const presets = settings.presets
  if (presets.length < 1 || presets.length > MAX_PRESETS) {
    return {
      ok: false,
      error: `You must have between 1 and ${MAX_PRESETS} Presets`,
    }
  }

  const seen = new Set<string>()
  for (const preset of presets) {
    const label = preset.label.trim()
    if (label.length === 0) {
      return { ok: false, error: 'Preset labels cannot be empty' }
    }
    if (label.length > MAX_PRESET_LABEL_LENGTH) {
      return {
        ok: false,
        error: `Preset labels must be at most ${MAX_PRESET_LABEL_LENGTH} characters`,
      }
    }
    if (seen.has(label)) {
      return { ok: false, error: 'Preset labels must be unique' }
    }
    seen.add(label)

    if (!Number.isInteger(preset.amount) || preset.amount <= 0) {
      return {
        ok: false,
        error: 'Preset amounts must be whole millilitres greater than 0',
      }
    }
  }

  return { ok: true }
}

/** Next unique seed label for a new Preset (“Preset”, then “Preset 2”, …). */
export function nextPresetLabel(
  existing: readonly Pick<Preset, 'label'>[],
): string {
  const labels = new Set(existing.map((preset) => preset.label.trim()))
  if (!labels.has('Preset')) return 'Preset'
  let n = 2
  while (labels.has(`Preset ${n}`)) n += 1
  return `Preset ${n}`
}

export function seedNewPreset(
  existing: readonly Pick<Preset, 'label'>[],
): Preset {
  return { label: nextPresetLabel(existing), amount: NEW_PRESET_AMOUNT }
}

export function movePreset<T>(
  presets: readonly T[],
  index: number,
  direction: -1 | 1,
): T[] {
  const target = index + direction
  if (index < 0 || index >= presets.length) return [...presets]
  if (target < 0 || target >= presets.length) return [...presets]
  const next = [...presets]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  return next
}

export function vesselFillRatio(
  dailyTotal: number,
  maximumTarget: number,
): number {
  if (maximumTarget <= 0) return 0
  return Math.min(1, Math.max(0, dailyTotal / maximumTarget))
}

export function exceedsMaximumTarget(
  dailyTotal: number,
  maximumTarget: number,
): boolean {
  return dailyTotal > maximumTarget
}

export function vesselMarkAmounts(
  maximumTarget: number,
  step = 200,
): number[] {
  const marks: number[] = []
  for (let value = step; value <= maximumTarget; value += step) {
    marks.push(value)
  }
  return marks
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDayLabel(date: Date): string {
  const parts = DAY_LABEL_FORMATTER.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${get('weekday')}, ${get('day')} ${get('month')} ${get('year')}`
}

export function toDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function shiftDay(date: Date, delta: number): Date {
  const next = startOfLocalDay(date)
  next.setDate(next.getDate() + delta)
  return next
}

export function isToday(date: Date, now: Date = new Date()): boolean {
  return toDayKey(date) === toDayKey(now)
}

/** 24-hour clock time for a last-updated instant, e.g. "14:08". */
export function formatClockTime(updatedAt: number): string {
  const date = new Date(updatedAt)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/** Follow Vessel fill on the viewer’s Maximum Target scale. */
export type FollowVesselFill = {
  /** 0–1 height from bottom; clamped at Maximum Target. */
  ratio: number
  /** True millilitres when Daily Total exceeds Maximum Target; otherwise null. */
  overshootMl: number | null
}

export function followVesselFill(
  followedDailyTotal: number,
  viewerMaximumTarget: number,
): FollowVesselFill {
  const total = Math.max(0, followedDailyTotal)
  if (viewerMaximumTarget <= 0) {
    return {
      ratio: total > 0 ? 1 : 0,
      overshootMl: total > 0 ? total : null,
    }
  }
  const ratio = Math.min(1, total / viewerMaximumTarget)
  const overshootMl = total > viewerMaximumTarget ? total : null
  return { ratio, overshootMl }
}
