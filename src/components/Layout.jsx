import { Suspense } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Languages,
  PenLine,
  BookMarked,
  BarChart3,
  Flame,
  GraduationCap,
} from 'lucide-react'
import { useStreak } from '../hooks/useStreak'
import { pageTransition, springSnappy } from '../lib/motion'
import Spinner from './Spinner'

const NAV = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/translator', label: 'Translator', Icon: Languages },
  { to: '/writing', label: 'Writing', Icon: PenLine },
  { to: '/vocabulary', label: 'Vocabulary', Icon: BookMarked },
  { to: '/progress', label: 'Progress', Icon: BarChart3 },
]

function NavItem({ to, label, Icon, end, layout }) {
  const isMobile = layout === 'mobile'
  return (
    <NavLink
      to={to}
      end={end}
      className={isMobile ? 'relative block flex-1' : 'relative block'}
    >
      {({ isActive }) => (
        <>
          {/* Animated active indicator shared across items via layoutId */}
          {isActive &&
            (isMobile ? (
              <motion.span
                layoutId="navPillMobile"
                className="absolute inset-x-5 -top-px h-0.5 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400"
                transition={springSnappy}
              />
            ) : (
              <motion.span
                layoutId="navPill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/10 ring-1 ring-inset ring-indigo-400/25"
                transition={springSnappy}
              />
            ))}
          <span
            className={
              isMobile
                ? `relative z-10 flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
                    isActive ? 'text-indigo-300' : 'text-slate-400'
                  }`
                : `relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-indigo-200'
                      : 'text-slate-400 hover:text-slate-100'
                  }`
            }
          >
            <Icon size={isMobile ? 20 : 18} strokeWidth={2} />
            <span>{label}</span>
          </span>
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const streak = useStreak() // records today's visit app-wide
  const location = useLocation()

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-slate-950 text-slate-200">
      {/* Decorative ambient gradient mesh */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="animate-drift absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-600/15 blur-3xl" />
        <div
          className="animate-drift absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/12 blur-3xl"
          style={{ animationDelay: '-6s' }}
        />
        <div
          className="animate-drift absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-500/10 blur-3xl"
          style={{ animationDelay: '-12s' }}
        />
        {/* Fine grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Desktop sidebar */}
      <aside className="glass-strong fixed inset-y-0 left-0 hidden w-60 flex-col border-y-0 border-l-0 border-r border-white/5 p-4 md:flex">
        <div className="mb-7 flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-600/30">
            <GraduationCap size={20} strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-gradient text-base font-extrabold leading-none">
              English Hub
            </div>
            <motion.div
              key={streak.currentStreak}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-300"
            >
              <Flame size={12} className="fill-amber-400/30" />
              {streak.currentStreak} day streak
            </motion.div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} layout="desktop" />
          ))}
        </nav>
        <div className="px-2 text-xs text-slate-600">Learn a little daily.</div>
      </aside>

      {/* Main content with route transitions */}
      <main className="px-4 pb-28 pt-6 md:ml-60 md:px-8 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
            >
              <Suspense
                fallback={
                  <div className="flex justify-center py-20">
                    <Spinner label="Loading…" />
                  </div>
                }
              >
                <Outlet context={{ streak }} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="glass-strong fixed inset-x-0 bottom-0 z-20 flex border-x-0 border-b-0 border-t border-white/5 pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} layout="mobile" />
        ))}
      </nav>
    </div>
  )
}
