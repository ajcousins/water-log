import {
  dailyTotalFromAdjustments,
  type Adjustment,
} from '../domain'
import type {
  AccountResult,
  AccountSession,
  FollowPeer,
  FollowRequestInfo,
  FollowState,
  FollowedDayProjection,
  RemoteAdjustment,
  RemoteWaterLog,
} from './types'
import {
  FOLLOW_REJECT_COOLDOWN_MS,
  validatePassword,
  validateUsername,
} from './types'

type StoredAccount = {
  userId: string
  username: string
  password: string
}

type StoredRequest = {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  createdAt: number
  resolvedAt: number | null
}

type StoredFollow = {
  followerId: string
  followingId: string
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

/** In-memory RemoteWaterLog for tests — no Supabase. */
export function createFakeRemoteWaterLog(
  initial: StoredAccount[] = [],
): RemoteWaterLog {
  const accounts = new Map<string, StoredAccount>()
  const byId = new Map<string, StoredAccount>()
  for (const account of initial) {
    accounts.set(account.username, account)
    byId.set(account.userId, account)
  }
  const adjustmentsByUser = new Map<string, RemoteAdjustment[]>()
  const requests: StoredRequest[] = []
  const follows: StoredFollow[] = []
  let session: AccountSession | null = null
  const listeners = new Set<(session: AccountSession | null) => void>()

  function emit() {
    for (const listener of listeners) listener(session)
  }

  function peer(userId: string): FollowPeer {
    const account = byId.get(userId)
    return { userId, username: account?.username ?? userId }
  }

  function toRequestInfo(row: StoredRequest): FollowRequestInfo {
    return {
      id: row.id,
      from: peer(row.fromUserId),
      to: peer(row.toUserId),
      createdAt: row.createdAt,
    }
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
      const account = { userId, username, password }
      accounts.set(username, account)
      byId.set(userId, account)
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

    async getFollowState() {
      if (!session) return emptyFollowState()
      const me = session.userId
      const followingRow = follows.find((row) => row.followerId === me)
      const outgoing = requests.find(
        (row) => row.fromUserId === me && row.status === 'pending',
      )
      const incoming = requests.filter(
        (row) => row.toUserId === me && row.status === 'pending',
      )
      const followerRows = follows.filter((row) => row.followingId === me)
      return {
        following: followingRow ? peer(followingRow.followingId) : null,
        outgoingPending: outgoing ? toRequestInfo(outgoing) : null,
        incomingPending: incoming.map(toRequestInfo),
        followers: followerRows.map((row) => peer(row.followerId)),
      }
    },

    async sendFollowRequest(username) {
      if (!session) return { ok: false, error: 'Not signed in' }
      if (username === session.username) {
        return { ok: false, error: 'You cannot Follow yourself' }
      }
      const target = accounts.get(username)
      if (!target) return { ok: false, error: 'User not found' }
      if (follows.some((row) => row.followerId === session!.userId)) {
        return { ok: false, error: 'Unfollow before sending a new Follow Request' }
      }
      if (
        requests.some(
          (row) =>
            row.fromUserId === session!.userId && row.status === 'pending',
        )
      ) {
        return {
          ok: false,
          error: 'Cancel your pending Follow Request first',
        }
      }
      const rejected = requests
        .filter(
          (row) =>
            row.fromUserId === session!.userId &&
            row.toUserId === target.userId &&
            row.status === 'rejected' &&
            row.resolvedAt !== null,
        )
        .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0))[0]
      if (
        rejected?.resolvedAt &&
        Date.now() - rejected.resolvedAt < FOLLOW_REJECT_COOLDOWN_MS
      ) {
        return {
          ok: false,
          error: 'Wait 24 hours after a Reject before requesting again',
        }
      }
      requests.push({
        id: newId('req'),
        fromUserId: session.userId,
        toUserId: target.userId,
        status: 'pending',
        createdAt: Date.now(),
        resolvedAt: null,
      })
      return { ok: true }
    },

    async cancelFollowRequest(requestId) {
      if (!session) return { ok: false, error: 'Not signed in' }
      const row = requests.find((item) => item.id === requestId)
      if (!row || row.fromUserId !== session.userId || row.status !== 'pending') {
        return { ok: false, error: 'Follow Request not found' }
      }
      row.status = 'cancelled'
      row.resolvedAt = Date.now()
      return { ok: true }
    },

    async acceptFollowRequest(requestId) {
      if (!session) return { ok: false, error: 'Not signed in' }
      const row = requests.find((item) => item.id === requestId)
      if (!row || row.toUserId !== session.userId || row.status !== 'pending') {
        return { ok: false, error: 'Follow Request not found' }
      }
      if (follows.some((item) => item.followerId === row.fromUserId)) {
        return {
          ok: false,
          error: 'That user already has an active Follow',
        }
      }
      row.status = 'accepted'
      row.resolvedAt = Date.now()
      follows.push({
        followerId: row.fromUserId,
        followingId: row.toUserId,
      })
      return { ok: true }
    },

    async rejectFollowRequest(requestId) {
      if (!session) return { ok: false, error: 'Not signed in' }
      const row = requests.find((item) => item.id === requestId)
      if (!row || row.toUserId !== session.userId || row.status !== 'pending') {
        return { ok: false, error: 'Follow Request not found' }
      }
      row.status = 'rejected'
      row.resolvedAt = Date.now()
      return { ok: true }
    },

    async unfollow() {
      if (!session) return { ok: false, error: 'Not signed in' }
      const index = follows.findIndex((row) => row.followerId === session!.userId)
      if (index < 0) return { ok: false, error: 'Not Following anyone' }
      follows.splice(index, 1)
      return { ok: true }
    },

    async revokeFollower(followerUserId) {
      if (!session) return { ok: false, error: 'Not signed in' }
      const index = follows.findIndex(
        (row) =>
          row.followingId === session!.userId &&
          row.followerId === followerUserId,
      )
      if (index < 0) return { ok: false, error: 'Follower not found' }
      follows.splice(index, 1)
      return { ok: true }
    },

    async getFollowedDayProjection(dayKey): Promise<FollowedDayProjection | null> {
      if (!session) return null
      const link = follows.find((row) => row.followerId === session!.userId)
      if (!link) return null
      const rows = (adjustmentsByUser.get(link.followingId) ?? []).filter(
        (row) => row.dayKey === dayKey,
      )
      const asAdjustments: Adjustment[] = rows.map((row) => ({
        id: row.id,
        amount: row.amount,
        at: row.at,
      }))
      const dailyTotal = dailyTotalFromAdjustments(asAdjustments)
      if (dailyTotal <= 0) return null
      const latestAt = rows.reduce((max, row) => Math.max(max, row.at), 0)
      return {
        username: peer(link.followingId).username,
        dailyTotal,
        latestAt,
      }
    },
  }
}

export type {
  AccountResult,
  AccountSession,
  FollowState,
  RemoteAdjustment,
}
