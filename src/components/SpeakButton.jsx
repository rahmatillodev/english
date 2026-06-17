import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import { useSpeech } from '../hooks/useSpeech'
import { tap } from '../lib/motion'

// A small speaker button that reads `text` aloud (English by default).
export default function SpeakButton({
  text,
  lang = 'en-US',
  className = '',
  title = 'Listen',
  size = 14,
}) {
  const { speak, speaking, supported } = useSpeech()
  if (!supported) return null

  return (
    <motion.button
      type="button"
      whileTap={tap}
      whileHover={{ scale: 1.1 }}
      onClick={(e) => {
        e.stopPropagation()
        speak(text, lang)
      }}
      title={title}
      aria-label={title}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-indigo-300 ${
        speaking ? 'text-indigo-300' : ''
      } ${className}`}
    >
      <motion.span
        animate={speaking ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={speaking ? { repeat: Infinity, duration: 0.8 } : { duration: 0.2 }}
        className="inline-flex"
      >
        <Volume2 size={size} strokeWidth={2} />
      </motion.span>
    </motion.button>
  )
}
