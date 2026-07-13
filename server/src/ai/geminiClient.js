import { GoogleGenAI } from '@google/genai'

const PLACEHOLDER_KEY = 'your-gemini-api-key'

export function hasGeminiKey(apiKey = process.env.GEMINI_API_KEY) {
  return Boolean(apiKey && apiKey !== PLACEHOLDER_KEY)
}

export async function generateGeminiText({ systemInstruction, contents, json = false, schema, maxOutputTokens = 8192, temperature = 0.3 }, options = {}) {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY
  if (!hasGeminiKey(apiKey)) throw new Error('Gemini API key is not configured.')

  const client = options.client || new GoogleGenAI({ apiKey })
  const response = await client.models.generateContent({
    model: options.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    contents,
    config: {
      systemInstruction,
      temperature,
      maxOutputTokens,
      ...(json ? { responseMimeType: 'application/json', ...(schema ? { responseJsonSchema: schema } : {}) } : {}),
    },
  })

  const text = response?.text?.trim()
  if (!text) throw new Error('Gemini returned no content.')
  return text
}
