import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS, dayKey } from '../lib/storage'

const DEFAULT_STREAK = {
  lastActiveDate: null,
  currentStreak: 0,
  longestStreak: 0,
}

// Number of whole days between two YYYY-MM-DD keys (b - a).
function daysBetween(a, b) {
  const da = new Date(`${a}T00:00:00`)
  const db = new Date(`${b}T00:00:00`)
  return Math.round((db - da) / 86400000)
}

// Tracks consecutive days of app usage. Call once near the app root; it records
// "today" exactly once per day and recomputes the streak. Returns the live data.
export function useStreak() {
  const [streak, setStreak] = useLocalStorage(STORAGE_KEYS.streak, DEFAULT_STREAK)

  useEffect(() => {
    const today = dayKey()
    setStreak((prev) => {
      const data = prev ?? DEFAULT_STREAK
      if (data.lastActiveDate === today) return data // already counted today

      let current
      if (data.lastActiveDate && daysBetween(data.lastActiveDate, today) === 1) {
        current = data.currentStreak + 1 // consecutive day
      } else {
        current = 1 // first day, or a gap broke the streak
      }

      return {
        lastActiveDate: today,
        currentStreak: current,
        longestStreak: Math.max(data.longestStreak ?? 0, current),
      }
    })
    // Run once on mount — recording today's visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return streak ?? DEFAULT_STREAK
}
