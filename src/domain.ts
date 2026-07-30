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
