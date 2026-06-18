import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Languages,
  Copy,
  Plus,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeftRight,
  Search,
} from 'lucide-react'
import { translate } from '../api/geminiService'
import { newSrs } from '../lib/srs'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  STORAGE_KEYS,
  MAX_TRANSLATION_HISTORY,
  makeId,
  dayKey,
} from '../lib/storage'
import {
  Card,
  PageHeader,
  Button,
  Badge,
  EmptyState,
  Input,
} from '../components/ui'
import Spinner from '../components/Spinner'
import ApiKeyBanner from '../components/ApiKeyBanner'
import SpeakButton from '../components/SpeakButton'
import { useToast } from '../components/Toast'

export default function Translator() {
  const toast = useToast()
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState('en-uz') // 'en-uz' | 'uz-en'
  const [result, setResult] = useState(null)
  const [resultWord, setResultWord] = useState('')
  const [resultDir, setResultDir] = useState('en-uz')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.translations, [])
  const [vocab, setVocab] = useLocalStorage(STORAGE_KEYS.vocabulary, [])

  // History search + pagination so a long list stays fast and scannable.
  const [historyQuery, setHistoryQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(12)

  const filteredHistory = useMemo(() => {
    const term = historyQuery.trim().toLowerCase()
    if (!term) return history
    return history.filter(
      (h) =>
        h.word.toLowerCase().includes(term) ||
        h.translation.toLowerCase().includes(term),
    )
  }, [history, historyQuery])

  async function runTranslate(text, dir = direction) {
    const word = text.trim()
    if (!word) return
    setDirection(dir)
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const data = await translate(word, dir)
      setResult(data)
      setResultWord(word)
      setResultDir(dir)
      const entry = {
        id: makeId(),
        word,
        translation: data.translation,
        wordType: data.wordType,
        examples: data.examples,
        synonyms: data.synonyms,
        direction: dir,
        date: new Date().toISOString(),
      }
      setHistory((prev) => [entry, ...prev].slice(0, MAX_TRANSLATION_HISTORY))
    } catch (e) {
      setError(e.message)
      setResult(null)
      toast.error('Translation failed')
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    runTranslate(input)
  }

  // Synonyms are always English, so translating one is always English → Uzbek.
  function onSynonymClick(syn) {
    setInput(syn)
    runTranslate(syn, 'en-uz')
  }

  // Re-run a history entry in the same direction it was originally done.
  function onHistoryClick(h) {
    setInput(h.word)
    runTranslate(h.word, h.direction ?? 'en-uz')
  }

  function saveToVocab() {
    if (!result) return
    // The bank always stores { word: English, translation: Uzbek }. For a
    // reverse (uz-en) lookup the English word is the result, the Uzbek the input.
    const isReverse = resultDir === 'uz-en'
    const englishWord = isReverse ? result.translation : resultWord
    const uzbek = isReverse ? resultWord : result.translation
    const entry = {
      id: makeId(),
      word: englishWord,
      translation: uzbek,
      example: result.examples?.[0]
        ? `${result.examples[0].en} — ${result.examples[0].uz}`
        : '',
      status: 'unknown',
      timesReviewed: 0,
      dateAdded: dayKey(),
      srs: newSrs(),
    }
    setVocab((prev) => [entry, ...prev])
    setSaved(true)
    toast.success(`"${englishWord}" saved to Vocabulary`)
  }

  async function copyTranslation() {
    try {
      await navigator.clipboard.writeText(result.translation)
      toast.info('Copied to clipboard')
    } catch {
      toast.error('Could not copy')
    }
  }

  // The English side of the current result — that's what the bank keys on.
  const englishOfResult =
    result && (resultDir === 'uz-en' ? result.translation : resultWord)
  const alreadyInBank =
    saved ||
    (result &&
      vocab.some(
        (v) => v.word.toLowerCase() === englishOfResult.toLowerCase(),
      ))

  return (
    <div>
      <PageHeader
        icon={Languages}
        title="Translator"
        subtitle="Translate between English and Uzbek with examples and synonyms."
      />
      <ApiKeyBanner />

      {/* Direction toggle */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-200">
          <span className={direction === 'en-uz' ? 'text-indigo-300' : 'text-slate-300'}>
            {direction === 'en-uz' ? 'English' : 'Uzbek'}
          </span>
          <ArrowRight size={14} className="text-slate-500" />
          <span className={direction === 'uz-en' ? 'text-indigo-300' : 'text-slate-300'}>
            {direction === 'en-uz' ? 'Uzbek' : 'English'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDirection((d) => (d === 'en-uz' ? 'uz-en' : 'en-uz'))}
          title="Swap direction"
          aria-label="Swap translation direction"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-300 transition-colors hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-indigo-200"
        >
          <ArrowLeftRight size={15} /> Swap
        </button>
      </div>

      <form onSubmit={onSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            direction === 'en-uz'
              ? 'Type an English word or sentence…'
              : 'Type an Uzbek word or sentence…'
          }
          autoFocus
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-slate-100 placeholder-slate-500 backdrop-blur transition-colors focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          {loading ? <Spinner label="" /> : 'Translate'}
        </Button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 flex items-center gap-2 overflow-hidden rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={resultWord + result.translation}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <Card hover={false}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    {resultWord}
                    <SpeakButton text={resultWord} />
                  </div>
                  <div className="text-2xl font-semibold text-slate-100">
                    {result.translation}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyTranslation}
                    title="Copy translation"
                    aria-label="Copy translation"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                  >
                    <Copy size={16} />
                  </button>
                  <Badge tone="indigo">{result.wordType}</Badge>
                </div>
              </div>

              <p className="mt-4 text-slate-300">{result.explanation}</p>

              {result.examples?.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-slate-400">
                    Examples
                  </h3>
                  <ul className="space-y-2">
                    {result.examples.map((ex, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-2 rounded-lg bg-slate-900/50 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="text-slate-100">{ex.en}</span>
                          <span className="mt-0.5 block text-slate-400">
                            {ex.uz}
                          </span>
                        </div>
                        <SpeakButton text={ex.en} className="mt-0.5 shrink-0" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.synonyms?.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-slate-400">
                    Synonyms{' '}
                    <span className="font-normal text-slate-500">
                      (click to translate)
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.synonyms.map((syn) => (
                      <motion.button
                        key={syn}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSynonymClick(syn)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200 transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/10 hover:text-indigo-200"
                      >
                        {syn}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Button
                  variant={alreadyInBank ? 'secondary' : 'primary'}
                  onClick={saveToVocab}
                  disabled={alreadyInBank}
                >
                  {alreadyInBank ? (
                    <>
                      <Check size={16} /> Saved to Vocabulary
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Save to Vocabulary Bank
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-100">
            History{' '}
            <span className="text-sm font-normal text-slate-500">
              ({history.length}/{MAX_TRANSLATION_HISTORY})
            </span>
          </h2>
          {history.length > 6 && (
            <Input
              icon={Search}
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Search history…"
              className="w-full sm:w-56"
            />
          )}
        </div>
        {history.length === 0 ? (
          <EmptyState icon={Languages} title="No translations yet">
            Your translation history will appear here.
          </EmptyState>
        ) : filteredHistory.length === 0 ? (
          <EmptyState icon={Search} title="No matches">
            Nothing in your history matches “{historyQuery}”.
          </EmptyState>
        ) : (
          <>
            <ul className="reveal-stagger space-y-2">
              {filteredHistory.slice(0, visibleCount).map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => onHistoryClick(h)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-indigo-400/30 hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">{h.word}</span>
                      <ArrowRight size={13} className="text-slate-600" />
                      <span className="text-slate-300">{h.translation}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {new Date(h.date).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {filteredHistory.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((c) => c + 12)}
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
