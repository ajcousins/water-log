import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  AccountResult,
  AccountSession,
  FollowPeer,
  FollowState,
  FollowedDayProjection,
  RemoteAdjustment,
  RemoteWaterLog,
} from './types'
import {
  FOLLOW_REJECT_COOLDOWN_MS,
  usernameToEmail,
  validatePassword,
  validateUsername,
} from './types'

type ProfileRow = { id: string; username: string }

type AdjustmentRow = {
  id: string
  day_key: string
  amount: number
  at: string
}

type RequestRow = {
  id: string
  from_user_id: string
  to_user_id: string
  status: string
  created_at: string
  resolved_at: string | null
}

function mapAuthError(message: string): string {
  if (
    /already registered|already been registered|duplicate key|profiles_username_unique/i.test(
      message,
    )
  ) {
    return 'Username is already taken'
  }
  if (/invalid login credentials/i.test(message)) {
    return 'Invalid username or password'
  }
  return message
}

export function createSupabaseRemoteWaterLog(
  client: SupabaseClient,
): RemoteWaterLog {
  async function sessionFromUser(
    userId: string,
  ): Promise<AccountSession | null> {
    const { data, error } = await client
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()
    if (error || !data) return null
    return { userId, username: (data as { username: string }).username }
  }

  async function currentUserId(): Promise<string | null> {
    const { data } = await client.auth.getSession()
    return data.session?.user?.id ?? null
  }

  function emptyFollowState(): FollowState {
    return {
      following: null,
      outgoingPending: null,
      incomingPending: [],
      followers: [],
    }
  }

  return {
    async getSession() {
      const userId = await currentUserId()
      if (!userId) return null
      return sessionFromUser(userId)
    },

    async signUp(username, password) {
      const userCheck = validateUsername(username)
      if (!userCheck.ok) return userCheck
      const passCheck = validatePassword(password)
      if (!passCheck.ok) return passCheck

      const email = usernameToEmail(username)
      const { data, error } = await client.auth.signUp({ email, password })
      if (error) return { ok: false, error: mapAuthError(error.message) }
      const userId = data.user?.id
      if (!userId) {
        return { ok: false, error: 'Could not create Account' }
      }

      const { error: profileError } = await client.from('profiles').insert({
        id: userId,
        username,
      })
      if (profileError) {
        return {
          ok: false,
          error: mapAuthError(profileError.message),
        }
      }
      return { ok: true }
    },

    async signIn(username, password) {
      const userCheck = validateUsername(username)
      if (!userCheck.ok) return userCheck
      const { error } = await client.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      })
      if (error) return { ok: false, error: mapAuthError(error.message) }
      return { ok: true }
    },

    async signOut() {
      await client.auth.signOut()
    },

    onAuthStateChange(listener) {
      const { data } = client.auth.onAuthStateChange((_event, authSession) => {
        void (async () => {
          const userId = authSession?.user?.id
          if (!userId) {
            listener(null)
            return
          }
          listener(await sessionFromUser(userId))
        })()
      })
      return () => {
        data.subscription.unsubscribe()
      }
    },

    async pushAdjustment(adjustment: RemoteAdjustment) {
      const userId = await currentUserId()
      if (!userId) return { ok: false, error: 'Not signed in' }
      const { error } = await client.from('adjustments').upsert(
        {
          id: adjustment.id,
          user_id: userId,
          day_key: adjustment.dayKey,
          amount: adjustment.amount,
          at: new Date(adjustment.at).toISOString(),
        },
        { onConflict: 'id' },
      )
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },

    async pullAdjustments() {
      const { data, error } = await client
        .from('adjustments')
        .select('id, day_key, amount, at')
      if (error || !data) return []
      return (data as AdjustmentRow[]).map((row) => ({
        id: row.id,
        dayKey: row.day_key,
        amount: row.amount,
        at: new Date(row.at).getTime(),
      }))
    },

    async getFollowState() {
      const userId = await currentUserId()
      if (!userId) return emptyFollowState()

      const [{ data: followOut }, { data: followIn }, { data: pending }] =
        await Promise.all([
          client
            .from('follows')
            .select('follower_id, following_id')
            .eq('follower_id', userId)
            .maybeSingle(),
          client
            .from('follows')
            .select('follower_id, following_id')
            .eq('following_id', userId),
          client
            .from('follow_requests')
            .select('id, from_user_id, to_user_id, status, created_at, resolved_at')
            .eq('status', 'pending')
            .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
        ])

      const ids = new Set<string>()
      if (followOut) ids.add((followOut as { following_id: string }).following_id)
      for (const row of (followIn as { follower_id: string }[] | null) ?? []) {
        ids.add(row.follower_id)
      }
      for (const row of (pending as RequestRow[] | null) ?? []) {
        ids.add(row.from_user_id)
        ids.add(row.to_user_id)
      }

      const profiles = new Map<string, string>()
      if (ids.size > 0) {
        const { data: profileRows } = await client
          .from('profiles')
          .select('id, username')
          .in('id', [...ids])
        for (const row of (profileRows as ProfileRow[] | null) ?? []) {
          profiles.set(row.id, row.username)
        }
      }

      function peer(id: string): FollowPeer {
        return { userId: id, username: profiles.get(id) ?? id }
      }

      const outgoing = (pending as RequestRow[] | null)?.find(
        (row) => row.from_user_id === userId,
      )
      const incoming =
        (pending as RequestRow[] | null)?.filter(
          (row) => row.to_user_id === userId,
        ) ?? []

      return {
        following: followOut
          ? peer((followOut as { following_id: string }).following_id)
          : null,
        outgoingPending: outgoing
          ? {
              id: outgoing.id,
              from: peer(outgoing.from_user_id),
              to: peer(outgoing.to_user_id),
              createdAt: new Date(outgoing.created_at).getTime(),
            }
          : null,
        incomingPending: incoming.map((row) => ({
          id: row.id,
          from: peer(row.from_user_id),
          to: peer(row.to_user_id),
          createdAt: new Date(row.created_at).getTime(),
        })),
        followers: ((followIn as { follower_id: string }[] | null) ?? []).map(
          (row) => peer(row.follower_id),
        ),
      }
    },

    async sendFollowRequest(username) {
      const userId = await currentUserId()
      if (!userId) return { ok: false, error: 'Not signed in' }
      const session = await sessionFromUser(userId)
      if (!session) return { ok: false, error: 'Not signed in' }
      if (username === session.username) {
        return { ok: false, error: 'You cannot Follow yourself' }
      }

      const state = await this.getFollowState()
      if (state.following) {
        return { ok: false, error: 'Unfollow before sending a new Follow Request' }
      }
      if (state.outgoingPending) {
        return {
          ok: false,
          error: 'Cancel your pending Follow Request first',
        }
      }

      const { data: target, error: targetError } = await client
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .maybeSingle()
      if (targetError || !target) {
        return { ok: false, error: 'User not found' }
      }

      const { data: rejected } = await client
        .from('follow_requests')
        .select('resolved_at')
        .eq('from_user_id', userId)
        .eq('to_user_id', (target as ProfileRow).id)
        .eq('status', 'rejected')
        .order('resolved_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (rejected?.resolved_at) {
        const at = new Date(rejected.resolved_at as string).getTime()
        if (Date.now() - at < FOLLOW_REJECT_COOLDOWN_MS) {
          return {
            ok: false,
            error: 'Wait 24 hours after a Reject before requesting again',
          }
        }
      }

      const { error } = await client.from('follow_requests').insert({
        from_user_id: userId,
        to_user_id: (target as ProfileRow).id,
        status: 'pending',
      })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },

    async cancelFollowRequest(requestId) {
      const userId = await currentUserId()
      if (!userId) return { ok: false, error: 'Not signed in' }
      const { error } = await client
        .from('follow_requests')
        .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('from_user_id', userId)
        .eq('status', 'pending')
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },

    async acceptFollowRequest(requestId) {
      const userId = await currentUserId()
      if (!userId) return { ok: false, error: 'Not signed in' }

      const { data: row, error: loadError } = await client
        .from('follow_requests')
        .select('id, from_user_id, to_user_id, status')
        .eq('id', requestId)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .maybeSingle()
      if (loadError || !row) {
        return { ok: false, error: 'Follow Request not found' }
      }

      const { error: followError } = await client.from('follows').insert({
        follower_id: (row as { from_user_id: string }).from_user_id,
        following_id: userId,
      })
      if (followError) return { ok: false, error: followError.message }

      const { error } = await client
        .from('follow_requests')
        .update({ status: 'accepted', resolved_at: new Date().toISOString() })
        .eq('id', requestId)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },

    async rejectFollowRequest(requestId) {
      const userId = await currentUserId()
      if (!userId) return { ok: false, error: 'Not signed in' }
      const { error } = await client
        .from('follow_requests')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },

    async unfollow() {
      const userId = await currentUserId()
      if (!userId) return { ok: false, error: 'Not signed in' }
      const { error } = await client
        .from('follows')
        .delete()
        .eq('follower_id', userId)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },

    async revokeFollower(followerUserId) {
      const userId = await currentUserId()
      if (!userId) return { ok: false, error: 'Not signed in' }
      const { error } = await client
        .from('follows')
        .delete()
        .eq('following_id', userId)
        .eq('follower_id', followerUserId)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },

    async getFollowedDayProjection(
      dayKey: string,
    ): Promise<FollowedDayProjection | null> {
      const { data, error } = await client.rpc('followed_day_projection', {
        p_day_key: dayKey,
      })
      if (error || !data || !Array.isArray(data) || data.length === 0) {
        return null
      }
      const row = data[0] as {
        username: string
        daily_total: number
        latest_at: string
      }
      if (!row.daily_total || row.daily_total <= 0) return null
      return {
        username: row.username,
        dailyTotal: row.daily_total,
        latestAt: new Date(row.latest_at).getTime(),
      }
    },
  }
}

export function createSupabaseClientFromEnv(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export type { AccountResult, AccountSession }
