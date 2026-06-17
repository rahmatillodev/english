import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { tap, springSnappy, springSoft } from '../lib/motion'

// Tiny presentational primitives reused across pages.

export function Card({ className = '', hover = true, children, ...props }) {
  return (
    <motion.div
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow:
                '0 24px 48px -24px rgba(0,0,0,0.75), 0 0 0 1px rgba(129,140,248,0.25), 0 0 32px -8px rgba(99,102,241,0.35)',
            }
          : undefined
      }
      transition={springSoft}
      className={`glass rounded-2xl p-5 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={springSnappy}
            className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/15 text-indigo-300 ring-1 ring-inset ring-white/10"
          >
            <Icon size={22} strokeWidth={2} />
          </motion.div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const base =
    'group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'
  const variants = {
    primary:
      'sheen bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40',
    secondary:
      'border border-white/10 bg-white/5 text-slate-100 backdrop-blur hover:border-white/20 hover:bg-white/10',
    ghost: 'text-slate-300 hover:bg-white/5',
    danger:
      'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/25 hover:shadow-rose-500/40',
  }
  return (
    <motion.button
      whileTap={tap}
      whileHover={{ scale: 1.025 }}
      transition={springSnappy}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-700/60 text-slate-200 ring-slate-500/20',
    green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-400/25',
    indigo: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/25',
    fuchsia: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/25',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl border-dashed p-10 text-center"
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 text-indigo-300 ring-1 ring-inset ring-white/10"
      >
        <Icon size={26} strokeWidth={1.75} />
      </motion.div>
      <p className="font-semibold text-slate-100">{title}</p>
      {children && <p className="mt-1 text-sm text-slate-400">{children}</p>}
    </motion.div>
  )
}
