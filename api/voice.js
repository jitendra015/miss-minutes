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
  if (!process.env.GROQ_API_KEY) return sendJson(response, 503, { error: 'AI service is not configured yet.' })

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body ?? {}
    if (typeof body.text !== 'string' || !body.text.trim()) return sendJson(response, 400, { error: 'Text is required.' })
    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'canopylabs/orpheus-v1-english', voice: process.env.GROQ_TTS_VOICE?.trim() || 'hannah', input: `[warm] ${body.text.trim().slice(0, 190)}`, response_format: 'wav' }),
    })
    if (!groqResponse.ok) throw new Error(`Groq voice request failed with ${groqResponse.status}.`)
    response.statusCode = 200
    response.setHeader('Content-Type', 'audio/wav')
    response.setHeader('Cache-Control', 'no-store')
    response.end(Buffer.from(await groqResponse.arrayBuffer()))
  } catch (error) {
    console.error('Miss Minutes voice error:', error)
    return sendJson(response, 502, { error: 'Miss Minutes could not generate speech.' })
  }
}
