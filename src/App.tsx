import { useEffect, useMemo, useRef, useState } from 'react'
import { MainScreen } from './components/MainScreen'
import { SettingsScreen } from './components/SettingsScreen'
import {
  createSupabaseClientFromEnv,
  createSupabaseRemoteWaterLog,
} from './remote/supabaseRemote'
import { applyRemoteWinsOnSignIn } from './sync/ownAdjustments'
import { useAccount } from './useAccount'
import { useWaterLog } from './useWaterLog'

type Screen = 'main' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('main')
  const remote = useMemo(() => {
    const client = createSupabaseClientFromEnv()
    return client ? createSupabaseRemoteWaterLog(client) : null
  }, [])
  const account = useAccount(remote)
  const signedIn = account.session !== null
  const log = useWaterLog({ remote, signedIn })
  const wasSignedIn = useRef(false)

  useEffect(() => {
    document.body.dataset.levelStatus = log.levelStatus
  }, [log.levelStatus])

  const reloadDay = log.reloadDay
  useEffect(() => {
    if (!remote) return
    if (signedIn && !wasSignedIn.current) {
      void applyRemoteWinsOnSignIn(localStorage, remote).then(() => {
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
      />
    )
  }

  return (
    <MainScreen
      dayLabel={log.dayLabel}
      viewingToday={log.viewingToday}
      dailyTotal={log.dailyTotal}
      lastUpdated={log.lastUpdated}
      minMetAt={log.minMetAt}
      settings={log.settings}
      fireworksToken={log.fireworksToken}
      onBackDay={log.goBack}
      onForwardDay={log.goForward}
      onOpenSettings={() => setScreen('settings')}
      onAdd={log.addAmount}
      onRemove={log.removeAmount}
    />
  )
}
