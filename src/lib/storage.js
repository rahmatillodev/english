// Centralized LocalStorage keys and small helpers shared across the app.
// Keeping the keys in one place avoids typos and makes the data contract explicit.

export const STORAGE_KEYS = {
  translations: 'translations_history',
  writing: 'writing_history',
  vocabulary: 'vocabulary_bank',
  streak: 'streak_data',
}

export const MAX_TRANSLATION_HISTORY = 50

// Read + parse a JSON value from LocalStorage with a fallback.
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

// Serialize + write a JSON value to LocalStorage.
export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable (e.g. private mode) — fail quietly.
  }
}

// A simple unique id that doesn't depend on any external library.
export function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// "2026-06-17" — a stable, sortable day key in local time.
export function dayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "2026-06" — month bucket used by the progress charts.
export function monthKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
