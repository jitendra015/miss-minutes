import type { LearningProfile, Profile } from '../types/assistant'

const profileKey = 'miss-minutes.profile'
const learningKey = 'miss-minutes.learning'
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

export function forgetProfile() {
  localStorage.removeItem(profileKey)
  localStorage.removeItem(learningKey)
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
