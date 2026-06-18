import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  LayoutDashboard,
  Languages,
  PenLine,
  BookMarked,
  BarChart3,
  Settings,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storage'

const PAGES = [
  { label: 'Dashboard', to: '/', Icon: LayoutDashboard, kind: 'Page' },
  { label: 'Translator', to: '/translator', Icon: Languages, kind: 'Page' },
  { label: 'Writing Practice', to: '/writing', Icon: PenLine, kind: 'Page' },
  { label: 'Vocabulary Bank', to: '/vocabulary', Icon: BookMarked, kind: 'Page' },
  { label: 'Progress', to: '/progress', Icon: BarChart3, kind: 'Page' },
  { label: 'Settings', to: '/settings', Icon: Settings, kind: 'Page' },
]

// Global search / command palette. Opens with Cmd/Ctrl+K. Lets the user jump
// to any page or find any saved word, translation, or writing — which keeps the
// app fast to use no matter how much practice history has piled up.
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const [vocab] = useLocalStorage(STORAGE_KEYS.vocabulary, [])
  const [translations] = useLocalStorage(STORAGE_KEYS.translations, [])
  const [writing] = useLocalStorage(STORAGE_KEYS.writing, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    const match = (s) => s && s.toLowerCase().includes(term)

    const pages = PAGES.filter((p) => !term || match(p.label))

    if (!term) {
      return [...pages]
    }

    const vocabHits = vocab
      .filter((v) => match(v.word) || match(v.translation))
      .slice(0, 5)
      .map((v) => ({
        label: v.word,
        sub: v.translation,
        to: '/vocabulary',
        Icon: BookMarked,
        kind: 'Vocabulary',
      }))

    const transHits = translations
      .filter((t) => match(t.word) || match(t.translation))
      .slice(0, 5)
      .map((t) => ({
        label: t.word,
        sub: t.translation,
        to: '/translator',
        Icon: Languages,
        kind: 'Translation',
      }))

    const writeHits = writing
      .filter((w) => match(w.topic))
      .slice(0, 4)
      .map((w) => ({
        label: w.topic,
        sub: new Date(w.date).toLocaleDateString(),
        to: '/writing',
        Icon: PenLine,
        kind: 'Writing',
      }))

    return [...pages, ...vocabHits, ...transHits, ...writeHits]
  }, [q, vocab, translations, writing])

  useEffect(() => setActive(0), [q])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      // Focus after the open animation starts.
      const t = setTimeout(() => inputRef.current?.focus(), 40)
      return () => clearTimeout(t)
    }
  }, [open])

  function choose(item) {
    if (!item) return
    navigate(item.to)
    onClose()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close search"
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="chrome-glass relative w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl shadow-black/60"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search size={18} className="text-slate-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search pages, words, writings…"
                className="w-full bg-transparent py-4 text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-500">
                  No matches for “{q}”.
                </p>
              ) : (
                results.map((item, i) => (
                  <button
                    key={`${item.kind}-${item.to}-${item.label}-${i}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      active === i ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-indigo-300">
                      <item.Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-100">
                        {item.label}
                      </span>
                      {item.sub && (
                        <span className="block truncate text-xs text-slate-500">
                          {item.sub}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      {item.kind}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ArrowUp size={11} />
                <ArrowDown size={11} /> navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft size={11} /> open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
