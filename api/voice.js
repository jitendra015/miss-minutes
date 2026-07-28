import OpenAI from 'openai'

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return sendJson(response, 405, { error: 'Method not allowed.' })
  }
  if (!process.env.OPENAI_API_KEY) return sendJson(response, 503, { error: 'AI service is not configured yet.' })

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body ?? {}
    if (typeof body.text !== 'string' || !body.text.trim()) return sendJson(response, 400, { error: 'Text is required.' })

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const speech = await client.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: process.env.OPENAI_TTS_VOICE?.trim() || 'shimmer',
      input: body.text.trim().slice(0, 8000),
      instructions: 'Speak warmly and naturally with a feminine-sounding voice. You are Miss Minutes, a helpful private assistant.',
      response_format: 'mp3',
    })

    response.statusCode = 200
    response.setHeader('Content-Type', 'audio/mpeg')
    response.setHeader('Cache-Control', 'no-store')
    response.end(Buffer.from(await speech.arrayBuffer()))
  } catch (error) {
    console.error('Miss Minutes voice error:', error)
    return sendJson(response, 502, { error: 'Miss Minutes could not generate speech.' })
  }
}
