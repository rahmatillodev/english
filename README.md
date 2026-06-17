# English Learning Hub

A personal, single-user English learning website: translation, writing practice
with AI feedback, a vocabulary bank with flashcards, and progress charts. Fully
client-side (LocalStorage) — no backend, no login.

Built with **React + Vite**, **Tailwind CSS v4**, **React Router**, **recharts**,
and the **Claude API** (Anthropic) for translation and writing feedback.

## Features

- **🏠 Dashboard** — greeting, daily-usage streak, stat cards, quick actions.
- **🔤 Translator** — English → Uzbek with word type, explanation, 2 examples,
  and clickable synonyms. Save words to the vocabulary bank. Keeps the last 50
  translations.
- **✍️ Writing Practice** — generate a topic (3 difficulty levels) with 10
  required words, write with a live word counter, and get feedback: a corrected
  version (changes in **bold**), per-error explanations, 1–5 star scores for
  Ideas / Vocabulary / Grammar, and an encouraging comment. Full history.
- **📚 Vocabulary Bank** — list, filter (All / Known / Still learning), and a
  flashcard review mode.
- **📊 Progress** — top grammar mistakes, writings per month, and vocabulary
  growth over time.

## Setup

```bash
npm install
cp .env.example .env      # then edit .env and paste your Anthropic API key
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

### API key

Get a key from the [Anthropic Console](https://console.anthropic.com/) and put it
in `.env`:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Vite only exposes variables prefixed with `VITE_`. **Restart `npm run dev` after
editing `.env`.** `.env` is git-ignored.

## Notes on the implementation

- **Model:** uses `claude-sonnet-4-6` (the spec's `claude-sonnet-4-20250514` is
  deprecated and retires 2026-06-15). Change it in `src/api/claudeService.js`.
- **Structured outputs:** API calls use `output_config.format` with a JSON schema,
  so responses come back as valid, typed JSON — no fragile text parsing.
- **Browser calls:** the request sends the
  `anthropic-dangerous-direct-browser-access: true` header, which is required to
  call the Anthropic API directly from a browser.

### ⚠️ Security tradeoff

Because the app calls the Anthropic API directly from the browser, **the API key
is bundled into the client and is visible to anyone who can open the deployed
site.** For a private, single-user project that's an accepted tradeoff for
simplicity. To harden it, move the calls in `src/api/claudeService.js` behind a
**Netlify Function** (serverless proxy) so the key stays server-side; the UI
wouldn't need to change.

## Data storage (LocalStorage keys)

| Key                    | Contents                                              |
| ---------------------- | ----------------------------------------------------- |
| `translations_history` | Last 50 translations                                  |
| `writing_history`      | Submitted writings + feedback                         |
| `vocabulary_bank`      | Saved words with status & review counts               |
| `streak_data`          | `{ lastActiveDate, currentStreak, longestStreak }`    |

Everything lives in your browser. Clearing site data resets the app.

## Deployment (Netlify)

`netlify.toml` is configured (`npm run build` → `dist`, with an SPA redirect).

1. Push to a Git repo and connect it in Netlify (or drag-and-drop `dist/`).
2. Set `VITE_ANTHROPIC_API_KEY` under **Site settings → Environment variables**.
3. Deploy.

## Scripts

```bash
npm run dev       # start dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # run ESLint
```

## Possible future features

Speaking practice (microphone), Anki export, audio pronunciation (TTS), and a
grammar reference section.
