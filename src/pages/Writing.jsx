import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  PenLine,
  Sparkles,
  AlertTriangle,
  MessageSquareQuote,
  Search,
  Check,
} from 'lucide-react'
import { generateTopic, checkWriting } from '../api/geminiService'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS, makeId } from '../lib/storage'
import { renderBold } from '../lib/markup.jsx'
import { stagger, staggerItem } from '../lib/motion'
import {
  Card,
  PageHeader,
  Button,
  Badge,
  EmptyState,
  Input,
} from '../components/ui'
import StarRating from '../components/StarRating'
import Spinner from '../components/Spinner'
import ApiKeyBanner from '../components/ApiKeyBanner'
import SpeakButton from '../components/SpeakButton'
import { useToast } from '../components/Toast'

const LEVELS = ['Elementary', 'Pre-Intermediate', 'Intermediate']

function avgScore(scores) {
  if (!scores) return 0
  return (scores.ideas + scores.vocabulary + scores.grammar) / 3
}

// Plain text with the **bold** markers stripped (for text-to-speech).
function stripMarkers(text = '') {
  return text.replace(/\*\*/g, '')
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Renders one feedback object (corrected text, errors, scores, comment).
function FeedbackView({ feedback }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card hover={false} className="mt-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
          <MessageSquareQuote size={18} className="text-indigo-300" />
          Feedback
        </h3>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-5 grid grid-cols-3 gap-3"
        >
          {[
            ['Ideas', feedback.scores.ideas],
            ['Vocabulary', feedback.scores.vocabulary],
            ['Grammar', feedback.scores.grammar],
          ].map(([label, val]) => (
            <motion.div
              key={label}
              variants={staggerItem}
              className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-center"
            >
              <div className="text-xs text-slate-400">{label}</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">
                {val}
                <span className="text-sm text-slate-500">/5</span>
              </div>
              <div className="mt-1">
                <StarRating value={val} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mb-5">
          <div className="mb-2 flex items-center gap-1.5">
            <h4 className="text-sm font-semibold text-slate-400">
              Corrected version
            </h4>
            <SpeakButton text={stripMarkers(feedback.correctedText)} />
          </div>
          <p className="feedback-text whitespace-pre-wrap rounded-xl bg-slate-900/50 px-4 py-3 leading-relaxed text-slate-200">
            {renderBold(feedback.correctedText)}
          </p>
        </div>

        {feedback.errors?.length > 0 && (
          <div className="mb-5">
            <h4 className="mb-2 text-sm font-semibold text-slate-400">
              Corrections ({feedback.errors.length})
            </h4>
            <motion.ul
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {feedback.errors.map((err, i) => (
                <motion.li
                  key={i}
                  variants={staggerItem}
                  className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-rose-300 line-through">
                      {err.original}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-300">{err.correction}</span>
                    <Badge tone="slate">{err.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-400">{err.explanation}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        )}

        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
          {feedback.overallComment}
        </div>
      </Card>
    </motion.div>
  )
}

export default function Writing() {
  const toast = useToast()
  const [difficulty, setDifficulty] = useState('Elementary')
  const [topic, setTopic] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  const [userText, setUserText] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [override, setOverride] = useState(false) // bypass the required-word gate

  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.writing, [])
  const [historyQuery, setHistoryQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(8)

  const filteredHistory = useMemo(() => {
    const term = historyQuery.trim().toLowerCase()
    if (!term) return history
    return history.filter((h) => h.topic?.toLowerCase().includes(term))
  }, [history, historyQuery])

  const wordCount = useMemo(
    () => userText.trim().split(/\s+/).filter(Boolean).length,
    [userText],
  )

  // Which of the topic's required words appear in the text (whole-word, case-
  // insensitive). Drives the live chip highlighting and the check-button gate.
  const usage = useMemo(() => {
    const words = topic?.requiredWords ?? []
    const text = userText.toLowerCase()
    return words.map((w) => {
      const term = (w.en || '').toLowerCase().trim()
      const used = term
        ? new RegExp(`\\b${escapeRegExp(term)}\\b`).test(text)
        : false
      return { ...w, used }
    })
  }, [topic, userText])

  const usedCount = usage.filter((u) => u.used).length
  const hasRequired = usage.length > 0
  const allUsed = !hasRequired || usedCount === usage.length
  const missing = usage.filter((u) => !u.used)
  const gated = hasRequired && !allUsed && !override

  async function onGenerate() {
    setGenerating(true)
    setGenError('')
    setFeedback(null)
    setOverride(false)
    try {
      const data = await generateTopic(difficulty)
      setTopic(data)
      toast.success('New topic ready')
    } catch (e) {
      setGenError(e.message)
      toast.error('Could not generate topic')
    } finally {
      setGenerating(false)
    }
  }

  async function onCheck() {
    if (!userText.trim() || gated) return
    setChecking(true)
    setCheckError('')
    try {
      const data = await checkWriting({
        topic: topic?.topic,
        userText: userText.trim(),
      })
      setFeedback(data)
      const entry = {
        id: makeId(),
        topic: topic?.topic ?? '(free writing)',
        requiredWords: topic?.requiredWords ?? [],
        userText: userText.trim(),
        feedback: data,
        scores: data.scores,
        wordsUsed: usedCount,
        wordsTotal: usage.length,
        date: new Date().toISOString(),
      }
      setHistory((prev) => [entry, ...prev])
      toast.success('Feedback ready ⭐')
    } catch (e) {
      setCheckError(e.message)
      toast.error('Could not check writing')
    } finally {
      setChecking(false)
    }
  }

  // Re-open a past writing in the composer (read-back).
  function openEntry(entry) {
    setTopic(
      entry.topic === '(free writing)'
        ? null
        : {
            topic: entry.topic,
            requiredWords: entry.requiredWords,
            instructions: '',
          },
    )
    setUserText(entry.userText)
    setFeedback(entry.feedback)
    setOverride(true) // re-opened text may predate the word gate
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <PageHeader
        icon={PenLine}
        title="Writing Practice"
        subtitle="Get a topic, write, and receive detailed feedback."
      />
      <ApiKeyBanner />

      {/* Topic generation */}
      <Card hover={false} className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-400">Difficulty</span>
          <div className="relative flex rounded-xl border border-white/10 bg-white/5 p-1">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setDifficulty(l)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                  difficulty === l ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {difficulty === l && (
                  <motion.span
                    layoutId="difficultyPill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-600/30"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{l}</span>
              </button>
            ))}
          </div>
          <Button onClick={onGenerate} disabled={generating}>
            {generating ? (
              <Spinner label="Generating…" />
            ) : (
              <>
                <Sparkles size={16} /> Generate new topic
              </>
            )}
          </Button>
        </div>

        {genError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            <AlertTriangle size={15} className="shrink-0" />
            {genError}
          </div>
        )}

        <AnimatePresence mode="wait">
          {topic && (
            <motion.div
              key={topic.topic}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 border-t border-slate-700/60 pt-5"
            >
              <h3 className="text-xl font-semibold text-slate-100">
                {topic.topic}
              </h3>
              {topic.instructions && (
                <p className="mt-1 text-sm text-slate-400">
                  {topic.instructions}
                </p>
              )}
              {hasRequired && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-400">
                      Use these words
                    </h4>
                    <span
                      className={`text-xs font-semibold ${
                        allUsed ? 'text-emerald-300' : 'text-slate-400'
                      }`}
                    >
                      {usedCount}/{usage.length} used
                    </span>
                  </div>
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="flex flex-wrap gap-2"
                  >
                    {usage.map((w, i) => (
                      <motion.span
                        key={i}
                        variants={staggerItem}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm transition-colors ${
                          w.used
                            ? 'bg-emerald-500/15 text-emerald-100 ring-1 ring-inset ring-emerald-400/30'
                            : 'bg-slate-900/60 text-slate-100'
                        }`}
                        title={w.uz}
                      >
                        {w.used && (
                          <Check size={13} className="text-emerald-300" />
                        )}
                        <span>{w.en}</span>
                        <span
                          className={w.used ? 'text-emerald-300/70' : 'text-slate-500'}
                        >
                          · {w.uz}
                        </span>
                        <SpeakButton text={w.en} className="h-5 w-5 text-xs" />
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Writing input */}
      <Card hover={false} className="mb-6">
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder="Write your essay here…"
          rows={8}
          className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 placeholder-slate-500 transition-colors focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
        />
        <div className="mt-3 flex items-center justify-between">
          <motion.span
            key={wordCount}
            initial={{ scale: 1.15, color: '#818cf8' }}
            animate={{ scale: 1, color: '#64748b' }}
            transition={{ duration: 0.2 }}
            className="text-sm text-slate-500"
          >
            {wordCount} words
          </motion.span>
          <Button onClick={onCheck} disabled={checking || !userText.trim() || gated}>
            {checking ? <Spinner label="Checking…" /> : 'Check my writing'}
          </Button>
        </div>
        {gated && (
          <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                Use all {usage.length} required words before checking. Still
                missing:{' '}
                <span className="font-semibold text-amber-100">
                  {missing.map((m) => m.en).join(', ')}
                </span>
                .
                <button
                  type="button"
                  onClick={() => setOverride(true)}
                  className="ml-1 font-semibold text-amber-100 underline underline-offset-2 hover:text-white"
                >
                  Check anyway
                </button>
              </div>
            </div>
          </div>
        )}
        {checkError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            <AlertTriangle size={15} className="shrink-0" />
            {checkError}
          </div>
        )}
      </Card>

      <AnimatePresence>
        {feedback && <FeedbackView feedback={feedback} />}
      </AnimatePresence>

      {/* History */}
      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-100">
            Past writings{' '}
            <span className="text-sm font-normal text-slate-500">
              ({history.length})
            </span>
          </h2>
          {history.length > 4 && (
            <Input
              icon={Search}
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Search topics…"
              className="w-full sm:w-56"
            />
          )}
        </div>
        {history.length === 0 ? (
          <EmptyState icon={PenLine} title="No writings yet">
            Generate a topic and write your first essay.
          </EmptyState>
        ) : filteredHistory.length === 0 ? (
          <EmptyState icon={Search} title="No matches">
            No past writing matches “{historyQuery}”.
          </EmptyState>
        ) : (
          <>
          <ul className="reveal-stagger space-y-2">
            {filteredHistory.slice(0, visibleCount).map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => openEntry(h)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-indigo-400/30 hover:bg-white/[0.06]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-100">
                      {h.topic}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(h.date).toLocaleString()}
                    </span>
                  </span>
                  <span className="shrink-0">
                    <StarRating value={avgScore(h.scores)} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {filteredHistory.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((c) => c + 8)}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
            >
              Show more ({filteredHistory.length - visibleCount})
            </button>
          )}
          </>
        )}
      </section>
    </div>
  )
}
