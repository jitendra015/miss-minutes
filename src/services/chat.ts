import { createReply } from '../core/assistant'
import type { LearningProfile, Message, Profile } from '../types/assistant'
import { getWeatherReply } from './weather'

export async function getChatReply(message: string, profile: Profile, learning: LearningProfile, history: Message[]) {
  const weatherReply = await getWeatherReply(message)
  if (weatherReply) return weatherReply

  try {
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, name: profile.name, learning, history: history.slice(-8) }),
    })

    if (response.ok) {
      const body = await response.json() as { reply?: unknown }
      if (typeof body.reply === 'string' && body.reply.trim()) return body.reply
    }
  } catch {
    // Local development continues with the built-in assistant below.
  }

  return createReply(message, profile)
}
