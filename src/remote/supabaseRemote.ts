import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  AccountResult,
  AccountSession,
  RemoteAdjustment,
  RemoteWaterLog,
} from './types'
import {
  usernameToEmail,
  validatePassword,
  validateUsername,
} from './types'

type ProfileRow = { username: string }

type AdjustmentRow = {
  id: string
  day_key: string
  amount: number
  at: string
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
    return { userId, username: (data as ProfileRow).username }
  }

  return {
    async getSession() {
      const { data } = await client.auth.getSession()
      const userId = data.session?.user?.id
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
      const { data: auth } = await client.auth.getSession()
      const userId = auth.session?.user?.id
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
  }
}

export function createSupabaseClientFromEnv(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export type { AccountResult, AccountSession }
