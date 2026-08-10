import { describe, expect, it } from 'vitest'
import { createFakeRemoteWaterLog } from '../remote/fakeRemote'
import {
  appendAdjustment,
  loadDailyTotal,
  loadOutboundAdjustments,
} from '../storage'
import {
  flushOutboundAdjustments,
  mergeAndBackfillOnSignIn,
  pullAndMergeAdjustments,
  queueLocalAdjustmentForSync,
} from './ownAdjustments'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    key() {
      return null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    },
  }
}

describe('own Adjustment sync', () => {
  it('queues and flushes outbound Adjustments when online', async () => {
    const storage = memoryStorage()
    const remote = createFakeRemoteWaterLog()
    await remote.signUp('alice', 'secret1')

    const adjustment = appendAdjustment(storage, '2026-08-09', 150, 1000)
    queueLocalAdjustmentForSync(storage, '2026-08-09', adjustment)
    expect(loadOutboundAdjustments(storage)).toHaveLength(1)

    await flushOutboundAdjustments(storage, remote)
    expect(loadOutboundAdjustments(storage)).toHaveLength(0)
    expect(await remote.pullAdjustments()).toEqual([
      {
        id: adjustment.id,
        dayKey: '2026-08-09',
        amount: 150,
        at: 1000,
      },
    ])
  })

  it('merges remote Adjustments by id for multi-device adds', async () => {
    const storage = memoryStorage()
    const remote = createFakeRemoteWaterLog()
    await remote.signUp('alice', 'secret1')
    await remote.pushAdjustment({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      dayKey: '2026-08-09',
      amount: 150,
      at: 1,
    })
    appendAdjustment(storage, '2026-08-09', 400, 2)
    await pullAndMergeAdjustments(storage, remote)
    expect(loadDailyTotal(storage, '2026-08-09')).toBe(550)
  })

  it('on sign-in, merges overlapping Days and uploads anonymous history', async () => {
    const storage = memoryStorage()
    const anonymous = appendAdjustment(storage, '2026-08-09', 1600, 1)
    const remote = createFakeRemoteWaterLog()
    await remote.signUp('alice', 'secret1')
    await remote.pushAdjustment({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      dayKey: '2026-08-09',
      amount: 250,
      at: 5,
    })

    await mergeAndBackfillOnSignIn(storage, remote)

    expect(loadDailyTotal(storage, '2026-08-09')).toBe(1850)
    expect(loadOutboundAdjustments(storage)).toHaveLength(0)
    expect(await remote.pullAdjustments()).toEqual(
      expect.arrayContaining([
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          dayKey: '2026-08-09',
          amount: 250,
          at: 5,
        },
        {
          id: anonymous.id,
          dayKey: '2026-08-09',
          amount: 1600,
          at: 1,
        },
      ]),
    )
  })

  it('on sign-up with empty remote, uploads prior anonymous Adjustments', async () => {
    const storage = memoryStorage()
    const first = appendAdjustment(storage, '2026-08-08', 400, 10)
    const second = appendAdjustment(storage, '2026-08-09', 1200, 20)
    const remote = createFakeRemoteWaterLog()
    await remote.signUp('bob', 'secret1')

    await mergeAndBackfillOnSignIn(storage, remote)

    expect(loadDailyTotal(storage, '2026-08-08')).toBe(400)
    expect(loadDailyTotal(storage, '2026-08-09')).toBe(1200)
    expect(await remote.pullAdjustments()).toEqual(
      expect.arrayContaining([
        { id: first.id, dayKey: '2026-08-08', amount: 400, at: 10 },
        { id: second.id, dayKey: '2026-08-09', amount: 1200, at: 20 },
      ]),
    )
  })
})
