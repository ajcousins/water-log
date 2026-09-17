import { useMemo, useState, type FormEvent } from 'react'
import {
  MAX_PRESETS,
  MAX_PRESET_LABEL_LENGTH,
  seedNewPreset,
  type Preset,
  type Settings,
  validateSettings,
} from '../domain'
import type { AccountSession, FollowState } from '../remote/types'

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
  followState?: FollowState
  onSendFollowRequest?: (
    username: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onCancelFollowRequest?: (
    requestId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onUnfollow?: () => Promise<{ ok: true } | { ok: false; error: string }>
  onRevokeFollower?: (
    userId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
}

type DraftPreset = { label: string; amount: string }

function toDraftPresets(presets: readonly Preset[]): DraftPreset[] {
  return presets.map((preset) => ({
    label: preset.label,
    amount: String(preset.amount),
  }))
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
  followState,
  onSendFollowRequest,
  onCancelFollowRequest,
  onUnfollow,
  onRevokeFollower,
}: SettingsScreenProps) {
  const [draft, setDraft] = useState({
    minimumTarget: String(settings.minimumTarget),
    maximumTarget: String(settings.maximumTarget),
  })
  const [presets, setPresets] = useState<DraftPreset[]>(() =>
    toDraftPresets(settings.presets),
  )
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [accountError, setAccountError] = useState<string | null>(null)
  const [accountMessage, setAccountMessage] = useState<string | null>(null)
  const [accountBusy, setAccountBusy] = useState(false)
  const [accountMode, setAccountMode] = useState<'signIn' | 'signUp'>('signIn')
  const [followUsername, setFollowUsername] = useState('')
  const [followError, setFollowError] = useState<string | null>(null)
  const [followBusy, setFollowBusy] = useState(false)

  const signedInLabel = useMemo(
    () => (session ? `Signed in as ${session.username}` : null),
    [session],
  )

  const atPresetCap = presets.length >= MAX_PRESETS
  const atPresetFloor = presets.length <= 1

  function parseField(value: string): number | null {
    if (!/^\d+$/.test(value.trim())) return null
    const amount = Number(value.trim())
    return Number.isInteger(amount) && amount > 0 ? amount : null
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const minimumTarget = parseField(draft.minimumTarget)
    const maximumTarget = parseField(draft.maximumTarget)

    if (minimumTarget === null || maximumTarget === null) {
      setError('Targets must be whole millilitres greater than 0')
      return
    }

    const nextPresets: Preset[] = []
    for (const preset of presets) {
      const amount = parseField(preset.amount)
      if (amount === null) {
        setError('Preset amounts must be whole millilitres greater than 0')
        return
      }
      nextPresets.push({ label: preset.label.trim(), amount })
    }

    const next = { minimumTarget, maximumTarget, presets: nextPresets }
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

        <div className="mt-2 flex flex-col gap-3">
          <h2 className="font-[Fraunces,serif] text-2xl">Presets</h2>
          {presets.map((preset, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-2xl border border-[var(--glass-edge)] bg-white/60 p-3"
            >
              <label className="block text-sm text-[var(--ink-muted)]">
                Label
                <input
                  maxLength={MAX_PRESET_LABEL_LENGTH}
                  value={preset.label}
                  onChange={(event) => {
                    const value = event.target.value
                    setPresets((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, label: value } : item,
                      ),
                    )
                    setError(null)
                  }}
                  className="mt-1 w-full rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-4 py-3 text-lg outline-none focus:border-[var(--pool)]"
                />
              </label>
              <label className="block text-sm text-[var(--ink-muted)]">
                Amount (ml)
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={preset.amount}
                  onChange={(event) => {
                    const value = event.target.value
                    setPresets((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, amount: value } : item,
                      ),
                    )
                    setError(null)
                  }}
                  className="mt-1 w-full rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-4 py-3 text-lg outline-none focus:border-[var(--pool)]"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  aria-label={`Move preset ${index + 1} up`}
                  onClick={() => {
                    setPresets((current) => {
                      if (index <= 0) return current
                      const next = [...current]
                      const tmp = next[index - 1]!
                      next[index - 1] = next[index]!
                      next[index] = tmp
                      return next
                    })
                    setError(null)
                  }}
                  className="rounded-xl border border-[var(--glass-edge)] bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--pool-deep)] disabled:opacity-30"
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={index === presets.length - 1}
                  aria-label={`Move preset ${index + 1} down`}
                  onClick={() => {
                    setPresets((current) => {
                      if (index >= current.length - 1) return current
                      const next = [...current]
                      const tmp = next[index + 1]!
                      next[index + 1] = next[index]!
                      next[index] = tmp
                      return next
                    })
                    setError(null)
                  }}
                  className="rounded-xl border border-[var(--glass-edge)] bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--pool-deep)] disabled:opacity-30"
                >
                  Down
                </button>
                <button
                  type="button"
                  disabled={atPresetFloor}
                  aria-label={`Delete preset ${index + 1}`}
                  onClick={() => {
                    if (atPresetFloor) return
                    setPresets((current) => current.filter((_, i) => i !== index))
                    setError(null)
                  }}
                  className="rounded-xl border border-[var(--glass-edge)] bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--over)] disabled:opacity-30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            disabled={atPresetCap}
            onClick={() => {
              if (atPresetCap) return
              const seeded = seedNewPreset(presets)
              setPresets((current) => [
                ...current,
                { label: seeded.label, amount: String(seeded.amount) },
              ])
              setError(null)
            }}
            className="rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-4 py-3 font-semibold text-[var(--pool-deep)] disabled:opacity-40"
          >
            Add Preset
          </button>
          {atPresetCap ? (
            <p className="text-sm text-[var(--ink-muted)]">
              Maximum of {MAX_PRESETS} Presets reached.
            </p>
          ) : null}
        </div>

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

      {session && followState && onSendFollowRequest ? (
        <section className="mt-10 flex flex-col gap-3 border-t border-[var(--glass-edge)] pt-8 pb-6">
          <h2 className="font-[Fraunces,serif] text-2xl">Following</h2>
          {followState.following ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--ink-muted)]">
                Following{' '}
                <span className="font-semibold text-[var(--ink)]">
                  {followState.following.username}
                </span>
              </p>
              <button
                type="button"
                disabled={followBusy || !onUnfollow}
                onClick={() => {
                  if (!onUnfollow) return
                  setFollowBusy(true)
                  void onUnfollow().finally(() => setFollowBusy(false))
                }}
                className="rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--pool-deep)]"
              >
                Unfollow
              </button>
            </div>
          ) : followState.outgoingPending ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--ink-muted)]">
                Pending request to{' '}
                <span className="font-semibold text-[var(--ink)]">
                  {followState.outgoingPending.to.username}
                </span>
              </p>
              <button
                type="button"
                disabled={followBusy || !onCancelFollowRequest}
                onClick={() => {
                  if (!onCancelFollowRequest || !followState.outgoingPending) {
                    return
                  }
                  setFollowBusy(true)
                  void onCancelFollowRequest(
                    followState.outgoingPending.id,
                  ).finally(() => setFollowBusy(false))
                }}
                className="rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--pool-deep)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                setFollowError(null)
                setFollowBusy(true)
                void onSendFollowRequest(followUsername).then((result) => {
                  setFollowBusy(false)
                  if (!result.ok) setFollowError(result.error)
                  else setFollowUsername('')
                })
              }}
            >
              <label className="block text-sm text-[var(--ink-muted)]">
                Username to Follow
                <input
                  value={followUsername}
                  onChange={(event) => {
                    setFollowUsername(event.target.value)
                    setFollowError(null)
                  }}
                  className="mt-1 w-full rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-4 py-3 text-lg outline-none focus:border-[var(--pool)]"
                />
              </label>
              {followError ? (
                <p className="text-sm text-[var(--over)]">{followError}</p>
              ) : null}
              <button
                type="submit"
                disabled={followBusy}
                className="rounded-2xl bg-[var(--pool)] px-4 py-3 font-semibold text-white"
              >
                Send Follow Request
              </button>
            </form>
          )}

          <h3 className="mt-4 font-[Fraunces,serif] text-xl">Followers</h3>
          {followState.followers.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">No followers yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {followState.followers.map((follower) => (
                <li
                  key={follower.userId}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {follower.username}
                  </span>
                  <button
                    type="button"
                    disabled={followBusy || !onRevokeFollower}
                    onClick={() => {
                      if (!onRevokeFollower) return
                      setFollowBusy(true)
                      void onRevokeFollower(follower.userId).finally(() =>
                        setFollowBusy(false),
                      )
                    }}
                    className="rounded-2xl border border-[var(--glass-edge)] bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--pool-deep)]"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}
