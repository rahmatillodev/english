// Shared Framer Motion variants so animations feel consistent across the app.
// Framer's MotionConfig (see main.jsx) already disables these when the user
// has "reduce motion" enabled, so individual components don't need to guard.

export const easeOut = [0.22, 1, 0.36, 1]
export const easeIn = [0.64, 0, 0.78, 0]

// Spring presets — physics-based curves feel more natural than fixed easings.
export const springSoft = { type: 'spring', stiffness: 260, damping: 26 }
export const springSnappy = { type: 'spring', stiffness: 420, damping: 28 }
export const springBouncy = { type: 'spring', stiffness: 500, damping: 18 }

// Fade + slight rise. Good default for cards and sections.
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
}

// Container that staggers its children's entrance.
export const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

// Per-item variant used inside a `stagger` container.
export const staggerItem = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: easeOut },
  },
}

// Page/route transition — exit is faster than enter to feel responsive.
export const pageTransition = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.38, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: easeIn },
  },
}

// Subtle press feedback for interactive elements.
export const tap = { scale: 0.96 }
