// Shared Framer Motion variants — consistent rhythm across the app.
// MotionConfig (main.jsx) disables these under "reduce motion".
//
// IMPORTANT: variants animate only opacity + transform (no `filter`), and the
// route transition is entrance-only (see Layout) so page content can never get
// stuck hidden behind an unfinished exit animation.

export const easeOut = [0.22, 1, 0.36, 1]
export const easeIn = [0.64, 0, 0.78, 0]

export const springSoft = { type: 'spring', stiffness: 260, damping: 26 }
export const springSnappy = { type: 'spring', stiffness: 420, damping: 30 }
export const springBouncy = { type: 'spring', stiffness: 500, damping: 18 }

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
}

// Container that staggers its children's entrance.
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

// Per-item variant used inside a `stagger` container.
export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
}

// Entrance-only page transition (no `exit`, no AnimatePresence required).
export const pageEnter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
}

export const tap = { scale: 0.96 }
