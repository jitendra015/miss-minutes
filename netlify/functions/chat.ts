import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

const instructions = `You are Miss Minutes, a warm and honest conversational assistant.
Speak naturally, respect the user's privacy, and say when you do not know something.
Do not claim to have performed real-world actions unless a connected tool has confirmed them.
Keep ordinary replies concise, helpful, and human.`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 503, body: JSON.stringify({ error: 'AI service is not configured yet.' }) }
  }

  try {
    const { message, name } = JSON.parse(event.body ?? '{}') as { message?: unknown; name?: unknown }
    if (typeof message !== 'string' || !message.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'A message is required.' }) }
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions: `${instructions}\nThe user's preferred name is ${typeof name === 'string' && name.trim() ? name.trim() : 'not known'}.`,
      input: message.trim(),
      text: { verbosity: 'low' },
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: response.output_text }),
    }
  } catch (error) {
    console.error('Miss Minutes chat error:', error)
    return { statusCode: 502, body: JSON.stringify({ error: 'Miss Minutes could not reach the AI service.' }) }
  }
}
