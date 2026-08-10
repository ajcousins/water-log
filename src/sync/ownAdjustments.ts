import type { Adjustment } from '../domain'
import type { RemoteAdjustment, RemoteWaterLog } from '../remote/types'
import {
  enqueueOutboundAdjustment,
  loadAllAdjustments,
  loadOutboundAdjustments,
  mergeAdjustmentsById,
  removeOutboundAdjustment,
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

/**
 * On sign-in / session restore: merge remote by id, then upload any local-only
 * Adjustments (prior anonymous history and unsynced offline taps).
 */
export async function mergeAndBackfillOnSignIn(
  storage: Storage,
  remote: RemoteWaterLog,
): Promise<void> {
  const remoteRows = await remote.pullAdjustments()
  const remoteIds = new Set(remoteRows.map((row) => row.id))
  mergeAdjustmentsById(
    storage,
    remoteRows.map((row) => ({
      id: row.id,
      dayKey: row.dayKey,
      amount: row.amount,
      at: row.at,
    })),
  )
  for (const adjustment of loadAllAdjustments(storage)) {
    if (remoteIds.has(adjustment.id)) continue
    enqueueOutboundAdjustment(storage, adjustment.dayKey, adjustment)
  }
  await flushOutboundAdjustments(storage, remote)
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
