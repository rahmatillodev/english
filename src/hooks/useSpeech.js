import { useCallback, useEffect, useState } from 'react'

// Thin wrapper around the browser's Web Speech API (SpeechSynthesis) for free,
// offline text-to-speech pronunciation. No API calls, no cost.
export function useSpeech() {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)

  // Cancel any in-flight speech when the component using this unmounts.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  const speak = useCallback(
    (text, lang = 'en-US') => {
      if (!supported || !text) return
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      utter.rate = 0.95
      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utter)
    },
    [supported],
  )

  return { speak, speaking, supported }
}
