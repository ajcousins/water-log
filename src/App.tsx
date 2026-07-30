import { useState } from 'react'
import { MainScreen } from './components/MainScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { useWaterLog } from './useWaterLog'

type Screen = 'main' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('main')
  const log = useWaterLog()

  if (screen === 'settings') {
    return (
      <SettingsScreen
        settings={log.settings}
        onSave={log.updateSettings}
        onBack={() => setScreen('main')}
      />
    )
  }

  return (
    <MainScreen
      dayLabel={log.dayLabel}
      viewingToday={log.viewingToday}
      dailyTotal={log.dailyTotal}
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
