import { Star } from 'lucide-react'

// Read-only 5-star rating display. `value` is 0–5 (rounded to nearest int).
export default function StarRating({ value = 0, max = 5, label, size = 15 }) {
  const filled = Math.max(0, Math.min(max, Math.round(value)))
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${value}/${max}`}
      aria-label={`${filled} out of ${max} stars`}
    >
      {label && <span className="mr-1 text-sm text-slate-400">{label}</span>}
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          aria-hidden="true"
          className={i < filled ? 'text-amber-400' : 'text-slate-600'}
          fill={i < filled ? 'currentColor' : 'none'}
          strokeWidth={2}
        />
      ))}
    </span>
  )
}
