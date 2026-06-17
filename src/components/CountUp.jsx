import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

// Animates a number from 0 up to `value` when it mounts or `value` changes.
export default function CountUp({ value = 0, duration = 0.9 }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, duration])

  return <>{display}</>
}
