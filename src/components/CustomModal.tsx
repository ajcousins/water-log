import { useState, type FormEvent } from 'react'

type CustomModalProps = {
  open: boolean
  onClose: () => void
  onAdd: (amount: number) => void
  onRemove: (amount: number) => void
}

export function CustomModal({ open, onClose, onAdd, onRemove }: CustomModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function parseAmount(): number | null {
    const trimmed = value.trim()
    if (!/^\d+$/.test(trimmed)) return null
    const amount = Number(trimmed)
    if (!Number.isInteger(amount) || amount <= 0) return null
    return amount
  }

  function submit(action: 'add' | 'remove') {
    const amount = parseAmount()
    if (amount === null) {
      setError('Enter a whole number of millilitres greater than 0')
      return
    }
    if (action === 'add') onAdd(amount)
    else onRemove(amount)
    setValue('')
    setError(null)
    onClose()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(12,42,58,0.45)] p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-title"
        className="w-full max-w-sm rounded-3xl bg-[var(--foam)] p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="custom-title" className="font-[Fraunces,serif] text-2xl text-[var(--ink)]">
            Custom
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-[var(--ink-muted)] hover:bg-white/70"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-[var(--ink-muted)]">
            Amount (ml)
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setError(null)
              }}
              className="mt-1 w-full rounded-2xl border border-[var(--glass-edge)] bg-white px-4 py-3 text-lg outline-none focus:border-[var(--pool)]"
              autoFocus
            />
          </label>
          {error ? <p className="text-sm text-[var(--over)]">{error}</p> : null}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => submit('remove')}
              className="rounded-2xl border border-[var(--glass-edge)] bg-white px-4 py-3 font-semibold text-[var(--ink)]"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => submit('add')}
              className="rounded-2xl bg-[var(--pool)] px-4 py-3 font-semibold text-white"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
