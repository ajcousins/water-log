import { useState, type FormEvent } from 'react'
import { type Settings, validateSettings } from '../domain'

type SettingsScreenProps = {
  settings: Settings
  onSave: (settings: Settings) => { ok: true } | { ok: false; error: string }
  onBack: () => void
}

export function SettingsScreen({ settings, onSave, onBack }: SettingsScreenProps) {
  const [draft, setDraft] = useState({
    minimumTarget: String(settings.minimumTarget),
    maximumTarget: String(settings.maximumTarget),
    small: String(settings.small),
    large: String(settings.large),
  })
  const [error, setError] = useState<string | null>(null)

  function parseField(value: string): number | null {
    if (!/^\d+$/.test(value.trim())) return null
    const amount = Number(value.trim())
    return Number.isInteger(amount) && amount > 0 ? amount : null
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const minimumTarget = parseField(draft.minimumTarget)
    const maximumTarget = parseField(draft.maximumTarget)
    const small = parseField(draft.small)
    const large = parseField(draft.large)

    if (
      minimumTarget === null ||
      maximumTarget === null ||
      small === null ||
      large === null
    ) {
      setError('All values must be whole millilitres greater than 0')
      return
    }

    const next = { minimumTarget, maximumTarget, small, large }
    const validation = validateSettings(next)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    const result = onSave(next)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onBack()
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">
      <header className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full px-3 py-2 text-[var(--pool-deep)] hover:bg-white/50"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="font-[Fraunces,serif] text-3xl">Settings</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        {(
          [
            ['minimumTarget', 'Minimum Target (ml)'],
            ['maximumTarget', 'Maximum Target (ml)'],
            ['small', 'Small (ml)'],
            ['large', 'Large (ml)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm text-[var(--ink-muted)]">
            {label}
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={draft[key]}
              onChange={(event) => {
                setDraft((current) => ({ ...current, [key]: event.target.value }))
                setError(null)
              }}
              className="mt-1 w-full rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-4 py-3 text-lg outline-none focus:border-[var(--pool)]"
            />
          </label>
        ))}

        {error ? <p className="text-sm text-[var(--over)]">{error}</p> : null}

        <button
          type="submit"
          className="mt-auto rounded-2xl bg-[var(--pool)] px-4 py-3 font-semibold text-white"
        >
          Save
        </button>
      </form>
    </div>
  )
}
