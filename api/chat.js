import OpenAI from 'openai'

const instructions = `You are Miss Minutes, a warm and honest conversational assistant.
Speak naturally, respect the user's privacy, and say when you do not know something.
Do not claim to have performed real-world actions unless a connected tool has confirmed them.
Keep ordinary replies concise, helpful, and human.`

const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-luna'

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

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(response, 503, { error: 'AI service is not configured yet. Add OPENAI_API_KEY in Vercel.' })
  }

  try {
    const { message, name, learning, history } = parseBody(request.body)
    if (typeof message !== 'string' || !message.trim()) {
      return sendJson(response, 400, { error: 'A message is required.' })
    }

    const tone = learning?.preferredTone === 'concise' || learning?.preferredTone === 'detailed' ? learning.preferredTone : 'warm'
    const topics = Array.isArray(learning?.helpfulTopics) ? learning.helpfulTopics.filter((topic) => typeof topic === 'string').slice(-12) : []
    const context = Array.isArray(history) ? history.filter((item) => (item.speaker === 'user' || item.speaker === 'assistant') && typeof item.text === 'string').slice(-8).map((item) => `${item.speaker}: ${item.text}`).join('\n') : ''
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.responses.create({
      model,
      instructions: `${instructions}\nThe user's preferred name is ${typeof name === 'string' && name.trim() ? name.trim() : 'not known'}.\nPreferred response style: ${tone}.\nHelpful-topic signals from explicit feedback: ${topics.join(', ') || 'none'}.`,
      input: `${context ? `Recent conversation:\n${context}\n\n` : ''}user: ${message.trim()}`,
      text: { verbosity: 'low' },
    })

    return sendJson(response, 200, { reply: completion.output_text })
  } catch (error) {
    console.error('Miss Minutes chat error:', error)
    const status = typeof error?.status === 'number' ? error.status : 502
    const code = typeof error?.code === 'string' ? error.code : ''
    let message = 'Miss Minutes could not reach the AI service. Check the Vercel function logs for details.'

    if (status === 401) message = 'OpenAI rejected the API key. Replace OPENAI_API_KEY in Vercel with a valid OpenAI Platform key, then redeploy.'
    else if (status === 403) message = 'This OpenAI project is not permitted to use the selected model. Check the project and model access settings.'
    else if (status === 404 || code === 'model_not_found') message = 'The configured OpenAI model is unavailable. Set OPENAI_MODEL to a model enabled for this API key, then redeploy.'
    else if (status === 429) message = 'The OpenAI project has reached its rate or usage limit. Check its billing and usage limits.'

    return sendJson(response, status, { error: message })
  }
}
