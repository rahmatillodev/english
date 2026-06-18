import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookMarked,
  Layers,
  X,
  Check,
  RotateCcw,
  ArrowLeft,
  PartyPopper,
  Search,
  Plus,
  Shuffle,
  CalendarClock,
} from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS, makeId, dayKey } from '../lib/storage'
import { newSrs, schedule, isDue, dueLabel, shuffle as shuffleArr } from '../lib/srs'
import {
  Card,
  PageHeader,
  Button,
  Badge,
  EmptyState,
  Input,
} from '../components/ui'
import SpeakButton from '../components/SpeakButton'
import { useToast } from '../components/Toast'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'due', label: 'Due' },
  { key: 'known', label: 'Known' },
  { key: 'unknown', label: 'Still learning' },
]

export default function Vocabulary() {
  const toast = useToast()
  const [vocab, setVocab] = useLocalStorage(STORAGE_KEYS.vocabulary, [])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(20)
  const [shuffleOn, setShuffleOn] = useState(false)

  // Manual-add form
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ word: '', translation: '', example: '' })

  // Flashcard session state
  const [flashOn, setFlashOn] = useState(false)
  const [deck, setDeck] = useState([]) // ids captured when session starts
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const term = query.trim().toLowerCase()
  const filtered = vocab.filter((v) => {
    const byStatus =
      filter === 'all'
        ? true
        : filter === 'due'
          ? isDue(v)
          : v.status === filter
    const byQuery =
      !term ||
      v.word.toLowerCase().includes(term) ||
      v.translation.toLowerCase().includes(term)
    return byStatus && byQuery
  })

  const dueCards = vocab.filter((v) => isDue(v))
  const counts = {
    all: vocab.length,
    due: dueCards.length,
    known: vocab.filter((v) => v.status === 'known').length,
    unknown: vocab.filter((v) => v.status === 'unknown').length,
  }

  function updateWord(id, patch) {
    setVocab((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }

  function removeWord(id) {
    setVocab((prev) => prev.filter((v) => v.id !== id))
    toast.info('Word removed')
  }

  function toggleStatus(v) {
    updateWord(v.id, { status: v.status === 'known' ? 'unknown' : 'known' })
  }

  // ---- Manual add ----
  function addWord(e) {
    e.preventDefault()
    const word = form.word.trim()
    const translation = form.translation.trim()
    if (!word || !translation) return
    const entry = {
      id: makeId(),
      word,
      translation,
      example: form.example.trim(),
      status: 'unknown',
      timesReviewed: 0,
      dateAdded: dayKey(),
      srs: newSrs(),
    }
    setVocab((prev) => [entry, ...prev])
    setForm({ word: '', translation: '', example: '' })
    setAdding(false)
    toast.success(`"${word}" added`)
  }

  // ---- Flashcards / SRS review ----
  // Reviews the cards that are due today; if none are due, reviews everything.
  function startReview() {
    const pool = dueCards.length > 0 ? dueCards : vocab
    let ids = pool.map((v) => v.id)
    if (ids.length === 0) return
    if (shuffleOn) ids = shuffleArr(ids)
    setDeck(ids)
    setPos(0)
    setRevealed(false)
    setFlashOn(true)
  }

  function answerCard(remembered) {
    const id = deck[pos]
    const card = vocab.find((v) => v.id === id)
    if (card) {
      updateWord(id, {
        status: remembered ? 'known' : 'unknown',
        timesReviewed: (card.timesReviewed ?? 0) + 1,
        srs: schedule(card.srs, remembered),
      })
    }
    setRevealed(false)
    setPos((p) => p + 1)
  }

  const currentCard =
    flashOn && pos < deck.length
      ? vocab.find((v) => v.id === deck[pos])
      : null
  const progress = deck.length ? (pos / deck.length) * 100 : 0
  const reviewLabel = dueCards.length > 0 ? `Review (${dueCards.length})` : 'Review all'

  return (
    <div>
      <PageHeader
        icon={BookMarked}
        title="Vocabulary Bank"
        subtitle="Spaced-repetition flashcards — review the words that are due today."
      >
        {!flashOn && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setAdding((a) => !a)}>
              <Plus size={16} /> Add word
            </Button>
            {vocab.length > 0 && (
              <Button onClick={startReview}>
                <Layers size={16} /> {reviewLabel}
              </Button>
            )}
          </div>
        )}
      </PageHeader>

      {/* Manual add form */}
      <AnimatePresence>
        {adding && !flashOn && (
          <motion.form
            onSubmit={addWord}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <Card hover={false}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={form.word}
                  onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                  placeholder="Word (English)"
                  autoFocus
                />
                <Input
                  value={form.translation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, translation: e.target.value }))
                  }
                  placeholder="Translation (Uzbek)"
                />
              </div>
              <Input
                className="mt-3"
                value={form.example}
                onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
                placeholder="Example sentence (optional)"
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!form.word.trim() || !form.translation.trim()}
                >
                  <Plus size={16} /> Add to bank
                </Button>
              </div>
            </Card>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Flashcard mode */}
      {flashOn ? (
        <Card hover={false}>
          {currentCard ? (
            <div className="py-4">
              {/* Progress */}
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Card {pos + 1} of {deck.length}
                </span>
                <span>
                  {counts.known} known · {counts.unknown} learning
                </span>
              </div>
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
                />
              </div>

              {/* Flip card */}
              <div className="h-60" style={{ perspective: 1200 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCard.id}
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -60, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="h-full"
                  >
                    <motion.div
                      onClick={() => setRevealed((r) => !r)}
                      animate={{ rotateY: revealed ? 180 : 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformStyle: 'preserve-3d' }}
                      className="relative h-full w-full cursor-pointer"
                    >
                      {/* Front */}
                      <div
                        style={{ backfaceVisibility: 'hidden' }}
                        className="glass absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-slate-50">
                            {currentCard.word}
                          </span>
                          <SpeakButton text={currentCard.word} size={18} />
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <RotateCcw size={12} /> Tap to flip
                        </span>
                      </div>
                      {/* Back */}
                      <div
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                        className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 p-6 text-center backdrop-blur"
                      >
                        <div className="text-2xl font-semibold text-indigo-200">
                          {currentCard.translation}
                        </div>
                        {currentCard.example && (
                          <p className="mt-3 max-w-md text-sm text-slate-300">
                            {currentCard.example}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="mt-6 flex justify-center">
                {revealed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Button variant="danger" onClick={() => answerCard(false)}>
                      <X size={16} /> Didn't know it
                    </Button>
                    <Button onClick={() => answerCard(true)}>
                      <Check size={16} /> Knew it
                    </Button>
                  </motion.div>
                ) : (
                  <Button variant="secondary" onClick={() => setRevealed(true)}>
                    Reveal translation
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 text-center"
            >
              <motion.div
                initial={{ rotate: -12, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-fuchsia-500/15 text-amber-300 ring-1 ring-inset ring-white/10"
              >
                <PartyPopper size={30} />
              </motion.div>
              <p className="text-lg font-bold text-slate-50">
                Session complete!
              </p>
              <p className="mt-1 text-sm text-slate-400">
                You reviewed {deck.length} card{deck.length === 1 ? '' : 's'}.
                Come back tomorrow for your next due words.
              </p>
            </motion.div>
          )}

          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => setFlashOn(false)}>
              <ArrowLeft size={16} /> Back to list
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Filters + search */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <motion.button
                  key={f.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    filter === f.key
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {f.label} ({counts[f.key]})
                </motion.button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShuffleOn((s) => !s)}
                title="Shuffle review order"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  shuffleOn
                    ? 'bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-400/30'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Shuffle size={14} /> Shuffle{shuffleOn ? ': on' : ''}
              </button>
              {vocab.length > 8 && (
                <Input
                  icon={Search}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search words…"
                  className="w-full sm:w-52"
                />
              )}
            </div>
          </div>

          {vocab.length === 0 ? (
            <EmptyState icon={BookMarked} title="Your vocabulary bank is empty">
              Save words from the Translator or add them manually to build your bank.
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No words in this filter" />
          ) : (
            <>
            <ul className="reveal-stagger space-y-2">
                {filtered.slice(0, visibleCount).map((v) => {
                  const due = isDue(v)
                  return (
                  <li key={v.id}>
                    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">
                            {v.word}
                          </span>
                          <SpeakButton text={v.word} />
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-300">{v.translation}</span>
                        </div>
                        {v.example && (
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {v.example}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                          <span>Reviewed {v.timesReviewed ?? 0}×</span>
                          <span className="text-slate-700">·</span>
                          <span
                            className={`inline-flex items-center gap-1 ${
                              due ? 'text-amber-400' : 'text-slate-500'
                            }`}
                          >
                            <CalendarClock size={12} /> {dueLabel(v)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => toggleStatus(v)}
                          title="Toggle status"
                        >
                          <Badge tone={v.status === 'known' ? 'green' : 'amber'}>
                            {v.status === 'known' ? 'Known' : 'Still learning'}
                          </Badge>
                        </button>
                        <button
                          onClick={() => removeWord(v.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
                          title="Remove"
                          aria-label="Remove word"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </Card>
                  </li>
                  )
                })}
            </ul>
            {filtered.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((c) => c + 20)}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
              >
                Show more ({filtered.length - visibleCount})
              </button>
            )}
            </>
          )}
        </>
      )}
    </div>
  )
}
