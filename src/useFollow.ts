import { useCallback, useEffect, useState } from 'react'
import type {
  FollowState,
  FollowedDayProjection,
  RemoteWaterLog,
} from './remote/types'
import { OWN_SYNC_POLL_MS } from './sync/ownAdjustments'

const emptyFollowState = (): FollowState => ({
  following: null,
  outgoingPending: null,
  incomingPending: [],
  followers: [],
})

export function useFollow(
  remote: RemoteWaterLog | null,
  signedIn: boolean,
  dayKey: string,
) {
  const [followState, setFollowState] = useState<FollowState>(emptyFollowState)
  const [projection, setProjection] = useState<FollowedDayProjection | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!remote || !signedIn) {
      setFollowState(emptyFollowState())
      setProjection(null)
      return
    }
    try {
      const [state, day] = await Promise.all([
        remote.getFollowState(),
        remote.getFollowedDayProjection(dayKey),
      ])
      setFollowState(state)
      setProjection(day)
      setError(null)
    } catch {
      // Keep last good state on transient failures.
    }
  }, [dayKey, remote, signedIn])

  useEffect(() => {
    void refresh()
    if (!remote || !signedIn) return
    const id = window.setInterval(() => {
      void refresh()
    }, OWN_SYNC_POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh, remote, signedIn])

  const sendFollowRequest = useCallback(
    async (username: string) => {
      if (!remote) return { ok: false as const, error: 'Account is unavailable' }
      const result = await remote.sendFollowRequest(username)
      if (result.ok) await refresh()
      else setError(result.error)
      return result
    },
    [refresh, remote],
  )

  const cancelFollowRequest = useCallback(
    async (requestId: string) => {
      if (!remote) return { ok: false as const, error: 'Account is unavailable' }
      const result = await remote.cancelFollowRequest(requestId)
      if (result.ok) await refresh()
      return result
    },
    [refresh, remote],
  )

  const acceptFollowRequest = useCallback(
    async (requestId: string) => {
      if (!remote) return { ok: false as const, error: 'Account is unavailable' }
      const result = await remote.acceptFollowRequest(requestId)
      if (result.ok) await refresh()
      return result
    },
    [refresh, remote],
  )

  const rejectFollowRequest = useCallback(
    async (requestId: string) => {
      if (!remote) return { ok: false as const, error: 'Account is unavailable' }
      const result = await remote.rejectFollowRequest(requestId)
      if (result.ok) await refresh()
      return result
    },
    [refresh, remote],
  )

  const unfollow = useCallback(async () => {
    if (!remote) return { ok: false as const, error: 'Account is unavailable' }
    const result = await remote.unfollow()
    if (result.ok) await refresh()
    return result
  }, [refresh, remote])

  const revokeFollower = useCallback(
    async (userId: string) => {
      if (!remote) return { ok: false as const, error: 'Account is unavailable' }
      const result = await remote.revokeFollower(userId)
      if (result.ok) await refresh()
      return result
    },
    [refresh, remote],
  )

  return {
    followState,
    projection,
    error,
    clearError: () => setError(null),
    refresh,
    sendFollowRequest,
    cancelFollowRequest,
    acceptFollowRequest,
    rejectFollowRequest,
    unfollow,
    revokeFollower,
  }
}
