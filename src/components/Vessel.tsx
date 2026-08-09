import { useEffect, useState } from 'react'
import {
  FILL_TRANSITION_MS,
  exceedsMaximumTarget,
  followMarkerPlacement,
  formatClockTime,
  vesselFillRatio,
  vesselMarkAmounts,
  type Settings,
} from '../domain'
import type { FollowedDayProjection } from '../remote/types'

type VesselProps = {
  dailyTotal: number
  settings: Settings
  lastUpdated: number | null
  minMetAt: number | null
  followProjection?: FollowedDayProjection | null
}

export function Vessel({
  dailyTotal,
  settings,
  lastUpdated,
  minMetAt,
  followProjection = null,
}: VesselProps) {
  const fillKey = `${dailyTotal}:${lastUpdated ?? 'none'}`
  const [revealedFor, setRevealedFor] = useState<string | null>(null)
  const fill = vesselFillRatio(dailyTotal, settings.maximumTarget)
  const marks = vesselMarkAmounts(settings.maximumTarget)
  const over = exceedsMaximumTarget(dailyTotal, settings.maximumTarget)
  const minTop =
    settings.maximumTarget > 0
      ? `${(1 - settings.minimumTarget / settings.maximumTarget) * 100}%`
      : '0%'
  const stampVisible = lastUpdated !== null && revealedFor === fillKey
  const marker = followProjection
    ? followMarkerPlacement(
        followProjection.dailyTotal,
        settings.maximumTarget,
      )
    : { visible: false, ratio: 0, overshootMl: null }

  useEffect(() => {
    if (lastUpdated === null) {
      setRevealedFor(null)
      return
    }
    const id = window.setTimeout(() => setRevealedFor(fillKey), FILL_TRANSITION_MS)
    return () => window.clearTimeout(id)
  }, [fillKey, lastUpdated])

  return (
    <div className="flex w-full max-w-[11.5rem] flex-col items-center gap-3">
      <p
        className="font-[Fraunces,serif] text-3xl tabular-nums tracking-tight"
        style={{ color: over ? 'var(--over)' : 'var(--ink)' }}
        aria-live="polite"
      >
        {dailyTotal}
        <span className="ml-1 text-base font-medium opacity-70">ml</span>
      </p>

      <div className="relative w-full">
        <div
          className="vessel-shell relative h-[22rem] w-full overflow-hidden rounded-[2rem] border border-[var(--glass-edge)] bg-[var(--glass)] backdrop-blur-sm"
          role="img"
          aria-label={`Vessel filled to ${Math.round(fill * 100)} percent of Maximum Target`}
        >
          <div
            className="absolute inset-x-0 bottom-0 z-0 bg-[var(--water-fill)] opacity-80 transition-[height] ease-linear"
            style={{
              height: `${fill * 100}%`,
              transitionDuration: `${FILL_TRANSITION_MS}ms`,
            }}
          />
          <div className="vessel-shell__glow" aria-hidden />

          {marks
            .filter((mark) => mark < settings.maximumTarget)
            .map((mark) => {
              const top = `${(1 - mark / settings.maximumTarget) * 100}%`
              return (
                <div
                  key={mark}
                  className="pointer-events-none absolute inset-x-0 z-[3] h-0"
                  style={{ top }}
                >
                  <div className="flex -translate-y-1/2 items-center justify-end">
                    <div className="h-px w-[10%] bg-[var(--ink)]" />
                    <span className="w-10 pr-2 text-right text-[0.65rem] leading-none text-[var(--ink)]">
                      {mark}
                    </span>
                  </div>
                </div>
              )
            })}

          <div
            className="pointer-events-none absolute right-0 left-0 z-[3] border-t border-dashed border-[var(--pool-deep)]/70"
            style={{ top: minTop }}
          >
            <span className="absolute top-1 left-2 text-[0.65rem] font-semibold tracking-wide text-[var(--pool-deep)] uppercase">
              Min {settings.minimumTarget}
            </span>
          </div>

          {marker.visible && followProjection ? (
            <div
              className="pointer-events-none absolute z-[4] flex w-[42%] flex-col items-center"
              style={{
                left: '8%',
                bottom: `${marker.ratio * 100}%`,
                transform: 'translateY(50%)',
              }}
            >
              <span className="mb-0.5 max-w-full truncate text-center text-[0.65rem] leading-tight text-[var(--ink)]">
                {followProjection.username} @{' '}
                {formatClockTime(followProjection.latestAt)}
              </span>
              <span
                className="block h-0 w-0 border-x-[6px] border-t-[10px] border-x-transparent border-t-[var(--pool-deep)]"
                aria-hidden
              />
              {marker.overshootMl !== null ? (
                <span className="mt-0.5 text-[0.65rem] tabular-nums text-[var(--ink-muted)]">
                  {marker.overshootMl}ml
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {minMetAt !== null ? (
          <span
            className="pointer-events-none absolute right-full mr-2 text-xs tabular-nums text-[var(--pool-deep)]"
            style={{
              top: minTop,
              transform: 'translateY(-50%)',
            }}
          >
            {formatClockTime(minMetAt)}
          </span>
        ) : null}

        {lastUpdated !== null && stampVisible ? (
          <span
            className="pointer-events-none absolute left-full ml-2 text-xs tabular-nums text-[var(--ink-muted)]"
            style={{
              bottom: `${fill * 100}%`,
              transform: 'translateY(50%)',
            }}
          >
            {formatClockTime(lastUpdated)}
          </span>
        ) : null}
      </div>
    </div>
  )
}
