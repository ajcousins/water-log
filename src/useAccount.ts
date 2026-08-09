import { useCallback, useEffect, useState } from 'react'
import type { AccountSession, RemoteWaterLog } from './remote/types'

export function useAccount(remote: RemoteWaterLog | null) {
  const [session, setSession] = useState<AccountSession | null>(null)
  const [ready, setReady] = useState(() => remote === null)

  useEffect(() => {
    if (!remote) {
      setSession(null)
      setReady(true)
      return
    }
    let cancelled = false
    void remote.getSession().then((next) => {
      if (!cancelled) {
        setSession(next)
        setReady(true)
      }
    })
    const unsubscribe = remote.onAuthStateChange((next) => {
      setSession(next)
      setReady(true)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [remote])

  const signUp = useCallback(
    async (username: string, password: string) => {
      if (!remote) return { ok: false as const, error: 'Account is unavailable' }
      const result = await remote.signUp(username, password)
      if (result.ok) {
        setSession(await remote.getSession())
      }
      return result
    },
    [remote],
  )

  const signIn = useCallback(
    async (username: string, password: string) => {
      if (!remote) return { ok: false as const, error: 'Account is unavailable' }
      const result = await remote.signIn(username, password)
      if (result.ok) {
        setSession(await remote.getSession())
      }
      return result
    },
    [remote],
  )

  const signOut = useCallback(async () => {
    if (!remote) return
    await remote.signOut()
    setSession(null)
  }, [remote])

  return {
    session,
    ready,
    accountAvailable: remote !== null,
    signUp,
    signIn,
    signOut,
  }
}
