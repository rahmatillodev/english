import { KeyRound } from 'lucide-react'
import { hasApiKey } from '../api/geminiService'

// Shown at the top of pages that need the API when no key is configured.
export default function ApiKeyBanner() {
  if (hasApiKey()) return null
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <KeyRound size={18} className="mt-0.5 shrink-0 text-amber-300" />
      <div>
        <strong className="font-semibold">No API key configured.</strong> Create
        a <code className="rounded bg-black/30 px-1">.env</code> file with{' '}
        <code className="rounded bg-black/30 px-1">VITE_GEMINI_API_KEY=…</code>{' '}
        and restart the dev server. See the README for setup.
      </div>
    </div>
  )
}
