import { describe, expect, it } from 'vitest'
import { createFakeRemoteWaterLog } from './fakeRemote'
import { usernameToEmail, validateUsername } from './types'

describe('Account remote façade', () => {
  it('maps username to synthetic email', () => {
    expect(usernameToEmail('Alice')).toBe('Alice@users.water-log.invalid')
  })

  it('rejects invalid usernames', () => {
    expect(validateUsername('ab').ok).toBe(false)
    expect(validateUsername('bad name').ok).toBe(false)
    expect(validateUsername('ok_User1').ok).toBe(true)
  })

  it('signs up, returns session, and signs out to anonymous', async () => {
    const remote = createFakeRemoteWaterLog()
    expect(await remote.getSession()).toBeNull()

    const signedUp = await remote.signUp('bob', 'secret1')
    expect(signedUp).toEqual({ ok: true })
    expect(await remote.getSession()).toEqual({
      userId: 'user-1',
      username: 'bob',
    })

    await remote.signOut()
    expect(await remote.getSession()).toBeNull()
  })

  it('signs in with username and password', async () => {
    const remote = createFakeRemoteWaterLog([
      { userId: 'u1', username: 'bob', password: 'secret1' },
    ])
    const result = await remote.signIn('bob', 'secret1')
    expect(result).toEqual({ ok: true })
    expect(await remote.getSession()).toMatchObject({ username: 'bob' })
  })

  it('rejects duplicate username on sign up', async () => {
    const remote = createFakeRemoteWaterLog()
    await remote.signUp('bob', 'secret1')
    await remote.signOut()
    const again = await remote.signUp('bob', 'other99')
    expect(again.ok).toBe(false)
  })

  it('rejects wrong password', async () => {
    const remote = createFakeRemoteWaterLog([
      { userId: 'u1', username: 'bob', password: 'secret1' },
    ])
    const result = await remote.signIn('bob', 'nope')
    expect(result).toEqual({
      ok: false,
      error: 'Invalid username or password',
    })
  })
})
