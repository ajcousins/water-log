import { useState } from 'react'
import type { Settings } from '../domain'
import { CustomModal } from './CustomModal'
import { Fireworks } from './Fireworks'
import { Vessel } from './Vessel'

type MainScreenProps = {
  dayLabel: string
  viewingToday: boolean
  dailyTotal: number
  lastUpdated: number | null
  settings: Settings
  fireworksToken: number
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
  settings,
  fireworksToken,
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

      <header className="mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="justify-self-start rounded-full border border-[var(--glass-edge)] bg-white/60 px-3 py-2 text-sm text-[var(--pool-deep)] shadow-sm backdrop-blur"
          aria-label="Settings"
        >
          Settings
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

        <span className="w-[4.5rem]" aria-hidden />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center py-4">
        <Vessel
          dailyTotal={dailyTotal}
          settings={settings}
          lastUpdated={lastUpdated}
        />
      </main>

      <footer className="mt-4 flex items-center justify-center gap-5">
        <FillButton label="Small" amount={settings.small} onClick={() => onAdd(settings.small)} />
        <FillButton label="Large" amount={settings.large} onClick={() => onAdd(settings.large)} />
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[var(--pool-deep)] text-white shadow-lg shadow-[rgba(14,90,117,0.25)] transition active:scale-95"
        >
          <span className="text-sm font-semibold">Custom</span>
        </button>
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
      className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[var(--pool)] text-white shadow-lg shadow-[rgba(26,122,156,0.28)] transition active:scale-95"
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[0.7rem] opacity-80">{amount} ml</span>
    </button>
  )
}
