import type { LearningProfile, Message, Profile } from '../types/assistant'
import { getWeatherReply } from './weather'

export class ChatServiceError extends Error {}

export async function getChatReply(message: string, profile: Profile, learning: LearningProfile, history: Message[]) {
  const weatherReply = await getWeatherReply(message)
  if (weatherReply) return weatherReply

  let response: Response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, name: profile.name, learning, history: history.slice(-8) }),
    })
  } catch {
    throw new ChatServiceError('I could not reach the AI service. For local development, run npm run dev:vercel; for production, check that the Vercel deployment is live.')
  }

  const body = await response.json().catch(() => ({})) as { reply?: unknown; error?: unknown }
  if (!response.ok) {
    throw new ChatServiceError(typeof body.error === 'string' ? body.error : 'The AI service returned an unexpected error.')
  }
  if (typeof body.reply === 'string' && body.reply.trim()) return body.reply
  throw new ChatServiceError('The AI service returned an empty response.')
}
