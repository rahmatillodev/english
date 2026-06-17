// All Claude API calls for the app live here.
//
// NOTE ON SECURITY: this calls the Anthropic API directly from the browser, so
// the API key ships to the client. That's an accepted tradeoff for a single-user
// personal project (see README). To harden it, route these calls through a
// Netlify Function and keep the key server-side — the function would accept the
// same { prompt, schema } shape and the UI wouldn't change.

const API_URL = 'https://api.anthropic.com/v1/messages'

// Current, non-deprecated Sonnet. (The spec's claude-sonnet-4-20250514 retires
// 2026-06-15.) Swap to another model id here if you want.
const MODEL = 'claude-sonnet-4-6'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export class ApiKeyMissingError extends Error {
  constructor() {
    super('No API key set. Add VITE_ANTHROPIC_API_KEY to your .env file.')
    this.name = 'ApiKeyMissingError'
  }
}

// Low-level request: sends a prompt and constrains the reply to `schema` using
// structured outputs, then returns the parsed object.
async function requestJSON(prompt, schema, { system, maxTokens = 1500 } = {}) {
  if (!API_KEY) throw new ApiKeyMissingError()

  let res
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        // Required to call the API directly from a browser (opts into CORS).
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
        // Guarantee the response is valid JSON matching our schema.
        output_config: {
          format: {
            type: 'json_schema',
            schema,
          },
        },
      }),
    })
  } catch (networkErr) {
    throw new Error(
      `Network error reaching Claude. Check your connection. (${networkErr.message})`,
    )
  }

  if (!res.ok) {
    let detail = ''
    try {
      const errBody = await res.json()
      detail = errBody?.error?.message || JSON.stringify(errBody)
    } catch {
      detail = await res.text().catch(() => '')
    }
    if (res.status === 401) {
      throw new Error('Invalid API key (401). Check VITE_ANTHROPIC_API_KEY.')
    }
    if (res.status === 429) {
      throw new Error('Rate limited (429). Wait a moment and try again.')
    }
    throw new Error(`Claude API error ${res.status}: ${detail}`)
  }

  const data = await res.json()
  const text = data?.content?.find((b) => b.type === 'text')?.text ?? ''
  if (data?.stop_reason === 'refusal') {
    throw new Error('The model declined to answer this request.')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Could not parse the model response. Please try again.')
  }
}

const TUTOR_SYSTEM =
  'You are a friendly, encouraging English tutor for an Uzbek-speaking learner ' +
  'at an elementary level. Uzbek translations use the Latin Uzbek alphabet. ' +
  'Keep explanations simple, clear, and supportive.'

// ---------------------------------------------------------------------------
// 1) Translate a word or sentence (English -> Uzbek) with rich detail.
// ---------------------------------------------------------------------------
const TRANSLATE_SCHEMA = {
  type: 'object',
  properties: {
    translation: { type: 'string', description: 'Main Uzbek translation' },
    wordType: {
      type: 'string',
      description: 'Part of speech, e.g. noun, verb, adjective, or "phrase"',
    },
    explanation: {
      type: 'string',
      description: 'A short, simple explanation of meaning and usage',
    },
    examples: {
      type: 'array',
      description: 'Exactly two example sentences',
      items: {
        type: 'object',
        properties: {
          en: { type: 'string' },
          uz: { type: 'string' },
        },
        required: ['en', 'uz'],
        additionalProperties: false,
      },
    },
    synonyms: {
      type: 'array',
      description: 'Up to 5 English synonyms or near-synonyms',
      items: { type: 'string' },
    },
  },
  required: ['translation', 'wordType', 'explanation', 'examples', 'synonyms'],
  additionalProperties: false,
}

export function translate(text) {
  const prompt =
    `Translate the following English word or sentence into Uzbek and describe it ` +
    `for an elementary learner.\n\n"${text}"\n\n` +
    `Provide the main Uzbek translation, the word type, a short simple explanation, ` +
    `exactly 2 example sentences (English + Uzbek), and up to 5 English synonyms.`
  return requestJSON(prompt, TRANSLATE_SCHEMA, { system: TUTOR_SYSTEM })
}

// ---------------------------------------------------------------------------
// 2) Generate a writing topic at a chosen difficulty.
// ---------------------------------------------------------------------------
const TOPIC_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string', description: 'A short, engaging topic title' },
    instructions: {
      type: 'string',
      description:
        'Short instructions: how many sentences to write and which tense to use',
    },
    requiredWords: {
      type: 'array',
      description: 'Exactly 10 vocabulary words to use, with Uzbek translations',
      items: {
        type: 'object',
        properties: {
          en: { type: 'string' },
          uz: { type: 'string' },
        },
        required: ['en', 'uz'],
        additionalProperties: false,
      },
    },
  },
  required: ['topic', 'instructions', 'requiredWords'],
  additionalProperties: false,
}

export function generateTopic(difficulty = 'Elementary') {
  const prompt =
    `Generate one English writing-practice topic for a ${difficulty}-level learner. ` +
    `Include a topic title, exactly 10 useful vocabulary words (each with its Uzbek ` +
    `translation), and short instructions stating how many sentences to write and ` +
    `which tense to use.`
  return requestJSON(prompt, TOPIC_SCHEMA, { system: TUTOR_SYSTEM })
}

// ---------------------------------------------------------------------------
// 3) Check a piece of writing and return structured feedback.
// ---------------------------------------------------------------------------
const FEEDBACK_SCHEMA = {
  type: 'object',
  properties: {
    correctedText: {
      type: 'string',
      description:
        'The full corrected text. Wrap every word or phrase you changed in ' +
        '**double asterisks** so corrections can be highlighted.',
    },
    errors: {
      type: 'array',
      description: 'One entry per mistake found',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string', description: 'The incorrect text' },
          correction: { type: 'string', description: 'The corrected text' },
          explanation: {
            type: 'string',
            description: 'Why it was wrong and what is correct',
          },
          type: {
            type: 'string',
            description:
              'Short error category, e.g. "missing am/is/are", "verb tense", ' +
              '"spelling", "article", "word order", "preposition"',
          },
        },
        required: ['original', 'correction', 'explanation', 'type'],
        additionalProperties: false,
      },
    },
    scores: {
      type: 'object',
      description: 'Each score is an integer from 1 to 5',
      properties: {
        ideas: { type: 'integer' },
        vocabulary: { type: 'integer' },
        grammar: { type: 'integer' },
      },
      required: ['ideas', 'vocabulary', 'grammar'],
      additionalProperties: false,
    },
    overallComment: {
      type: 'string',
      description: 'A warm, encouraging overall comment',
    },
  },
  required: ['correctedText', 'errors', 'scores', 'overallComment'],
  additionalProperties: false,
}

export function checkWriting({ topic, userText }) {
  const prompt =
    `A learner wrote the following text` +
    (topic ? ` for the topic "${topic}"` : '') +
    `:\n\n"""${userText}"""\n\n` +
    `Give feedback for an elementary English learner. Return:\n` +
    `- The corrected version of their text, wrapping every changed word/phrase in **bold**.\n` +
    `- A list of each error with the original text, the correction, a simple explanation, ` +
    `and a short error category.\n` +
    `- Scores from 1 to 5 for Ideas, Vocabulary, and Grammar.\n` +
    `- A warm overall comment with encouragement.`
  return requestJSON(prompt, FEEDBACK_SCHEMA, {
    system: TUTOR_SYSTEM,
    maxTokens: 2500,
  })
}

export function hasApiKey() {
  return Boolean(API_KEY)
}
