import type { Adjustment } from '../domain'
import type { RemoteAdjustment, RemoteWaterLog } from '../remote/types'
import {
  enqueueOutboundAdjustment,
  loadOutboundAdjustments,
  mergeAdjustmentsById,
  removeOutboundAdjustment,
  replaceDayAdjustments,
} from '../storage'

export const OWN_SYNC_POLL_MS = 30_000

export async function flushOutboundAdjustments(
  storage: Storage,
  remote: RemoteWaterLog,
): Promise<void> {
  const queue = loadOutboundAdjustments(storage)
  for (const item of queue) {
    const result = await remote.pushAdjustment({
      id: item.id,
      dayKey: item.dayKey,
      amount: item.amount,
      at: item.at,
    })
    if (result.ok) removeOutboundAdjustment(storage, item.id)
  }
}

export async function pullAndMergeAdjustments(
  storage: Storage,
  remote: RemoteWaterLog,
): Promise<void> {
  const remoteRows = await remote.pullAdjustments()
  mergeAdjustmentsById(
    storage,
    remoteRows.map((row) => ({
      id: row.id,
      dayKey: row.dayKey,
      amount: row.amount,
      at: row.at,
    })),
  )
}

/** On sign-in: remote replaces local Adjustments for overlapping Day keys. */
export async function applyRemoteWinsOnSignIn(
  storage: Storage,
  remote: RemoteWaterLog,
): Promise<void> {
  const remoteRows = await remote.pullAdjustments()
  const byDay = new Map<string, Adjustment[]>()
  for (const row of remoteRows) {
    const list = byDay.get(row.dayKey) ?? []
    list.push({ id: row.id, amount: row.amount, at: row.at })
    byDay.set(row.dayKey, list)
  }
  for (const [dayKey, adjustments] of byDay) {
    replaceDayAdjustments(storage, dayKey, adjustments)
  }
}

export function queueLocalAdjustmentForSync(
  storage: Storage,
  dayKey: string,
  adjustment: Adjustment,
): void {
  enqueueOutboundAdjustment(storage, dayKey, adjustment)
}

export function toRemoteAdjustment(
  dayKey: string,
  adjustment: Adjustment,
): RemoteAdjustment {
  return {
    id: adjustment.id,
    dayKey,
    amount: adjustment.amount,
    at: adjustment.at,
  }
}
