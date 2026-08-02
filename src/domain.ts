export type Settings = {
  minimumTarget: number
  maximumTarget: number
  small: number
  large: number
}

export const DEFAULT_SETTINGS: Settings = {
  minimumTarget: 1500,
  maximumTarget: 2500,
  small: 150,
  large: 400,
}

export type SettingsValidation =
  | { ok: true }
  | { ok: false; error: string }

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
  return { ok: true }
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

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

/** Relative “Updated …” label; returns a single space when there is no timestamp. */
export function formatLastUpdatedLabel(
  updatedAt: number | null,
  now: number,
): string {
  if (updatedAt === null) return ' '

  const elapsed = Math.max(0, now - updatedAt)
  if (elapsed < MINUTE_MS) return 'Updated just now'

  const minutes = Math.floor(elapsed / MINUTE_MS)
  if (minutes < 60) {
    return minutes === 1
      ? 'Updated 1 minute ago'
      : `Updated ${minutes} minutes ago`
  }

  const hours = Math.floor(elapsed / HOUR_MS)
  return hours === 1 ? 'Updated 1 hour ago' : `Updated ${hours} hours ago`
}
