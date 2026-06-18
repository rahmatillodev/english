import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Languages,
  PenLine,
  BookMarked,
  BarChart3,
  Flame,
  GraduationCap,
  Search,
} from 'lucide-react'
import { useStreak } from '../hooks/useStreak'
import { springSnappy } from '../lib/motion'
import Spinner from './Spinner'
import CommandPalette from './CommandPalette'

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
                    isActive ? 'text-indigo-100' : 'text-slate-400 hover:text-white'
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
  const streak = useStreak()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Global Cmd/Ctrl+K to open search.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative min-h-dvh overflow-x-hidden text-slate-200">
      {/* Aurora background */}
      <div className="aurora" aria-hidden="true">
        <div className="aurora__emerald" />
        <div className="aurora__grid" />
      </div>

      {/* Desktop sidebar */}
      <aside className="chrome-glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r p-4 md:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-600/40">
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

        {/* Search trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200"
        >
          <Search size={15} />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} layout="desktop" />
          ))}
        </nav>
        <div className="px-2 text-xs text-slate-600">Learn a little daily.</div>
      </aside>

      {/* Mobile top bar */}
      <header className="chrome-glass fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
            <GraduationCap size={18} strokeWidth={2.25} />
          </div>
          <span className="text-gradient text-sm font-extrabold">English Hub</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs font-medium text-amber-300">
            <Flame size={12} className="fill-amber-400/30" />
            {streak.currentStreak}
          </span>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10"
          >
            <Search size={18} />
          </button>
        </div>
      </header>

      {/* Main content — entrance-only transition keyed by route.
          No AnimatePresence/exit, so the page can never get stuck hidden. */}
      <main className="px-4 pb-28 pt-20 md:ml-64 md:px-8 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-4xl">
          <Suspense
            fallback={
              <div className="flex justify-center py-24">
                <Spinner label="Loading…" />
              </div>
            }
          >
            {/* key + CSS .reveal replays the entrance on every route change.
                Visibility is NOT gated on JS, so content always renders. */}
            <div key={location.pathname} className="reveal">
              <Outlet context={{ streak }} />
            </div>
          </Suspense>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="chrome-glass fixed inset-x-0 bottom-0 z-30 flex border-t pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} layout="mobile" />
        ))}
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
