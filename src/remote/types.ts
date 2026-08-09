export type AccountSession = {
  userId: string
  username: string
}

export type AccountResult = { ok: true } | { ok: false; error: string }

export type RemoteAdjustment = {
  id: string
  dayKey: string
  amount: number
  at: number
}

export type FollowPeer = {
  userId: string
  username: string
}

export type FollowRequestInfo = {
  id: string
  from: FollowPeer
  to: FollowPeer
  createdAt: number
}

export type FollowState = {
  following: FollowPeer | null
  outgoingPending: FollowRequestInfo | null
  incomingPending: FollowRequestInfo[]
  followers: FollowPeer[]
}

export type FollowedDayProjection = {
  username: string
  dailyTotal: number
  latestAt: number
}

export const FOLLOW_REJECT_COOLDOWN_MS = 24 * 60 * 60 * 1000

/** Remote façade for Account, sync, and Follow. Tests use a fake. */
export type RemoteWaterLog = {
  getSession: () => Promise<AccountSession | null>
  signUp: (username: string, password: string) => Promise<AccountResult>
  signIn: (username: string, password: string) => Promise<AccountResult>
  signOut: () => Promise<void>
  onAuthStateChange: (
    listener: (session: AccountSession | null) => void,
  ) => () => void
  pushAdjustment: (adjustment: RemoteAdjustment) => Promise<AccountResult>
  pullAdjustments: () => Promise<RemoteAdjustment[]>
  getFollowState: () => Promise<FollowState>
  sendFollowRequest: (username: string) => Promise<AccountResult>
  cancelFollowRequest: (requestId: string) => Promise<AccountResult>
  acceptFollowRequest: (requestId: string) => Promise<AccountResult>
  rejectFollowRequest: (requestId: string) => Promise<AccountResult>
  unfollow: () => Promise<AccountResult>
  revokeFollower: (followerUserId: string) => Promise<AccountResult>
  getFollowedDayProjection: (
    dayKey: string,
  ) => Promise<FollowedDayProjection | null>
}

export const SYNTHETIC_EMAIL_DOMAIN = 'users.water-log.invalid'

export function usernameToEmail(username: string): string {
  return `${username}@${SYNTHETIC_EMAIL_DOMAIN}`
}

export function validateUsername(username: string): AccountResult {
  if (!username || username.trim() !== username) {
    return { ok: false, error: 'Username cannot have leading or trailing spaces' }
  }
  if (username.length < 3) {
    return { ok: false, error: 'Username must be at least 3 characters' }
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return {
      ok: false,
      error: 'Username may only contain letters, numbers, and underscores',
    }
  }
  return { ok: true }
}

export function validatePassword(password: string): AccountResult {
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters' }
  }
  return { ok: true }
}
