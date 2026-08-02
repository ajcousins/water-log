import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addToDailyTotal,
  fillCrossingDelayMs,
  fillThresholdCrossingDelayMs,
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
  loadLastUpdated,
  loadSettings,
  saveDailyTotal,
  saveLastUpdated,
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
  const [lastUpdated, setLastUpdated] = useState<number | null>(() =>
    loadLastUpdated(storage, toDayKey(new Date())),
  )
  const [goalMet, setGoalMet] = useState(
    () =>
      loadDailyTotal(storage, toDayKey(new Date())) >=
      loadSettings(storage).minimumTarget,
  )
  const [fireworksToken, setFireworksToken] = useState(0)
  const fireworksTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const goalMetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dayKey = useMemo(() => toDayKey(selectedDay), [selectedDay])
  const viewingToday = isToday(selectedDay)

  useEffect(() => {
    const total = loadDailyTotal(storage, dayKey)
    setDailyTotal(total)
    setLastUpdated(loadLastUpdated(storage, dayKey))
    if (goalMetTimeoutRef.current !== null) {
      clearTimeout(goalMetTimeoutRef.current)
      goalMetTimeoutRef.current = null
    }
    setGoalMet(total >= settings.minimumTarget)
  }, [dayKey, storage, settings.minimumTarget])

  useEffect(() => {
    return () => {
      if (fireworksTimeoutRef.current !== null) {
        clearTimeout(fireworksTimeoutRef.current)
      }
      if (goalMetTimeoutRef.current !== null) {
        clearTimeout(goalMetTimeoutRef.current)
      }
    }
  }, [])

  const applyTotal = useCallback(
    (next: number) => {
      const previous = dailyTotal
      const updatedAt = Date.now()
      setDailyTotal(next)
      saveDailyTotal(storage, dayKey, next)
      setLastUpdated(updatedAt)
      saveLastUpdated(storage, dayKey, updatedAt)

      const crossingDelay = fillThresholdCrossingDelayMs(
        previous,
        next,
        settings.minimumTarget,
        settings.maximumTarget,
      )
      if (crossingDelay !== null) {
        if (goalMetTimeoutRef.current !== null) {
          clearTimeout(goalMetTimeoutRef.current)
        }
        const met = next >= settings.minimumTarget
        goalMetTimeoutRef.current = setTimeout(() => {
          goalMetTimeoutRef.current = null
          setGoalMet(met)
        }, crossingDelay)
      }

      if (shouldFireFireworks(previous, next, settings.minimumTarget)) {
        if (fireworksTimeoutRef.current !== null) {
          clearTimeout(fireworksTimeoutRef.current)
        }
        const delay = fillCrossingDelayMs(
          previous,
          next,
          settings.minimumTarget,
          settings.maximumTarget,
        )
        fireworksTimeoutRef.current = setTimeout(() => {
          fireworksTimeoutRef.current = null
          setFireworksToken((token) => token + 1)
        }, delay)
      }
    },
    [
      dailyTotal,
      dayKey,
      settings.maximumTarget,
      settings.minimumTarget,
      storage,
    ],
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
      setGoalMet(dailyTotal >= next.minimumTarget)
      return result
    },
    [dailyTotal, storage],
  )

  return {
    settings,
    selectedDay,
    dayLabel: formatDayLabel(selectedDay),
    dailyTotal,
    lastUpdated,
    goalMet,
    viewingToday,
    fireworksToken,
    addAmount,
    removeAmount,
    goBack,
    goForward,
    updateSettings,
  }
}
