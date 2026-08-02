import {
  FILL_TRANSITION_MS,
  exceedsMaximumTarget,
  vesselFillRatio,
  vesselMarkAmounts,
  type Settings,
} from '../domain'

type VesselProps = {
  dailyTotal: number
  settings: Settings
}

export function Vessel({ dailyTotal, settings }: VesselProps) {
  const fill = vesselFillRatio(dailyTotal, settings.maximumTarget)
  const marks = vesselMarkAmounts(settings.maximumTarget)
  const over = exceedsMaximumTarget(dailyTotal, settings.maximumTarget)
  const minTop =
    settings.maximumTarget > 0
      ? `${(1 - settings.minimumTarget / settings.maximumTarget) * 100}%`
      : '0%'

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

      <div
        className="relative h-[22rem] w-full overflow-hidden rounded-[2rem] border border-[var(--glass-edge)] bg-[var(--glass)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-sm"
        role="img"
        aria-label={`Vessel filled to ${Math.round(fill * 100)} percent of Maximum Target`}
      >
        <div
          className="absolute inset-x-0 bottom-0 bg-[var(--water-fill)] transition-[height] ease-linear"
          style={{
            height: `${fill * 100}%`,
            transitionDuration: `${FILL_TRANSITION_MS}ms`,
            boxShadow: 'inset 0 8px 18px rgba(255,255,255,0.35)',
          }}
        />

        {marks
          .filter((mark) => mark < settings.maximumTarget)
          .map((mark) => {
            const top = `${(1 - mark / settings.maximumTarget) * 100}%`
            return (
              <div
                key={mark}
                className="pointer-events-none absolute inset-x-0 h-0"
                style={{ top }}
              >
                {/* Center the tick on the percentage so label height does not push the line down */}
                <div className="flex -translate-y-1/2 items-center">
                  <div className="h-px flex-1 bg-[var(--pool)]/25" />
                  <span className="w-10 pr-2 text-right text-[0.65rem] leading-none text-[var(--ink-muted)]">
                    {mark}
                  </span>
                </div>
              </div>
            )
          })}

        <div
          className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-[var(--pool-deep)]/70"
          style={{ top: minTop }}
        >
          <span className="absolute top-1 left-2 text-[0.65rem] font-semibold tracking-wide text-[var(--pool-deep)] uppercase">
            Min {settings.minimumTarget}
          </span>
        </div>
      </div>
    </div>
  )
}
