import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addToDailyTotal,
  formatDayLabel,
  isToday,
  removeFromDailyTotal,
  shiftDay,
  shouldFireFireworks,
  toDayKey,
  type Settings,
  validateSettings,
} from './domain'
import {
  loadDailyTotal,
  loadSettings,
  saveDailyTotal,
  saveSettings,
} from './storage'

export function useWaterLog(storage: Storage = localStorage) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(storage))
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })
  const [dailyTotal, setDailyTotal] = useState(() =>
    loadDailyTotal(storage, toDayKey(new Date())),
  )
  const [fireworksToken, setFireworksToken] = useState(0)

  const dayKey = useMemo(() => toDayKey(selectedDay), [selectedDay])
  const viewingToday = isToday(selectedDay)

  useEffect(() => {
    setDailyTotal(loadDailyTotal(storage, dayKey))
  }, [dayKey, storage])

  const applyTotal = useCallback(
    (next: number) => {
      const previous = dailyTotal
      setDailyTotal(next)
      saveDailyTotal(storage, dayKey, next)
      if (shouldFireFireworks(previous, next, settings.minimumTarget)) {
        setFireworksToken((token) => token + 1)
      }
    },
    [dailyTotal, dayKey, settings.minimumTarget, storage],
  )

  const addAmount = useCallback(
    (amount: number) => {
      if (!Number.isInteger(amount) || amount <= 0) return
      applyTotal(addToDailyTotal(dailyTotal, amount))
    },
    [applyTotal, dailyTotal],
  )

  const removeAmount = useCallback(
    (amount: number) => {
      if (!Number.isInteger(amount) || amount <= 0) return
      applyTotal(removeFromDailyTotal(dailyTotal, amount))
    },
    [applyTotal, dailyTotal],
  )

  const goBack = useCallback(() => {
    setSelectedDay((day) => shiftDay(day, -1))
  }, [])

  const goForward = useCallback(() => {
    if (viewingToday) return
    setSelectedDay((day) => shiftDay(day, 1))
  }, [viewingToday])

  const updateSettings = useCallback(
    (next: Settings) => {
      const result = validateSettings(next)
      if (!result.ok) return result
      setSettings(next)
      saveSettings(storage, next)
      return result
    },
    [storage],
  )

  return {
    settings,
    selectedDay,
    dayLabel: formatDayLabel(selectedDay),
    dailyTotal,
    viewingToday,
    fireworksToken,
    addAmount,
    removeAmount,
    goBack,
    goForward,
    updateSettings,
  }
}
