import { describe, expect, it } from 'vitest'
import { createFakeRemoteWaterLog } from './fakeRemote'

describe('Follow remote façade', () => {
  async function twoUsers() {
    const remote = createFakeRemoteWaterLog()
    await remote.signUp('alice', 'secret1')
    await remote.signOut()
    await remote.signUp('bob', 'secret1')
    await remote.signOut()
    return remote
  }

  it('sends a Follow Request and accepts it', async () => {
    const remote = await twoUsers()
    await remote.signIn('alice', 'secret1')
    expect(await remote.sendFollowRequest('bob')).toEqual({ ok: true })
    let state = await remote.getFollowState()
    expect(state.outgoingPending?.to.username).toBe('bob')

    await remote.signOut()
    await remote.signIn('bob', 'secret1')
    state = await remote.getFollowState()
    expect(state.incomingPending).toHaveLength(1)
    const requestId = state.incomingPending[0]!.id
    expect(await remote.acceptFollowRequest(requestId)).toEqual({ ok: true })

    await remote.signOut()
    await remote.signIn('alice', 'secret1')
    state = await remote.getFollowState()
    expect(state.following?.username).toBe('bob')
    expect(state.outgoingPending).toBeNull()
  })

  it('blocks Follow self and a second outgoing Request while Following', async () => {
    const remote = await twoUsers()
    await remote.signUp('carol', 'secret1')
    await remote.signOut()
    await remote.signIn('alice', 'secret1')
    expect((await remote.sendFollowRequest('alice')).ok).toBe(false)
    await remote.sendFollowRequest('bob')
    expect((await remote.sendFollowRequest('carol')).ok).toBe(false)
  })

  it('allows cancel then immediate re-request; Reject starts 24h wait', async () => {
    const remote = await twoUsers()
    await remote.signIn('alice', 'secret1')
    await remote.sendFollowRequest('bob')
    const pending = (await remote.getFollowState()).outgoingPending!
    expect(await remote.cancelFollowRequest(pending.id)).toEqual({ ok: true })
    expect(await remote.sendFollowRequest('bob')).toEqual({ ok: true })

    await remote.signOut()
    await remote.signIn('bob', 'secret1')
    const incoming = (await remote.getFollowState()).incomingPending[0]!
    expect(await remote.rejectFollowRequest(incoming.id)).toEqual({ ok: true })

    await remote.signOut()
    await remote.signIn('alice', 'secret1')
    expect((await remote.sendFollowRequest('bob')).ok).toBe(false)
  })

  it('exposes followed Day projection only after Accept', async () => {
    const remote = await twoUsers()
    await remote.signIn('bob', 'secret1')
    await remote.pushAdjustment({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      dayKey: '2026-08-09',
      amount: 400,
      at: 1_000,
    })
    await remote.signOut()

    await remote.signIn('alice', 'secret1')
    expect(await remote.getFollowedDayProjection('2026-08-09')).toBeNull()
    await remote.sendFollowRequest('bob')
    await remote.signOut()
    await remote.signIn('bob', 'secret1')
    const req = (await remote.getFollowState()).incomingPending[0]!
    await remote.acceptFollowRequest(req.id)
    await remote.signOut()
    await remote.signIn('alice', 'secret1')
    expect(await remote.getFollowedDayProjection('2026-08-09')).toEqual({
      username: 'bob',
      dailyTotal: 400,
      latestAt: 1_000,
    })
    expect(await remote.getFollowedDayProjection('2026-08-08')).toBeNull()
  })
})
