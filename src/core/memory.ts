import type { LearningProfile, Message, Profile } from '../types/assistant'

const profileKey = 'miss-minutes.profile'
const learningKey = 'miss-minutes.learning'
const conversationKey = 'miss-minutes.conversation'
const maxStoredMessages = 100
const defaultLearning: LearningProfile = { preferredTone: 'warm', helpfulTopics: [], feedbackCount: 0 }

export function loadProfile(): Profile {
  const saved = localStorage.getItem(profileKey)
  if (!saved) return { name: '' }

  try {
    return JSON.parse(saved) as Profile
  } catch {
    return { name: '' }
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(profileKey, JSON.stringify(profile))
}

export function loadMessages(): Message[] {
  const saved = localStorage.getItem(conversationKey)
  if (!saved) return []

  try {
    const parsed = JSON.parse(saved) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((message): message is Message => Boolean(
      message && typeof message === 'object' && typeof message.id === 'string'
      && (message.speaker === 'user' || message.speaker === 'assistant')
      && typeof message.text === 'string' && typeof message.createdAt === 'string',
    )).slice(-maxStoredMessages)
  } catch {
    return []
  }
}

export function saveMessages(messages: Message[]) {
  localStorage.setItem(conversationKey, JSON.stringify(messages.slice(-maxStoredMessages)))
}
export function forgetProfile() {
  localStorage.removeItem(profileKey)
  localStorage.removeItem(learningKey)
  localStorage.removeItem(conversationKey)
}

export function loadLearning(): LearningProfile {
  const saved = localStorage.getItem(learningKey)
  if (!saved) return defaultLearning
  try {
    const parsed = JSON.parse(saved) as Partial<LearningProfile>
    return {
      preferredTone: parsed.preferredTone === 'concise' || parsed.preferredTone === 'detailed' ? parsed.preferredTone : 'warm',
      helpfulTopics: Array.isArray(parsed.helpfulTopics) ? parsed.helpfulTopics.filter((topic): topic is string => typeof topic === 'string').slice(0, 12) : [],
      feedbackCount: typeof parsed.feedbackCount === 'number' ? parsed.feedbackCount : 0,
    }
  } catch { return defaultLearning }
}

export function saveLearning(learning: LearningProfile) { localStorage.setItem(learningKey, JSON.stringify(learning)) }

export function learnFromFeedback(learning: LearningProfile, prompt: string, helpful: boolean): LearningProfile {
  if (!helpful) return { ...learning, feedbackCount: learning.feedbackCount + 1 }
  const words = prompt.toLowerCase().match(/[a-z]{4,}/g) ?? []
  return { ...learning, helpfulTopics: [...new Set([...learning.helpfulTopics, ...words])].slice(-12), feedbackCount: learning.feedbackCount + 1 }
}
