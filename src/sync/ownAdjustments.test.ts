import { describe, expect, it } from 'vitest'
import { createFakeRemoteWaterLog } from '../remote/fakeRemote'
import {
  appendAdjustment,
  loadDailyTotal,
  loadOutboundAdjustments,
} from '../storage'
import {
  applyRemoteWinsOnSignIn,
  flushOutboundAdjustments,
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

  it('on sign-in, remote wins for overlapping Days', async () => {
    const storage = memoryStorage()
    appendAdjustment(storage, '2026-08-09', 999, 1)
    const remote = createFakeRemoteWaterLog()
    await remote.signUp('alice', 'secret1')
    await remote.pushAdjustment({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      dayKey: '2026-08-09',
      amount: 200,
      at: 5,
    })
    await applyRemoteWinsOnSignIn(storage, remote)
    expect(loadDailyTotal(storage, '2026-08-09')).toBe(200)
  })
})
