import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS, monthKey } from '../lib/storage'
import { stagger, staggerItem } from '../lib/motion'
import { Card, PageHeader, EmptyState } from '../components/ui'

const AXIS = { fill: '#94a3b8', fontSize: 12 }
const TOOLTIP_STYLE = {
  background: 'rgba(19,26,46,0.92)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 12,
  color: '#e2e8f0',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 12px 32px -12px rgba(0,0,0,0.6)',
}

function ChartCard({ title, hasData, emptyText, children }) {
  return (
    <Card variants={staggerItem} className="mb-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-200">{title}</h2>
      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">{emptyText}</p>
      )}
    </Card>
  )
}

export default function Progress() {
  const [writing] = useLocalStorage(STORAGE_KEYS.writing, [])
  const [vocab] = useLocalStorage(STORAGE_KEYS.vocabulary, [])

  // Top 5 recurring grammar mistake types.
  const grammarData = useMemo(() => {
    const tally = {}
    for (const entry of writing) {
      for (const err of entry.feedback?.errors ?? []) {
        const key = (err.type || 'other').trim()
        tally[key] = (tally[key] ?? 0) + 1
      }
    }
    return Object.entries(tally)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [writing])

  // Writings per month.
  const monthlyData = useMemo(() => {
    const tally = {}
    for (const entry of writing) {
      const key = monthKey(new Date(entry.date))
      tally[key] = (tally[key] ?? 0) + 1
    }
    return Object.entries(tally)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [writing])

  // Cumulative vocabulary growth over time.
  const vocabGrowth = useMemo(() => {
    const perDay = {}
    for (const v of vocab) {
      const key = v.dateAdded || 'unknown'
      perDay[key] = (perDay[key] ?? 0) + 1
    }
    const days = Object.keys(perDay).sort((a, b) => a.localeCompare(b))
    let running = 0
    return days.map((day) => {
      running += perDay[day]
      return { day, total: running }
    })
  }, [vocab])

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        title="Progress"
        subtitle="Track your mistakes, writing activity, and vocabulary growth."
      />

      {writing.length === 0 && vocab.length === 0 ? (
        <EmptyState icon={BarChart3} title="No data yet">
          Write essays and save vocabulary to see your progress here.
        </EmptyState>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show">
          <ChartCard
            title="Top grammar mistakes"
            hasData={grammarData.length > 0}
            emptyText="No mistakes recorded yet — check some writing first."
          >
            <BarChart
              data={grammarData}
              layout="vertical"
              margin={{ left: 20, right: 16 }}
            >
              <defs>
                <linearGradient id="grammarGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" horizontal={false} />
              <XAxis type="number" tick={AXIS} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="type"
                tick={AXIS}
                width={120}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
              <Bar dataKey="count" fill="url(#grammarGrad)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard
            title="Writings per month"
            hasData={monthlyData.length > 0}
            emptyText="No writings yet."
          >
            <BarChart data={monthlyData} margin={{ left: -10, right: 16 }}>
              <defs>
                <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS} />
              <YAxis tick={AXIS} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
              <Bar dataKey="count" fill="url(#monthlyGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard
            title="Vocabulary growth"
            hasData={vocabGrowth.length > 0}
            emptyText="No saved words yet."
          >
            <LineChart data={vocabGrowth} margin={{ left: -10, right: 16 }}>
              <defs>
                <linearGradient id="vocabGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#e879f9" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="day" tick={AXIS} />
              <YAxis tick={AXIS} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="url(#vocabGrad)"
                strokeWidth={2.5}
                dot={{ fill: '#a78bfa', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#e879f9' }}
              />
            </LineChart>
          </ChartCard>
        </motion.div>
      )}
    </div>
  )
}
