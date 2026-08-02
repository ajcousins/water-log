export type LevelStatus = 'met' | 'good' | 'low' | 'very-low'

const SIX_AM = 6 * 60
const NINE_AM = 9 * 60
/** Duration of the pace ramp (6am → 8pm). */
const PACE_SPAN = 20 * 60 - SIX_AM

/** Expected intake ratio for a pace line that starts at `startMinutes` (0% → 100% over PACE_SPAN). */
const expectedRatioAt = (minutes: number, startMinutes: number): number =>
  Math.min(1, Math.max(0, (minutes - startMinutes) / PACE_SPAN))

export const getLevelStatus = (current: number, target: number): LevelStatus => {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()

  if (current >= target) return 'met'
  if (minutes <= SIX_AM) return 'good'

  const actualRatio = target === 0 ? 1 : current / target

  // Same slope for each band; origins at 6am / 9am / noon (+3h each)
  if (actualRatio >= expectedRatioAt(minutes, SIX_AM)) return 'good'
  if (actualRatio >= expectedRatioAt(minutes, NINE_AM)) return 'low'
  return 'very-low'
}
