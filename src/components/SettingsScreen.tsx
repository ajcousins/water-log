import { useMemo, useState, type FormEvent } from 'react'
import { type Settings, validateSettings } from '../domain'
import type { AccountSession } from '../remote/types'

type SettingsScreenProps = {
  settings: Settings
  onSave: (settings: Settings) => { ok: true } | { ok: false; error: string }
  onBack: () => void
  accountAvailable: boolean
  session: AccountSession | null
  onSignUp: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onSignIn: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onSignOut: () => Promise<void>
}

export function SettingsScreen({
  settings,
  onSave,
  onBack,
  accountAvailable,
  session,
  onSignUp,
  onSignIn,
  onSignOut,
}: SettingsScreenProps) {
  const [draft, setDraft] = useState({
    minimumTarget: String(settings.minimumTarget),
    maximumTarget: String(settings.maximumTarget),
    small: String(settings.small),
    large: String(settings.large),
  })
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [accountError, setAccountError] = useState<string | null>(null)
  const [accountMessage, setAccountMessage] = useState<string | null>(null)
  const [accountBusy, setAccountBusy] = useState(false)
  const [accountMode, setAccountMode] = useState<'signIn' | 'signUp'>('signIn')

  const signedInLabel = useMemo(
    () => (session ? `Signed in as ${session.username}` : null),
    [session],
  )

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

  async function handleAccountAction(event: FormEvent) {
    event.preventDefault()
    setAccountError(null)
    setAccountMessage(null)
    setAccountBusy(true)
    const mode = accountMode
    const action = mode === 'signUp' ? onSignUp : onSignIn
    const result = await action(username, password)
    setAccountBusy(false)
    if (!result.ok) {
      setAccountError(result.error)
      return
    }
    setPassword('')
    if (mode === 'signUp') {
      setAccountMode('signIn')
      setAccountMessage('Account created. Sign in with your username and password.')
    }
  }

  async function handleSignOut() {
    setAccountError(null)
    setAccountBusy(true)
    await onSignOut()
    setAccountBusy(false)
    setPassword('')
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          className="rounded-2xl bg-[var(--pool)] px-4 py-3 font-semibold text-white"
        >
          Save
        </button>
      </form>

      <section className="mt-10 flex flex-col gap-3 border-t border-[var(--glass-edge)] pt-8">
        <h2 className="font-[Fraunces,serif] text-2xl">Account</h2>
        {!accountAvailable ? (
          <p className="text-sm text-[var(--ink-muted)]">
            Account is unavailable (missing Supabase configuration).
          </p>
        ) : session ? (
          <>
            <p className="text-sm text-[var(--ink-muted)]">{signedInLabel}</p>
            <button
              type="button"
              disabled={accountBusy}
              onClick={() => void handleSignOut()}
              className="rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-4 py-3 font-semibold text-[var(--pool-deep)]"
            >
              Sign out
            </button>
          </>
        ) : (
          <form
            onSubmit={(event) => void handleAccountAction(event)}
            className="flex flex-col gap-3"
          >
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={
                  accountMode === 'signIn'
                    ? 'font-semibold text-[var(--pool-deep)]'
                    : 'text-[var(--ink-muted)]'
                }
                onClick={() => {
                  setAccountMode('signIn')
                  setAccountError(null)
                }}
              >
                Sign in
              </button>
              <span className="text-[var(--ink-muted)]">·</span>
              <button
                type="button"
                className={
                  accountMode === 'signUp'
                    ? 'font-semibold text-[var(--pool-deep)]'
                    : 'text-[var(--ink-muted)]'
                }
                onClick={() => {
                  setAccountMode('signUp')
                  setAccountError(null)
                  setAccountMessage(null)
                }}
              >
                Sign up
              </button>
            </div>
            {accountMessage ? (
              <p className="text-sm text-[var(--pool-deep)]">{accountMessage}</p>
            ) : null}
            <label className="block text-sm text-[var(--ink-muted)]">
              Username
              <input
                autoComplete="username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setAccountError(null)
                }}
                className="mt-1 w-full rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-4 py-3 text-lg outline-none focus:border-[var(--pool)]"
              />
            </label>
            <label className="block text-sm text-[var(--ink-muted)]">
              Password
              <input
                type="password"
                autoComplete={
                  accountMode === 'signUp' ? 'new-password' : 'current-password'
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setAccountError(null)
                }}
                className="mt-1 w-full rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-4 py-3 text-lg outline-none focus:border-[var(--pool)]"
              />
            </label>
            {accountError ? (
              <p className="text-sm text-[var(--over)]">{accountError}</p>
            ) : null}
            <button
              type="submit"
              disabled={accountBusy}
              className="rounded-2xl bg-[var(--pool)] px-4 py-3 font-semibold text-white"
            >
              {accountMode === 'signUp' ? 'Create Account' : 'Sign in'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
