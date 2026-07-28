const instructions = `You are Miss Minutes, a warm and honest conversational assistant.
Speak naturally, respect the user's privacy, and say when you do not know something.
Do not claim to have performed real-world actions unless a connected tool has confirmed them.
Keep ordinary replies concise, helpful, and human.`

const model = process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant'

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

function parseBody(body) {
  if (typeof body === 'string') return JSON.parse(body)
  if (body && typeof body === 'object') return body
  return {}
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return sendJson(response, 405, { error: 'Method not allowed.' })
  }
  if (!process.env.GROQ_API_KEY) return sendJson(response, 503, { error: 'AI service is not configured yet. Add GROQ_API_KEY in Vercel.' })

  try {
    const { message, name, learning, history } = parseBody(request.body)
    if (typeof message !== 'string' || !message.trim()) return sendJson(response, 400, { error: 'A message is required.' })

    const tone = learning?.preferredTone === 'concise' || learning?.preferredTone === 'detailed' ? learning.preferredTone : 'warm'
    const topics = Array.isArray(learning?.helpfulTopics) ? learning.helpfulTopics.filter((topic) => typeof topic === 'string').slice(-12) : []
    const context = Array.isArray(history) ? history.filter((item) => (item.speaker === 'user' || item.speaker === 'assistant') && typeof item.text === 'string').slice(-8).map((item) => `${item.speaker}: ${item.text}`).join('\n') : ''
    const system = `${instructions}\nThe user's preferred name is ${typeof name === 'string' && name.trim() ? name.trim() : 'not known'}.\nPreferred response style: ${tone}.\nHelpful-topic signals from explicit feedback: ${topics.join(', ') || 'none'}.`
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: `${context ? `Recent conversation:\n${context}\n\n` : ''}${message.trim()}` }], temperature: 0.7, max_tokens: 400 }),
    })
    const result = await groqResponse.json()
    if (!groqResponse.ok) {
      const error = new Error(typeof result?.error?.message === 'string' ? result.error.message : 'Groq request failed.')
      error.status = groqResponse.status
      throw error
    }
    const reply = result?.choices?.[0]?.message?.content
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('Groq returned an empty response.')
    return sendJson(response, 200, { reply: reply.trim() })
  } catch (error) {
    console.error('Miss Minutes chat error:', error)
    const status = typeof error?.status === 'number' ? error.status : 502
    let message = 'Miss Minutes could not reach the AI service. Check the Vercel function logs for details.'
    if (status === 401) message = 'Groq rejected the API key. Replace GROQ_API_KEY in Vercel and redeploy.'
    else if (status === 429) message = 'The Groq free-tier request limit has been reached. Please try again later.'
    return sendJson(response, status, { error: message })
  }
}
