// Small inline loading spinner.
export default function Spinner({ label = 'Thinking…' }) {
  return (
    <span className="inline-flex items-center gap-2 text-slate-300">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-indigo-300" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </span>
  )
}
