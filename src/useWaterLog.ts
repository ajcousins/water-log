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
import { getLevelStatus, type LevelStatus } from './helpers/levels'
import {
  loadDailyTotal,
  loadLastUpdated,
  loadMinMetAt,
  loadSettings,
  clearMinMetAt,
  saveDailyTotal,
  saveLastUpdated,
  saveMinMetAt,
  saveSettings,
} from './storage'

export function useWaterLog(storage: Storage = localStorage) {
  const todayKey = toDayKey(new Date())
  const [settings, setSettings] = useState<Settings>(() => loadSettings(storage))
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })
  const [dailyTotal, setDailyTotal] = useState(() =>
    loadDailyTotal(storage, todayKey),
  )
  const [lastUpdated, setLastUpdated] = useState<number | null>(() =>
    loadLastUpdated(storage, todayKey),
  )
  const [minMetAt, setMinMetAt] = useState<number | null>(() =>
    loadMinMetAt(storage, todayKey),
  )
  const [levelStatus, setLevelStatus] = useState<LevelStatus>(() =>
    getLevelStatus(
      loadDailyTotal(storage, todayKey),
      loadSettings(storage).minimumTarget,
    ),
  )
  const [fireworksToken, setFireworksToken] = useState(0)
  const fireworksTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const levelStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const minMetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dayKey = useMemo(() => toDayKey(selectedDay), [selectedDay])
  const viewingToday = isToday(selectedDay)

  useEffect(() => {
    const total = loadDailyTotal(storage, dayKey)
    setDailyTotal(total)
    setLastUpdated(loadLastUpdated(storage, dayKey))
    setMinMetAt(loadMinMetAt(storage, dayKey))
    if (levelStatusTimeoutRef.current !== null) {
      clearTimeout(levelStatusTimeoutRef.current)
      levelStatusTimeoutRef.current = null
    }
    if (minMetTimeoutRef.current !== null) {
      clearTimeout(minMetTimeoutRef.current)
      minMetTimeoutRef.current = null
    }
    setLevelStatus(getLevelStatus(total, settings.minimumTarget))
  }, [dayKey, storage, settings.minimumTarget])

  useEffect(() => {
    return () => {
      if (fireworksTimeoutRef.current !== null) {
        clearTimeout(fireworksTimeoutRef.current)
      }
      if (levelStatusTimeoutRef.current !== null) {
        clearTimeout(levelStatusTimeoutRef.current)
      }
      if (minMetTimeoutRef.current !== null) {
        clearTimeout(minMetTimeoutRef.current)
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
      const nextStatus = getLevelStatus(next, settings.minimumTarget)
      if (levelStatusTimeoutRef.current !== null) {
        clearTimeout(levelStatusTimeoutRef.current)
        levelStatusTimeoutRef.current = null
      }

      if (crossingDelay !== null) {
        if (minMetTimeoutRef.current !== null) {
          clearTimeout(minMetTimeoutRef.current)
        }
        levelStatusTimeoutRef.current = setTimeout(() => {
          levelStatusTimeoutRef.current = null
          setLevelStatus(nextStatus)
        }, crossingDelay)

        if (next >= settings.minimumTarget) {
          saveMinMetAt(storage, dayKey, updatedAt)
          minMetTimeoutRef.current = setTimeout(() => {
            minMetTimeoutRef.current = null
            setMinMetAt(updatedAt)
          }, crossingDelay)
        } else {
          clearMinMetAt(storage, dayKey)
          minMetTimeoutRef.current = setTimeout(() => {
            minMetTimeoutRef.current = null
            setMinMetAt(null)
          }, crossingDelay)
        }
      } else {
        setLevelStatus(nextStatus)
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
      setLevelStatus(getLevelStatus(dailyTotal, next.minimumTarget))
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
    minMetAt,
    levelStatus,
    viewingToday,
    fireworksToken,
    addAmount,
    removeAmount,
    goBack,
    goForward,
    updateSettings,
  }
}
