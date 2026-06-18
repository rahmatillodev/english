import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Database,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import {
  downloadBackup,
  importBackupFile,
  clearAllData,
} from '../lib/backup'
import { STORAGE_KEYS, readJSON } from '../lib/storage'
import { Card, PageHeader, Button } from '../components/ui'
import { useToast } from '../components/Toast'

function dataSummary() {
  return {
    translations: readJSON(STORAGE_KEYS.translations, []).length,
    writings: readJSON(STORAGE_KEYS.writing, []).length,
    vocabulary: readJSON(STORAGE_KEYS.vocabulary, []).length,
  }
}

export default function Settings() {
  const toast = useToast()
  const fileRef = useRef(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const summary = dataSummary()

  function onExport() {
    downloadBackup()
    toast.success('Backup downloaded')
  }

  async function onImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    try {
      await importBackupFile(file)
      toast.success('Backup restored — reloading…')
      setTimeout(() => window.location.reload(), 700)
    } catch (err) {
      toast.error(err.message || 'Import failed')
    }
  }

  function onReset() {
    clearAllData()
    toast.info('All data cleared — reloading…')
    setTimeout(() => window.location.reload(), 700)
  }

  return (
    <div>
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Back up your data and manage the app."
      />

      {/* Data backup */}
      <Card hover={false} className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
          <Database size={18} className="text-indigo-300" /> Data backup
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Everything you do is stored only in this browser. Export a backup file
          regularly so you don't lose your history if site data is cleared.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ['Translations', summary.translations],
            ['Writings', summary.writings],
            ['Vocabulary', summary.vocabulary],
          ].map(([label, n]) => (
            <div
              key={label}
              className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-center"
            >
              <div className="text-2xl font-bold text-slate-100">{n}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={onExport}>
            <Download size={16} /> Export backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
          />
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
          Importing replaces existing data for any section in the file, then
          reloads the app.
        </p>
      </Card>

      {/* Danger zone */}
      <Card hover={false} className="border-rose-500/20">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
          <Trash2 size={18} className="text-rose-300" /> Reset
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Permanently delete all translations, writings, vocabulary, and your
          streak. Consider exporting a backup first.
        </p>
        <div className="mt-4">
          {confirmReset ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="text-sm font-semibold text-rose-200">
                Delete everything?
              </span>
              <Button variant="danger" onClick={onReset}>
                Yes, delete all data
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </motion.div>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmReset(true)}>
              <Trash2 size={16} /> Reset all data
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
