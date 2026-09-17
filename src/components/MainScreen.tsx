import { useState } from 'react'
import { HiOutlineCog6Tooth } from 'react-icons/hi2'
import type { Settings } from '../domain'
import { CustomModal } from './CustomModal'
import { Fireworks } from './Fireworks'
import { Vessel, type FollowVesselView } from './Vessel'

type MainScreenProps = {
  dayLabel: string
  viewingToday: boolean
  dailyTotal: number
  lastUpdated: number | null
  minMetAt: number | null
  settings: Settings
  fireworksToken: number
  followVessel?: FollowVesselView | null
  onBackDay: () => void
  onForwardDay: () => void
  onOpenSettings: () => void
  onAdd: (amount: number) => void
  onRemove: (amount: number) => void
}

export function MainScreen({
  dayLabel,
  viewingToday,
  dailyTotal,
  lastUpdated,
  minMetAt,
  settings,
  fireworksToken,
  followVessel = null,
  onBackDay,
  onForwardDay,
  onOpenSettings,
  onAdd,
  onRemove,
}: MainScreenProps) {
  const [customOpen, setCustomOpen] = useState(false)

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-5">
      <Fireworks token={fireworksToken} />

      <header className="relative mb-4 flex h-11 items-center justify-center">
        <button
          type="button"
          onClick={onOpenSettings}
          className="absolute left-0 rounded-full border border-[var(--glass-edge)] bg-white/60 p-2.5 text-[var(--pool-deep)] shadow-sm backdrop-blur"
          aria-label="Settings"
        >
          <HiOutlineCog6Tooth className="h-5 w-5" aria-hidden />
        </button>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onBackDay}
            className="px-2 py-1 text-lg text-[var(--pool-deep)]"
            aria-label="Previous day"
          >
            ◀
          </button>
          <p className="min-w-[9.5rem] text-center text-sm font-medium tracking-wide text-[var(--ink)]">
            {dayLabel}
          </p>
          <button
            type="button"
            onClick={onForwardDay}
            disabled={viewingToday}
            className="px-2 py-1 text-lg text-[var(--pool-deep)] disabled:opacity-30"
            aria-label="Next day"
          >
            ▶
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center py-4">
        <Vessel
          dailyTotal={dailyTotal}
          settings={settings}
          lastUpdated={lastUpdated}
          minMetAt={minMetAt}
          followVessel={followVessel}
        />
      </main>

      <footer className="-mx-5 mt-4 overflow-x-auto px-5">
        <div className="flex w-max min-w-full items-center justify-start gap-5">
          {settings.presets.map((preset) => (
            <FillButton
              key={preset.label}
              label={preset.label}
              amount={preset.amount}
              onClick={() => onAdd(preset.amount)}
            />
          ))}
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-[var(--pool-deep)] text-white shadow-lg shadow-[rgba(14,90,117,0.25)] transition active:scale-95"
          >
            <span className="text-sm font-semibold">Custom</span>
          </button>
        </div>
      </footer>

      <CustomModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    </div>
  )
}

function FillButton({
  label,
  amount,
  onClick,
}: {
  label: string
  amount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-[var(--pool)] text-white shadow-lg shadow-[rgba(26,122,156,0.28)] transition active:scale-95"
    >
      <span className="max-w-full truncate px-1 text-sm font-semibold">{label}</span>
      <span className="text-[0.7rem] opacity-80">{amount} ml</span>
    </button>
  )
}
