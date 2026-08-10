import { useEffect, useMemo, useRef, useState } from 'react'
import { FollowRequestModal } from './components/FollowRequestModal'
import { MainScreen } from './components/MainScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { toDayKey } from './domain'
import {
  createSupabaseClientFromEnv,
  createSupabaseRemoteWaterLog,
} from './remote/supabaseRemote'
import { mergeAndBackfillOnSignIn } from './sync/ownAdjustments'
import { useAccount } from './useAccount'
import { useFollow } from './useFollow'
import { useWaterLog } from './useWaterLog'

type Screen = 'main' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('main')
  const [requestBusy, setRequestBusy] = useState(false)
  const remote = useMemo(() => {
    const client = createSupabaseClientFromEnv()
    return client ? createSupabaseRemoteWaterLog(client) : null
  }, [])
  const account = useAccount(remote)
  const signedIn = account.session !== null
  const log = useWaterLog({ remote, signedIn })
  const dayKey = toDayKey(log.selectedDay)
  const follow = useFollow(remote, signedIn, dayKey)
  const wasSignedIn = useRef(false)
  const incoming = follow.followState.incomingPending[0] ?? null

  useEffect(() => {
    document.body.dataset.levelStatus = log.levelStatus
  }, [log.levelStatus])

  const reloadDay = log.reloadDay
  useEffect(() => {
    if (!remote) return
    if (signedIn && !wasSignedIn.current) {
      void mergeAndBackfillOnSignIn(localStorage, remote)
        .then(() => {
          reloadDay()
        })
        .catch(() => {
          reloadDay()
        })
    }
    wasSignedIn.current = signedIn
  }, [remote, reloadDay, signedIn])

  if (screen === 'settings') {
    return (
      <SettingsScreen
        settings={log.settings}
        onSave={log.updateSettings}
        onBack={() => setScreen('main')}
        accountAvailable={account.accountAvailable}
        session={account.session}
        onSignUp={account.signUp}
        onSignIn={account.signIn}
        onSignOut={account.signOut}
        followState={follow.followState}
        onSendFollowRequest={follow.sendFollowRequest}
        onCancelFollowRequest={follow.cancelFollowRequest}
        onUnfollow={follow.unfollow}
        onRevokeFollower={follow.revokeFollower}
      />
    )
  }

  const followVessel =
    follow.followState.following != null
      ? {
          username: follow.followState.following.username,
          dailyTotal: follow.projection?.dailyTotal ?? 0,
          latestAt: follow.projection?.latestAt ?? null,
        }
      : null

  return (
    <>
      <MainScreen
        dayLabel={log.dayLabel}
        viewingToday={log.viewingToday}
        dailyTotal={log.dailyTotal}
        lastUpdated={log.lastUpdated}
        minMetAt={log.minMetAt}
        settings={log.settings}
        fireworksToken={log.fireworksToken}
        followVessel={followVessel}
        onBackDay={log.goBack}
        onForwardDay={log.goForward}
        onOpenSettings={() => setScreen('settings')}
        onAdd={log.addAmount}
        onRemove={log.removeAmount}
      />
      {incoming ? (
        <FollowRequestModal
          request={incoming}
          busy={requestBusy}
          onAccept={() => {
            setRequestBusy(true)
            void follow.acceptFollowRequest(incoming.id).finally(() =>
              setRequestBusy(false),
            )
          }}
          onReject={() => {
            setRequestBusy(true)
            void follow.rejectFollowRequest(incoming.id).finally(() =>
              setRequestBusy(false),
            )
          }}
        />
      ) : null}
    </>
  )
}
