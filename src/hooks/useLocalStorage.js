import { useCallback, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage'

// Persist a piece of React state to LocalStorage under `key`.
// Returns [value, setValue] with the same ergonomics as useState — setValue
// accepts either a new value or an updater function.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readJSON(key, initialValue))

  // Keep LocalStorage in sync whenever the value (or key) changes.
  useEffect(() => {
    writeJSON(key, value)
  }, [key, value])

  // Sync across tabs/windows: when another tab writes the same key, update here.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === key && e.newValue != null) {
        try {
          setValue(JSON.parse(e.newValue))
        } catch {
          /* ignore malformed payloads */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const set = useCallback((next) => {
    setValue((prev) => (typeof next === 'function' ? next(prev) : next))
  }, [])

  return [value, set]
}
