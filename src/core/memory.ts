import type { Profile } from '../types/assistant'

const profileKey = 'miss-minutes.profile'

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
}
