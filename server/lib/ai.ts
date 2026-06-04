export interface AiCategory {
  id: string
  name: string
}

export interface AiCategorizeResult {
  category_id: string
  category_name: string
  confidence: number
}

function buildPrompt(
  description: string,
  amount: string,
  type: string,
  categories: AiCategory[]
): string {
  const list = categories.map((c) => `- id: "${c.id}", name: "${c.name}"`).join('\n')
  return `You are a financial transaction categorizer for a Brazilian personal finance app.

Categorize the following transaction into exactly one of the available categories.

Transaction description: "${description}"
Amount: R$ ${amount}
Type: ${type === 'income' ? 'income (receita)' : 'expense (despesa)'}

Available categories:
${list}

Respond ONLY with valid JSON (no markdown, no explanation):
{"category_id": "<id from the list>", "category_name": "<name>", "confidence": <number between 0.0 and 1.0>}`
}

function parseResult(raw: string): AiCategorizeResult {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(cleaned)
}

export async function categorizeWithGemini(
  apiKey: string,
  description: string,
  amount: string,
  type: string,
  categories: AiCategory[]
): Promise<AiCategorizeResult> {
  const prompt = buildPrompt(description, amount, type, categories)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `Gemini error ${res.status}`
    )
  }

  const json = (await res.json()) as { candidates: { content: { parts: { text: string }[] } }[] }
  const text = json.candidates[0].content.parts[0].text
  return parseResult(text)
}

export async function categorizeWithOpenAI(
  apiKey: string,
  description: string,
  amount: string,
  type: string,
  categories: AiCategory[]
): Promise<AiCategorizeResult> {
  const prompt = buildPrompt(description, amount, type, categories)

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `OpenAI error ${res.status}`
    )
  }

  const json = (await res.json()) as { choices: { message: { content: string } }[] }
  return parseResult(json.choices[0].message.content)
}

export async function categorizeWithAnthropic(
  apiKey: string,
  description: string,
  amount: string,
  type: string,
  categories: AiCategory[]
): Promise<AiCategorizeResult> {
  const prompt = buildPrompt(description, amount, type, categories)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-20240307',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `Anthropic error ${res.status}`
    )
  }

  const json = (await res.json()) as { content: { text: string }[] }
  return parseResult(json.content[0].text)
}
