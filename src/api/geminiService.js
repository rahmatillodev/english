// All AI calls for the app live here, using the Google AI Studio
// (Gemini) API via the Generative Language REST endpoint.
//
// NOTE ON SECURITY: this calls the Gemini API directly from the browser, so the
// API key ships to the client. That's an accepted tradeoff for a single-user
// personal project (see README). To harden it, route these calls through a
// Netlify Function and keep the key server-side — the function would accept the
// same { prompt, schema } shape and the UI wouldn't change. Also restrict the
// key in Google AI Studio (HTTP referrer / API restrictions).

// Fast, capable, low-cost model. Swap to another id (e.g. gemini-2.5-pro) here.
const MODEL = 'gemini-2.5-flash'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export class ApiKeyMissingError extends Error {
  constructor() {
    super('No API key set. Add VITE_GEMINI_API_KEY to your .env file.')
    this.name = 'ApiKeyMissingError'
  }
}

// Gemini's responseSchema uses an OpenAPI-3.0 subset: types are UPPERCASE and
// `additionalProperties` is not allowed. Convert our JSON-Schema definitions to
// that shape so we can keep writing them in the familiar lowercase style below.
function toGeminiSchema(node) {
  if (Array.isArray(node)) return node.map(toGeminiSchema)
  if (node && typeof node === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(node)) {
      if (key === 'additionalProperties') continue
      if (key === 'type' && typeof value === 'string') {
        out.type = value.toUpperCase()
      } else if (key === 'properties' && value && typeof value === 'object') {
        out.properties = Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, toGeminiSchema(v)]),
        )
      } else if (key === 'items') {
        out.items = toGeminiSchema(value)
      } else {
        out[key] = value
      }
    }
    // Keep a stable field order in the model's output.
    if (out.type === 'OBJECT' && Array.isArray(out.required)) {
      out.propertyOrdering = out.required
    }
    return out
  }
  return node
}

// Low-level request: sends a prompt and constrains the reply to `schema` using
// structured output (responseMimeType + responseSchema), then returns the
// parsed object.
async function requestJSON(prompt, schema, { system, maxTokens = 2048 } = {}) {
  if (!API_KEY) throw new ApiKeyMissingError()

  let res
  try {
    res = await fetch(`${API_URL}?key=${encodeURIComponent(API_KEY)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...(system
          ? { systemInstruction: { parts: [{ text: system }] } }
          : {}),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: toGeminiSchema(schema),
          maxOutputTokens: maxTokens,
          // Skip "thinking" — these are short structured tasks, so this is
          // faster, cheaper, and keeps the whole token budget for the answer.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })
  } catch (networkErr) {
    throw new Error(
      `Network error reaching Gemini. Check your connection. (${networkErr.message})`,
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
    if (res.status === 400 && /api[_ ]?key/i.test(detail)) {
      throw new Error('Invalid API key. Check VITE_GEMINI_API_KEY.')
    }
    if (res.status === 403) {
      throw new Error(
        'Access denied (403). Check the key and its API restrictions in Google AI Studio.',
      )
    }
    if (res.status === 429) {
      throw new Error('Rate limited (429). Wait a moment and try again.')
    }
    throw new Error(`Gemini API error ${res.status}: ${detail}`)
  }

  const data = await res.json()

  // The prompt itself can be blocked before any candidate is produced.
  if (data?.promptFeedback?.blockReason) {
    throw new Error(
      `The request was blocked (${data.promptFeedback.blockReason}). Try rephrasing.`,
    )
  }

  const candidate = data?.candidates?.[0]
  const finish = candidate?.finishReason
  if (finish === 'SAFETY' || finish === 'RECITATION') {
    throw new Error('The model declined to answer this request.')
  }

  const text =
    candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join('') ?? ''
  if (!text) {
    if (finish === 'MAX_TOKENS') {
      throw new Error('Response was cut off (token limit). Please try again.')
    }
    throw new Error('Empty response from the model. Please try again.')
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
    maxTokens: 3072,
  })
}

export function hasApiKey() {
  return Boolean(API_KEY)
}
