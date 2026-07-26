export type Speaker = 'assistant' | 'user'

export type Message = {
  id: string
  speaker: Speaker
  text: string
  createdAt: string
}

export type Profile = {
  name: string
}

export type Reminder = {
  id: string
  text: string
  dueAt: string
  completed: boolean
}
