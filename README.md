# English Learning Hub

A personal, single-user English learning website: translation, writing practice
with AI feedback, a vocabulary bank with flashcards, and progress charts. Fully
client-side (LocalStorage) — no backend, no login.

Built with **React + Vite**, **Tailwind CSS v4**, **React Router**, **recharts**,
and the **Gemini API** (Google AI Studio) for translation and writing feedback.

## Features

- **🏠 Dashboard** — greeting, daily-usage streak, stat cards, quick actions.
- **🔤 Translator** — two-way English ⇄ Uzbek (direction toggle) with word type,
  explanation, 2 examples, and clickable synonyms. Save words to the vocabulary
  bank. Keeps the last 50 translations.
- **✍️ Writing Practice** — generate a topic (3 difficulty levels) with 10
  required words; chips light up as you use them and the check is gated until
  all are used. Feedback gives a corrected version (changes in **bold**),
  per-error explanations, 1–5 star scores for Ideas / Vocabulary / Grammar, and
  an encouraging comment. Full history.
- **📚 Vocabulary Bank** — spaced-repetition (SRS) flashcards that surface the
  words due today, manual word add, shuffle, filters (All / Due / Known / Still
  learning), and search.
- **📊 Progress** — writing score trends, top grammar mistakes, writings per
  month, and vocabulary growth over time.
- **⚙️ Settings** — export/import a full JSON backup of your data, and reset.

## Setup

```bash
npm install
cp .env.example .env      # then edit .env and paste your Gemini API key
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

### API key

Get a free key from [Google AI Studio](https://aistudio.google.com/apikey) and
put it in `.env`:

```
VITE_GEMINI_API_KEY=AIza...
```

Vite only exposes variables prefixed with `VITE_`. **Restart `npm run dev` after
editing `.env`.** `.env` is git-ignored; `.env.example` is committed, so never
put a real key there.

## Notes on the implementation

- **Model:** uses `gemini-2.5-flash` (fast and low-cost). Change it in
  `src/api/geminiService.js` — e.g. to `gemini-2.5-pro` for higher quality.
- **Structured outputs:** API calls set `responseMimeType: application/json` with
  a `responseSchema`, so responses come back as valid, typed JSON — no fragile
  text parsing. ("Thinking" is disabled for these short tasks to keep them fast.)
- **Browser calls:** the Generative Language API supports CORS, so the browser
  calls it directly with the key in the request URL. No extra headers needed.

### ⚠️ Security tradeoff

Because the app calls the Gemini API directly from the browser, **the API key is
bundled into the client and is visible to anyone who can open the deployed
site.** For a private, single-user project that's an accepted tradeoff for
simplicity. To reduce exposure, restrict the key in Google AI Studio (HTTP
referrer / API restrictions). To harden it fully, move the calls in
`src/api/geminiService.js` behind a **Netlify Function** (serverless proxy) so
the key stays server-side; the UI wouldn't need to change.

## Data storage (LocalStorage keys)

| Key                    | Contents                                              |
| ---------------------- | ----------------------------------------------------- |
| `translations_history` | Last 50 translations (with direction)                 |
| `writing_history`      | Submitted writings + feedback + required-words used   |
| `vocabulary_bank`      | Saved words with status, review counts & SRS schedule |
| `streak_data`          | `{ lastActiveDate, currentStreak, longestStreak }`    |

Everything lives in your browser. Clearing site data resets the app — use
**Settings → Export backup** to keep a copy.

## Deployment (Netlify)

`netlify.toml` is configured (`npm run build` → `dist`, with an SPA redirect).

1. Push to a Git repo and connect it in Netlify (or drag-and-drop `dist/`).
2. Set `VITE_GEMINI_API_KEY` under **Site settings → Environment variables**.
3. Deploy.

## Scripts

```bash
npm run dev       # start dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # run ESLint
```

## Possible future features

Speaking practice (microphone), a grammar reference section, a Netlify Function
proxy to keep the Gemini key server-side, and a light-theme toggle.
