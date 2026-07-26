import type { Reminder } from '../types/assistant'

const remindersKey = 'miss-minutes.reminders'

export function loadReminders(): Reminder[] {
  try {
    return JSON.parse(localStorage.getItem(remindersKey) ?? '[]') as Reminder[]
  } catch {
    return []
  }
}

export function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(remindersKey, JSON.stringify(reminders))
}

export function parseReminder(message: string): Omit<Reminder, 'id' | 'completed'> | null {
  const match = message.match(/remind me in\s+(\d+)\s*(minute|minutes|hour|hours)\s+to\s+(.+)/i)
  if (!match) return null

  const amount = Number(match[1])
  const multiplier = match[2].toLowerCase().startsWith('hour') ? 60 * 60 * 1000 : 60 * 1000
  const text = match[3].replace(/[.!]+$/, '').trim()
  if (!Number.isFinite(amount) || amount < 1 || !text) return null

  return { text, dueAt: new Date(Date.now() + amount * multiplier).toISOString() }
}
