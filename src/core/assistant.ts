import type { Profile } from '../types/assistant'

// This is the assistant orchestrator. It is deliberately separate from the UI
// so a hosted AI model can replace the local response engine later.
export async function createReply(input: string, profile: Profile): Promise<string> {
  const message = input.trim()
  const lower = message.toLowerCase()
  const name = profile.name ? `, ${profile.name}` : ''

  await new Promise((resolve) => setTimeout(resolve, 350))

  if (/^(hi|hello|hey)\b/.test(lower)) {
    return `Hello${name}. I’m glad you’re here. What would you like to explore together?`
  }

  if (lower.includes('what can you do')) {
    return 'Right now, I can hold a conversation, remember the name you choose on this device, and provide a base for future skills such as reminders, voice, and connected tools.'
  }

  if (lower.includes('my name is')) {
    return `Thank you${name}. I’ll use that name while you use this device.`
  }

  if (lower.includes('time')) {
    return `It’s ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date())} for you.`
  }

  return `I’m listening${name}. You said: “${message}”. The next step is connecting this conversation layer to a hosted AI model, while keeping your memory and permissions under your control.`
}
