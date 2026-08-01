import { useEffect, useMemo, useState } from 'react'
import { forgetProfile, learnFromFeedback, loadLearning, loadMessages, loadProfile, saveLearning, saveMessages, saveProfile } from '../core/memory'
import { loadReminders, parseReminder, saveReminders } from '../core/reminders'
import { ChatServiceError, getChatReply } from '../services/chat'
import type { LearningProfile, Message, Reminder } from '../types/assistant'

const greeting = (name: string): Message => ({
  id: crypto.randomUUID(),
  speaker: 'assistant',
  text: name ? `Welcome back, ${name}. What’s on your mind?` : 'Hello. I’m Miss Minutes. What should I call you?',
  createdAt: new Date().toISOString(),
})

export function useAssistant() {
  const initialProfile = useMemo(loadProfile, [])
  const initialMessages = useMemo(loadMessages, [])
  const [name, setName] = useState(initialProfile.name)
  const [learning, setLearning] = useState<LearningProfile>(loadLearning)
  const [messages, setMessages] = useState<Message[]>(initialMessages.length ? initialMessages : [greeting(initialProfile.name)])
  const [isThinking, setIsThinking] = useState(false)
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders)

  useEffect(() => { saveMessages(messages) }, [messages])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now()
      const due = reminders.filter((reminder) => !reminder.completed && new Date(reminder.dueAt).getTime() <= now)
      if (!due.length) return

      const updated = reminders.map((reminder) => due.some((item) => item.id === reminder.id) ? { ...reminder, completed: true } : reminder)
      setReminders(updated)
      saveReminders(updated)
      for (const reminder of due) {
        setMessages((current) => [...current, {
          id: crypto.randomUUID(), speaker: 'assistant', text: `Reminder: ${reminder.text}`, createdAt: new Date().toISOString(),
        }])
        if ('Notification' in window && Notification.permission === 'granted') new Notification('Miss Minutes', { body: reminder.text })
      }
    }, 10_000)
    return () => window.clearInterval(timer)
  }, [reminders])

  function begin(chosenName: string) {
    const cleanedName = chosenName.trim()
    setName(cleanedName)
    saveProfile({ name: cleanedName })
    setMessages([
      greeting(cleanedName),
      {
        id: crypto.randomUUID(),
        speaker: 'assistant',
        text: `It’s lovely to meet you${cleanedName ? `, ${cleanedName}` : ''}. Whenever you’re ready, tell me what’s on your mind.`,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  async function send(text: string) {
    const cleanedText = text.trim()
    if (!cleanedText || isThinking) return

    const userMessage: Message = {
      id: crypto.randomUUID(), speaker: 'user', text: cleanedText, createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, userMessage])

    const reminder = parseReminder(cleanedText)
    if (reminder) {
      const created = { ...reminder, id: crypto.randomUUID(), completed: false }
      const updated = [...reminders, created]
      setReminders(updated)
      saveReminders(updated)
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), speaker: 'assistant', text: `Done. I’ll remind you to ${created.text} at ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(created.dueAt))}.`, createdAt: new Date().toISOString(),
      }])
      return
    }
    setIsThinking(true)
    let reply: string
    try {
      reply = await getChatReply(cleanedText, { name }, learning, [...messages, userMessage])
    } catch (error) {
      reply = error instanceof ChatServiceError ? error.message : 'I could not reach the AI service.'
    }
    setMessages((current) => [...current, {
      id: crypto.randomUUID(), speaker: 'assistant', text: reply, createdAt: new Date().toISOString(),
    }])
    setIsThinking(false)
  }

  function reset() {
    forgetProfile()
    setName('')
    setMessages([greeting('')])
  }

  async function enableNotifications() {
    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission()
  }

  function removeReminder(id: string) {
    const updated = reminders.filter((reminder) => reminder.id !== id)
    setReminders(updated)
    saveReminders(updated)
  }

  function rateLatest(helpful: boolean) {
    const latestUser = [...messages].reverse().find((message) => message.speaker === 'user')
    if (!latestUser) return
    const updated = learnFromFeedback(learning, latestUser.text, helpful)
    setLearning(updated)
    saveLearning(updated)
  }

  function setPreferredTone(preferredTone: LearningProfile['preferredTone']) {
    const updated = { ...learning, preferredTone }
    setLearning(updated)
    saveLearning(updated)
  }

  return { name, messages, isThinking, reminders, learning, begin, send, reset, enableNotifications, removeReminder, rateLatest, setPreferredTone }
}
