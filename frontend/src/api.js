const fallbackCasesUrl = `${import.meta.env.BASE_URL}cases.json`
const geminiModel = 'gemini-1.5-flash'
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY

let fallbackCaseCache = null

function clampEffect(value) {
  const numericValue = Number.isFinite(value) ? value : 0
  return Math.max(-20, Math.min(20, Math.trunc(numericValue)))
}

function ensureMixedEffects(effects, index) {
  const normalized = {
    trust: clampEffect(effects.trust),
    economy: clampEffect(effects.economy),
    chaos: clampEffect(effects.chaos),
  }

  const hasPositive = Object.values(normalized).some((value) => value > 0)
  const hasNegative = Object.values(normalized).some((value) => value < 0)

  if (!hasPositive || !hasNegative) {
    normalized.trust = index % 2 === 0 ? 10 : -10
    normalized.economy = index % 2 === 0 ? -5 : 5
    normalized.chaos = index % 2 === 0 ? -5 : 5
  }

  return normalized
}

function sanitizeChoice(choice, index) {
  const safeChoice = choice || {}
  return {
    text: String(safeChoice.text || `Choice ${index + 1}`),
    effects: ensureMixedEffects(safeChoice.effects || {}, index),
  }
}

function sanitizeCase(caseData) {
  const safeCase = caseData || {}
  const choices = Array.isArray(safeCase.choices) ? safeCase.choices.slice(0, 3) : []

  while (choices.length < 2) {
    choices.push({
      text: choices.length === 0 ? 'Punish' : 'Forgive',
      effects: choices.length === 0
        ? { trust: -10, economy: 5, chaos: -5 }
        : { trust: 10, economy: -5, chaos: 10 },
    })
  }

  return {
    character: String(safeCase.character || 'Unknown Citizen'),
    text: String(safeCase.text || 'A difficult case has arrived at the court.'),
    choices: choices.map((choice, index) => sanitizeChoice(choice, index)),
  }
}

async function loadFallbackCases() {
  if (!fallbackCaseCache) {
    fallbackCaseCache = fetch(fallbackCasesUrl).then(async (response) => {
      if (!response.ok) {
        throw new Error('Fallback cases are unavailable.')
      }

      return response.json()
    })
  }

  return fallbackCaseCache
}

function pickRandomCase(cases) {
  const list = Array.isArray(cases) ? cases : []
  if (!list.length) {
    return sanitizeCase()
  }

  const index = Math.floor(Math.random() * list.length)
  return sanitizeCase(list[index])
}

function extractJsonPayload(rawText) {
  const trimmedText = String(rawText || '').trim()

  if (!trimmedText) {
    throw new Error('Empty AI response.')
  }

  try {
    return JSON.parse(trimmedText)
  } catch {
    const firstBrace = trimmedText.indexOf('{')
    const lastBrace = trimmedText.lastIndexOf('}')

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmedText.slice(firstBrace, lastBrace + 1))
    }

    throw new Error('Invalid AI response format.')
  }
}

async function generateGeminiCase() {
  if (!geminiApiKey) {
    throw new Error('Gemini API key is missing.')
  }

  const prompt = [
    'Generate one courtroom case for a browser-based judge game.',
    'Return ONLY valid JSON with this shape:',
    '{"character":"...","text":"...","choices":[{"text":"...","effects":{"trust":0,"economy":0,"chaos":0}}]}',
    'Rules:',
    '- Make exactly 2 or 3 choices.',
    '- Every choice must help at least one stat and hurt at least one stat.',
    '- Stats are trust, economy, and chaos only.',
    '- Use integers between -20 and 20.',
    '- Do not use markdown or code fences.',
  ].join(' ')

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Gemini request failed.')
  }

  const payload = await response.json()
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''
  return sanitizeCase(extractJsonPayload(text))
}

export async function fetchCourtCase() {
  try {
    if (geminiApiKey) {
      return await generateGeminiCase()
    }
  } catch {
    // Fall through to local cases.
  }

  try {
    const fallbackCases = await loadFallbackCases()
    return pickRandomCase(fallbackCases)
  } catch {
    return sanitizeCase()
  }
}