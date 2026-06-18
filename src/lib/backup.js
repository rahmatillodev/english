// Export / import of all app data as a single JSON file. Everything lives in
// LocalStorage, so a backup is just a snapshot of the known keys — the only
// safeguard against losing your history when the browser clears site data.

import { STORAGE_KEYS, dayKey, readJSON } from './storage'

const BACKUP_VERSION = 1
const KEYS = Object.values(STORAGE_KEYS)

// Gather all known keys into one serializable payload.
export function buildBackup() {
  const data = {}
  for (const key of KEYS) {
    const value = readJSON(key, null)
    if (value != null) data[key] = value
  }
  return { app: 'english-learning-hub', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data }
}

// Trigger a download of the backup as a timestamped .json file.
export function downloadBackup() {
  const payload = JSON.stringify(buildBackup(), null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `english-hub-backup-${dayKey()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Restore from a parsed backup object. Only writes recognized keys, so a
// malformed or foreign file can't inject arbitrary storage entries.
// Returns the list of keys that were restored.
export function restoreBackup(parsed) {
  if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
    throw new Error('This file is not a valid English Hub backup.')
  }
  const restored = []
  for (const key of KEYS) {
    if (key in parsed.data) {
      localStorage.setItem(key, JSON.stringify(parsed.data[key]))
      restored.push(key)
    }
  }
  if (restored.length === 0) {
    throw new Error('The backup contained no recognizable data.')
  }
  return restored
}

// Read + parse a File (from an <input type="file">) and restore it.
export function importBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(restoreBackup(JSON.parse(reader.result)))
      } catch (e) {
        reject(e instanceof SyntaxError ? new Error('The file is not valid JSON.') : e)
      }
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsText(file)
  })
}

// Wipe all app data (used by the "reset" action).
export function clearAllData() {
  for (const key of KEYS) localStorage.removeItem(key)
}
