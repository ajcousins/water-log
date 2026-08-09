import type {
  AccountResult,
  AccountSession,
  RemoteAdjustment,
  RemoteWaterLog,
} from './types'
import { validatePassword, validateUsername } from './types'

type StoredAccount = {
  userId: string
  username: string
  password: string
}

/** In-memory RemoteWaterLog for tests — no Supabase. */
export function createFakeRemoteWaterLog(
  initial: StoredAccount[] = [],
): RemoteWaterLog {
  const accounts = new Map<string, StoredAccount>()
  for (const account of initial) {
    accounts.set(account.username, account)
  }
  const adjustmentsByUser = new Map<string, RemoteAdjustment[]>()
  let session: AccountSession | null = null
  const listeners = new Set<(session: AccountSession | null) => void>()

  function emit() {
    for (const listener of listeners) listener(session)
  }

  return {
    async getSession() {
      return session
    },

    async signUp(username, password) {
      const userCheck = validateUsername(username)
      if (!userCheck.ok) return userCheck
      const passCheck = validatePassword(password)
      if (!passCheck.ok) return passCheck
      if (accounts.has(username)) {
        return { ok: false, error: 'Username is already taken' }
      }
      const userId = `user-${accounts.size + 1}`
      accounts.set(username, { userId, username, password })
      adjustmentsByUser.set(userId, [])
      session = { userId, username }
      emit()
      return { ok: true }
    },

    async signIn(username, password) {
      const account = accounts.get(username)
      if (!account || account.password !== password) {
        return { ok: false, error: 'Invalid username or password' }
      }
      session = { userId: account.userId, username: account.username }
      emit()
      return { ok: true }
    },

    async signOut() {
      session = null
      emit()
    },

    onAuthStateChange(listener) {
      listeners.add(listener)
      listener(session)
      return () => {
        listeners.delete(listener)
      }
    },

    async pushAdjustment(adjustment) {
      if (!session) return { ok: false, error: 'Not signed in' }
      const list = adjustmentsByUser.get(session.userId) ?? []
      if (!list.some((item) => item.id === adjustment.id)) {
        list.push(adjustment)
        adjustmentsByUser.set(session.userId, list)
      }
      return { ok: true }
    },

    async pullAdjustments() {
      if (!session) return []
      return [...(adjustmentsByUser.get(session.userId) ?? [])]
    },
  }
}

export type { AccountResult, AccountSession, RemoteAdjustment }
