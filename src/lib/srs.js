// Spaced-repetition scheduling (a small SM-2 variant) for the vocabulary bank.
// Two grades only — "remembered" / "forgot" — to match the flashcard UI.
//
// Each card carries an `srs` object: { reps, interval, ease, due }.
//   reps     — number of consecutive successful reviews
//   interval — days until the next review
//   ease     — multiplier that grows the interval as a card gets easier
//   due      — "YYYY-MM-DD" day key on/after which the card should be reviewed
//
// Legacy cards saved before SRS existed have no `srs`; `dueKey()` treats them as
// due now so they slot straight into the next session.

import { dayKey } from './storage'

const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3
const MAX_EASE = 2.8

// Fresh scheduling state for a brand-new card (due immediately).
export function newSrs(due = dayKey()) {
  return { reps: 0, interval: 0, ease: DEFAULT_EASE, due }
}

// Add `days` to a "YYYY-MM-DD" key and return the resulting key.
function addDays(key, days) {
  const d = new Date(`${key}T00:00:00`)
  d.setDate(d.getDate() + days)
  return dayKey(d)
}

// The day key a card is due — falling back to its add date (or today) for cards
// that predate SRS so they count as due right away.
export function dueKey(card, today = dayKey()) {
  return card?.srs?.due ?? card?.dateAdded ?? today
}

// Day keys are zero-padded and sortable, so a string compare is a date compare.
export function isDue(card, today = dayKey()) {
  return dueKey(card, today) <= today
}

export function dueCount(vocab, today = dayKey()) {
  return vocab.reduce((n, c) => (isDue(c, today) ? n + 1 : n), 0)
}

// Compute the next scheduling state after a review.
// `remembered` true → push the interval out; false → reset and relearn soon.
export function schedule(srs, remembered, today = dayKey()) {
  const base = srs ?? newSrs(today)
  let { reps, interval, ease } = base

  if (remembered) {
    reps += 1
    if (reps === 1) interval = 1
    else if (reps === 2) interval = 3
    else interval = Math.max(1, Math.round(interval * ease))
    ease = Math.min(MAX_EASE, ease + 0.05)
  } else {
    reps = 0
    interval = 0 // due again from today; resurfaces next session
    ease = Math.max(MIN_EASE, ease - 0.2)
  }

  return { reps, interval, ease, due: addDays(today, interval) }
}

// Human-friendly description of when a card is next due, for the list UI.
export function dueLabel(card, today = dayKey()) {
  const due = dueKey(card, today)
  if (due <= today) return 'Due now'
  const days = Math.round(
    (new Date(`${due}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000,
  )
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

// Fisher–Yates shuffle (returns a new array).
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
