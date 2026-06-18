import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { tap, springSnappy, springSoft } from '../lib/motion'

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ className = '', hover = true, children, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={springSoft}
      className={`card ${hover ? 'card-hover' : ''} p-5 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ── Page header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/15 text-indigo-200 ring-1 ring-inset ring-white/10">
            <Icon size={24} strokeWidth={2} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Button ──────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', className = '', children, ...props }) {
  const base =
    'group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070d]'
  const variants = {
    primary:
      'sheen bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50',
    secondary:
      'border border-white/10 bg-white/[0.06] text-slate-100 hover:border-white/20 hover:bg-white/[0.1]',
    ghost: 'text-slate-300 hover:bg-white/[0.06]',
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

// ── Icon button ───────────────────────────────────────────────────────────
export function IconButton({ label, className = '', children, ...props }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.08 }}
      transition={springSnappy}
      title={label}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// ── Text input ──────────────────────────────────────────────────────────────
export function Input({ icon: Icon, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <Icon
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
      )}
      <input
        className={`w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-slate-100 placeholder-slate-500 transition-colors focus:border-indigo-400/60 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/25 ${
          Icon ? 'pl-10 pr-4' : 'px-4'
        }`}
        {...props}
      />
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-white/[0.06] text-slate-200 ring-white/10',
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

// ── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="card reveal flex flex-col items-center border-dashed p-10 text-center">
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 text-indigo-300 ring-1 ring-inset ring-white/10"
      >
        <Icon size={26} strokeWidth={1.75} />
      </motion.div>
      <p className="font-semibold text-slate-100">{title}</p>
      {children && <p className="mt-1 text-sm text-slate-400">{children}</p>}
    </div>
  )
}
