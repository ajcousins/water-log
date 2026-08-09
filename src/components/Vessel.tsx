import { useEffect, useState } from 'react'
import {
  FILL_TRANSITION_MS,
  exceedsMaximumTarget,
  followVesselFill,
  formatClockTime,
  vesselFillRatio,
  vesselMarkAmounts,
  type Settings,
} from '../domain'

export type FollowVesselView = {
  username: string
  dailyTotal: number
  latestAt: number | null
}

type VesselProps = {
  dailyTotal: number
  settings: Settings
  lastUpdated: number | null
  minMetAt: number | null
  followVessel?: FollowVesselView | null
}

export function Vessel({
  dailyTotal,
  settings,
  lastUpdated,
  minMetAt,
  followVessel = null,
}: VesselProps) {
  const fillKey = `${dailyTotal}:${lastUpdated ?? 'none'}`
  const followFillKey = followVessel
    ? `${followVessel.dailyTotal}:${followVessel.latestAt ?? 'none'}`
    : 'none'
  const [revealedFor, setRevealedFor] = useState<string | null>(null)
  const [followStampFor, setFollowStampFor] = useState<string | null>(null)
  const fill = vesselFillRatio(dailyTotal, settings.maximumTarget)
  const marks = vesselMarkAmounts(settings.maximumTarget)
  const over = exceedsMaximumTarget(dailyTotal, settings.maximumTarget)
  const minTop =
    settings.maximumTarget > 0
      ? `${(1 - settings.minimumTarget / settings.maximumTarget) * 100}%`
      : '0%'
  const stampVisible = lastUpdated !== null && revealedFor === fillKey
  const followFill = followVessel
    ? followVesselFill(followVessel.dailyTotal, settings.maximumTarget)
    : null
  const followStampVisible =
    followVessel?.latestAt != null && followStampFor === followFillKey

  useEffect(() => {
    if (lastUpdated === null) {
      setRevealedFor(null)
      return
    }
    const id = window.setTimeout(() => setRevealedFor(fillKey), FILL_TRANSITION_MS)
    return () => window.clearTimeout(id)
  }, [fillKey, lastUpdated])

  useEffect(() => {
    if (!followVessel || followVessel.latestAt === null) {
      setFollowStampFor(null)
      return
    }
    const id = window.setTimeout(
      () => setFollowStampFor(followFillKey),
      FILL_TRANSITION_MS,
    )
    return () => window.clearTimeout(id)
  }, [followFillKey, followVessel])

  return (
    <div className="flex w-full max-w-[16rem] flex-col items-center gap-3">
      <div className="flex w-full items-end justify-center gap-3">
        {followVessel && followFill ? (
          <div className="relative flex w-[1.15rem] flex-col items-center">
            <div className="mb-1 flex h-5 w-12 items-end justify-center">
              {followFill.overshootMl !== null ? (
                <span className="text-center text-[0.65rem] tabular-nums leading-none text-[var(--ink-muted)]">
                  {followFill.overshootMl}ml
                </span>
              ) : null}
            </div>
            <div className="relative w-full">
              <div
                className="vessel-shell relative h-[22rem] w-full overflow-hidden rounded-lg border border-[var(--glass-edge)] bg-[var(--glass)] backdrop-blur-sm"
                role="img"
                aria-label={`${followVessel.username} Follow Vessel`}
              >
                <div
                  className="absolute inset-x-0 bottom-0 z-0 bg-[var(--water-fill)] opacity-80 transition-[height] ease-linear"
                  style={{
                    height: `${followFill.ratio * 100}%`,
                    transitionDuration: `${FILL_TRANSITION_MS}ms`,
                  }}
                />
              </div>

              {followStampVisible && followVessel.latestAt !== null ? (
                <span
                  className="pointer-events-none absolute right-full mr-1 text-xs tabular-nums text-[var(--ink-muted)]"
                  style={{
                    bottom: `${followFill.ratio * 100}%`,
                    transform: 'translateY(50%)',
                  }}
                >
                  {formatClockTime(followVessel.latestAt)}
                </span>
              ) : null}
            </div>
            <p className="absolute top-full mt-2 max-w-[4.5rem] truncate text-center text-[0.65rem] font-medium text-[var(--ink)]">
              {followVessel.username}
            </p>
          </div>
        ) : null}

        <div className="flex w-[11.5rem] flex-col items-center">
          <p
            className="mb-3 font-[Fraunces,serif] text-3xl tabular-nums tracking-tight"
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
      </div>
    </div>
  )
}
