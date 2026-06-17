import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { makeId } from '../lib/storage'

const ToastContext = createContext(null)

const TONES = {
  success: {
    Icon: CheckCircle2,
    ring: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
    iconColor: 'text-emerald-300',
  },
  error: {
    Icon: AlertTriangle,
    ring: 'border-rose-400/30 bg-rose-500/15 text-rose-100',
    iconColor: 'text-rose-300',
  },
  info: {
    Icon: Info,
    ring: 'border-indigo-400/30 bg-indigo-500/15 text-indigo-100',
    iconColor: 'text-indigo-300',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const push = useCallback(
    (message, type = 'info', duration = 3200) => {
      const id = makeId()
      setToasts((prev) => [...prev, { id, message, type }])
      timers.current[id] = setTimeout(() => remove(id), duration)
    },
    [remove],
  )

  // Stable API: toast.success() / toast.error() / toast.info()
  const api = useRef({
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  })

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const tone = TONES[t.type] ?? TONES.info
            const Icon = tone.Icon
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                onClick={() => remove(t.id)}
                className={`pointer-events-auto flex max-w-md cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/40 backdrop-blur-xl ${tone.ring}`}
              >
                <Icon size={16} className={tone.iconColor} strokeWidth={2.25} />
                <span>{t.message}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
