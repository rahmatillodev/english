# Features — English Learning Hub

A single-user, fully client-side English learning app (React + Vite + Tailwind v4,
LocalStorage, Gemini API). This document lists **what has been built** and **what
still needs to be added or improved** per feature.

---

## ✅ Features built so far

### 🏠 Dashboard (`src/pages/Dashboard.jsx`)
- Time-aware greeting (morning / afternoon / evening) with animated 👋.
- Today's date header.
- **Streak ring** — animated SVG progress ring showing current vs. longest streak.
- **Stat cards** — Writings / Translations / Vocabulary counts with animated `CountUp`.
- **Quick actions** — jump to Writing, Translator, Flashcards.
- **Recent activity feed** — merged, time-sorted list of last 5 translations + writings, each clickable.

### 🔤 Translator (`src/pages/Translator.jsx`)
- **Two-way translation** — English → Uzbek and Uzbek → English with a direction swap toggle. History records each entry's direction and re-runs it the same way.
- Structured result: translation, word type (badge), explanation, **2 examples** (en + uz), and clickable **synonyms** (click re-translates).
- **Text-to-speech** pronunciation on the word and each example (`SpeakButton`).
- Copy translation to clipboard.
- Save word to the Vocabulary Bank (de-dupes against existing words).
- **History** (last 50): search box + "Show more" pagination; click an entry to re-translate.
- Toast notifications + API-key banner + error states.

### ✍️ Writing Practice (`src/pages/Writing.jsx`)
- **Topic generation** at 3 difficulty levels (Elementary / Pre-Intermediate / Intermediate) with animated pill selector.
- Each topic gives instructions + **required words** (en · uz, each with TTS).
- **Forced required-word checking** — required-word chips light up green as you use them, with a live "X/Y used" meter. The check button is gated until all required words appear in the text (with a "Check anyway" escape), and the usage ratio is stored on each writing.
- Free-form essay textarea with **live word counter**.
- **AI feedback**: corrected version (changes in **bold**), per-error list (original → correction, type, explanation), 1–5 **star scores** for Ideas / Vocabulary / Grammar, and an encouraging overall comment.
- TTS read-back of the corrected version.
- **History**: search + "Show more"; click a past writing to re-open it (topic, text, feedback) in the composer.

### 📚 Vocabulary Bank (`src/pages/Vocabulary.jsx`)
- List of saved words with translation, example, status badge, review count, and **next-due date**.
- **Spaced repetition (SRS)** — SM-2-style scheduling (`src/lib/srs.js`). Each "Knew it / Didn't know it" grade reschedules the card; the review session pulls the words **due today** (falls back to all words when nothing is due). Replaces the need for Anki.
- **Manual word add** — add a word/translation/example by hand, not only via the Translator.
- **Flashcard shuffle** toggle to randomize the review order.
- **Filters**: All / Due / Known / Still learning (with counts) + search box + pagination.
- Toggle a word's known/learning status; remove a word; TTS pronunciation per word.
- **Flashcard review mode**: 3D flip card, progress bar, grading, and a "Session complete" screen.

### 📊 Progress (`src/pages/Progress.jsx`)
- **Writing scores over time** — multi-line chart of Ideas / Vocabulary / Grammar scores per writing.
- **Top grammar mistakes** — horizontal bar chart (top 5 error types).
- **Writings per month** — bar chart.
- **Vocabulary growth** — cumulative line chart over time.
- Built with recharts; graceful empty states.

### ⚙️ Settings (`src/pages/Settings.jsx`)
- **Data backup** — export all app data (translations, writings, vocabulary, streak) to a timestamped JSON file, and import/restore it (`src/lib/backup.js`). The only safeguard against losing history when site data is cleared.
- **Reset** — wipe all data, with a confirm step.

### 🧱 Cross-cutting / infrastructure
- **Command palette** (`Cmd/Ctrl+K`) — jump to any page or search saved words, translations, writings (`CommandPalette.jsx`).
- **Daily streak tracking** (`useStreak.js`) — counts consecutive days, tracks longest.
- **Layout** with desktop sidebar + mobile bottom nav, animated active pill, lazy-loaded pages.
- **Text-to-speech** via Web Speech API (`useSpeech.js`) — free, offline, no cost.
- **Toast** notification system, **Spinner**, **StarRating**, **CountUp**, reusable **ui.jsx** primitives (Card, Button, Badge, Input, EmptyState, PageHeader).
- **Gemini service** (`geminiService.js`) — structured JSON outputs via `responseSchema`, API-key detection, typed errors.
- LocalStorage persistence; Netlify deploy config.

---

## 🚧 To add / improve on existing features

### Translator
- [x] **Reverse translation** (Uzbek → English) / language direction toggle. ✅ shipped
- [ ] Full-sentence/paragraph translation mode (currently best for words/short phrases).
- [ ] Delete or clear individual history entries (currently only auto-capped at 50).
- [ ] Save *any* synonym directly to the bank, not just the main translation.
- [ ] Show whether a word is already saved *in the history list*, not just on the result card.

### Writing Practice
- [x] **Validate required-word usage** — live chips + gated check button. ✅ shipped
- [x] Track score trend over time (shown in Progress). ✅ shipped
- [ ] Editing/continuing a re-opened past writing should let you re-check it (currently read-back only).
- [ ] More difficulty levels (Upper-Intermediate, Advanced) + topic categories.
- [ ] Delete past writings; export a writing + feedback (PDF / copy).
- [ ] Minimum word-count target per difficulty, with a gentle nudge.

### Vocabulary Bank
- [x] **Spaced-repetition scheduling (SRS)** — due-based review sessions. ✅ shipped (replaces Anki)
- [x] **Manual word add**. ✅ shipped
- [x] Flashcard **shuffle**. ✅ shipped
- [ ] Edit an existing word's translation/example.
- [ ] Flashcard direction toggle (Uzbek → English).
- [ ] Bulk actions (select multiple, mark known, delete).
- [ ] Tags or categories for words.

### Progress
- [x] **Writing score trends** (Ideas / Vocabulary / Grammar over time). ✅ shipped
- [ ] Streak history / calendar heatmap.
- [ ] Date-range filter for charts.
- [ ] Words learned vs. still learning ratio (known/unknown breakdown).
- [ ] Required-words-used trend (data is now stored per writing).

### Dashboard
- [ ] Daily goal / target (e.g. "review 10 words today") with progress.
- [ ] Surface the flashcards-**due** count (SRS now exposes it).

### Cross-cutting / new
- [x] **Data export/import / backup** of all LocalStorage, on a Settings page. ✅ shipped
- [ ] **Speaking practice** (microphone + speech recognition) — listed in README as future.
- [ ] Grammar reference section.
- [ ] Expand Settings (model choice, voice/rate for TTS, theme).
- [ ] **Serverless proxy** (Netlify Function) so the Gemini key is not bundled into the client (current known security tradeoff).
- [ ] Light theme / theme toggle (app is dark-only).
- [ ] Accessibility pass (focus traps in modals, ARIA on flashcards, reduced-motion support).
- [ ] Tests (no test suite currently).
