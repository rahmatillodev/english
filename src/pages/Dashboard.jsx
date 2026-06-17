import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PenLine,
  Languages,
  BookMarked,
  Flame,
  ArrowRight,
  Trophy,
} from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storage'
import { stagger, staggerItem, springSoft } from '../lib/motion'
import { Card } from '../components/ui'
import CountUp from '../components/CountUp'

function greeting(d = new Date()) {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ Icon, label, value, gradient, glow }) {
  return (
    <motion.div variants={staggerItem}>
      <Card className="flex items-center gap-4">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg ${glow} ring-1 ring-inset ring-white/15`}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
        <div>
          <div className="tabular text-2xl font-bold text-slate-50">
            <CountUp value={value} />
          </div>
          <div className="text-sm text-slate-400">{label}</div>
        </div>
      </Card>
    </motion.div>
  )
}

// Animated circular progress ring for the streak.
function StreakRing({ current, longest }) {
  const size = 84
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = longest > 0 ? Math.min(1, current / longest) : current > 0 ? 1 : 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#streakGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - ratio * c }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
        <defs>
          <linearGradient id="streakGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
      </svg>
      <motion.div
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="absolute inset-0 grid place-items-center text-2xl"
      >
        <Flame className="text-amber-400" size={26} fill="rgba(251,191,36,0.3)" />
      </motion.div>
    </div>
  )
}

const QUICK = [
  {
    to: '/writing',
    Icon: PenLine,
    label: 'Write a new essay',
    desc: 'Get a topic & AI feedback',
    gradient: 'from-indigo-500/20 to-violet-500/10',
    icon: 'text-indigo-300',
  },
  {
    to: '/translator',
    Icon: Languages,
    label: 'Translate a word',
    desc: 'English → Uzbek with examples',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    icon: 'text-emerald-300',
  },
  {
    to: '/vocabulary',
    Icon: BookMarked,
    label: 'Review vocabulary',
    desc: 'Flashcards from your bank',
    gradient: 'from-fuchsia-500/20 to-pink-500/10',
    icon: 'text-fuchsia-300',
  },
]

export default function Dashboard() {
  const { streak } = useOutletContext()
  const navigate = useNavigate()

  const [writing] = useLocalStorage(STORAGE_KEYS.writing, [])
  const [translations] = useLocalStorage(STORAGE_KEYS.translations, [])
  const [vocab] = useLocalStorage(STORAGE_KEYS.vocabulary, [])

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={staggerItem}>
        <div className="mb-2 text-sm font-medium text-slate-400">{today}</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
          {greeting()}!{' '}
          <motion.span
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 18, -8, 14, 0] }}
            transition={{ delay: 0.4, duration: 1.1 }}
            className="inline-block origin-bottom-right"
          >
            👋
          </motion.span>
        </h1>
        <p className="mt-1.5 text-slate-400">
          Ready to learn some English today?
        </p>
      </motion.div>

      {/* Streak */}
      <motion.div variants={staggerItem}>
        <Card className="mt-6 flex items-center justify-between gap-4 overflow-hidden">
          <div className="flex items-center gap-5">
            <StreakRing
              current={streak.currentStreak}
              longest={streak.longestStreak}
            />
            <div>
              <div className="text-sm text-slate-400">Current streak</div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="tabular text-3xl font-extrabold text-amber-300">
                  <CountUp value={streak.currentStreak} />
                </span>
                <span className="text-lg font-medium text-slate-400">
                  day{streak.currentStreak === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-400 ring-1 ring-inset ring-white/10">
            <Trophy size={16} className="text-amber-400" />
            Best{' '}
            <span className="tabular font-bold text-slate-100">
              {streak.longestStreak}
            </span>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={stagger}
        className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <StatCard
          Icon={PenLine}
          label="Writings submitted"
          value={writing.length}
          gradient="from-indigo-500 to-violet-600"
          glow="shadow-indigo-600/30"
        />
        <StatCard
          Icon={Languages}
          label="Words translated"
          value={translations.length}
          gradient="from-emerald-500 to-teal-600"
          glow="shadow-emerald-600/30"
        />
        <StatCard
          Icon={BookMarked}
          label="Words in vocabulary"
          value={vocab.length}
          gradient="from-fuchsia-500 to-pink-600"
          glow="shadow-fuchsia-600/30"
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={staggerItem} className="mt-9">
        <h2 className="mb-3 text-lg font-bold text-slate-100">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK.map((q) => (
            <motion.button
              key={q.to}
              onClick={() => navigate(q.to)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={springSoft}
              className="glass group flex flex-col gap-3 rounded-2xl p-4 text-left transition-colors hover:ring-1 hover:ring-inset hover:ring-indigo-400/30"
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${q.gradient} ${q.icon} ring-1 ring-inset ring-white/10`}
              >
                <q.Icon size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-1 font-semibold text-slate-100">
                  {q.label}
                  <ArrowRight
                    size={15}
                    className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </div>
                <div className="mt-0.5 text-xs text-slate-400">{q.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
