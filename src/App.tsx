import { FormEvent, useMemo, useState } from 'react'
import { useAssistant } from './hooks/useAssistant'

const preferredFemaleVoices = [
  'Microsoft Zira', 'Microsoft Jenny', 'Microsoft Aria', 'Google US English Female',
  'Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa', 'Veena', 'Fiona', 'Ava', 'Emma',
]

function femaleVoice(voices: SpeechSynthesisVoice[]) {
  const preferred = voices.find((voice) => preferredFemaleVoices.some((name) => voice.name.toLowerCase().includes(name.toLowerCase())))
  if (preferred) return preferred

  const likelyFemale = voices.find((voice) => /zira|jenny|aria|samantha|victoria|karen|moira|tessa|veena|fiona|ava|emma|female/i.test(voice.name))
  return likelyFemale ?? voices.find((voice) => voice.lang.startsWith('en'))
}

export default function App() {
  const assistant = useAssistant()
  const [chosenName, setChosenName] = useState('')
  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceNote, setVoiceNote] = useState('')
  const isReady = assistant.name.length > 0
  const latestAssistantMessage = useMemo(
    () => [...assistant.messages].reverse().find((message) => message.speaker === 'assistant'),
    [assistant.messages],
  )

  function start(event: FormEvent) {
    event.preventDefault()
    assistant.begin(chosenName)
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    const message = draft
    setDraft('')
    await assistant.send(message)
  }

  function listen() {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) {
      setVoiceNote('Voice input is not available in this browser. You can still type your message.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => setDraft(event.results[0][0].transcript)
    recognition.onerror = () => setVoiceNote('I could not hear that. Please try again or type your message.')
    recognition.onend = () => setIsListening(false)
    setVoiceNote('Listening…')
    setIsListening(true)
    recognition.start()
  }

  function speak() {
    if (!latestAssistantMessage || !('speechSynthesis' in window)) {
      setVoiceNote('Spoken replies are not available in this browser.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(latestAssistantMessage.text)
    const voice = femaleVoice(window.speechSynthesis.getVoices())
    if (voice) utterance.voice = voice
    utterance.pitch = 1.12
    utterance.rate = 0.96
    utterance.onend = () => setVoiceNote('')
    window.speechSynthesis.speak(utterance)
    setVoiceNote('Miss Minutes is speaking…')
  }

  if (!isReady) {
    return (
      <main className="welcome">
        <section className="card" aria-labelledby="welcome-title">
          <p className="eyebrow">MISS MINUTES · PRIVATE ASSISTANT</p>
          <h1 id="welcome-title">Hello. I’m Miss Minutes.</h1>
          <p className="message">A thoughtful companion built to listen, help, and grow through the features you choose.</p>
          <form onSubmit={start}>
            <label htmlFor="name">What should I call you?</label>
            <div className="field-row">
              <input id="name" value={chosenName} onChange={(event) => setChosenName(event.target.value)} placeholder="Your name" autoComplete="name" required />
              <button type="submit">Begin</button>
            </div>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="assistant-shell">
      <header>
        <div><p className="eyebrow">MISS MINUTES</p><h1>Your private conversation space</h1></div>
        <button className="quiet-button" onClick={assistant.reset}>Forget me</button>
      </header>
      <section className="reminders" aria-label="Active reminders">
        <div className="reminder-heading"><strong>Reminders</strong><button className="quiet-button" type="button" onClick={assistant.enableNotifications}>Enable notifications</button></div>
        {assistant.reminders.filter((reminder) => !reminder.completed).length ? (
          <ul>{assistant.reminders.filter((reminder) => !reminder.completed).map((reminder) => <li key={reminder.id}><span>{reminder.text} · {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(reminder.dueAt))}</span><button type="button" onClick={() => assistant.removeReminder(reminder.id)} aria-label={`Remove reminder: ${reminder.text}`}>×</button></li>)}</ul>
        ) : <p>Say “Remind me in 10 minutes to take a break.”</p>}
      </section>
      <section className="chat" aria-live="polite">
        {assistant.messages.map((message) => <article className={`bubble ${message.speaker}`} key={message.id}>{message.text}</article>)}
        {assistant.isThinking && <article className="bubble assistant">Miss Minutes is thinking…</article>}
      </section>
      <section className="learning" aria-label="Assistant learning controls">
        <span>Response style</span>
        {(['warm', 'concise', 'detailed'] as const).map((tone) => <button className="quiet-button" type="button" key={tone} aria-pressed={assistant.learning.preferredTone === tone} onClick={() => assistant.setPreferredTone(tone)}>{tone}</button>)}
        <span>Was the latest reply helpful?</span>
        <button className="quiet-button" type="button" onClick={() => assistant.rateLatest(true)}>Yes</button>
        <button className="quiet-button" type="button" onClick={() => assistant.rateLatest(false)}>No</button>
      </section>
      <form className="composer" onSubmit={send}>
        <label className="sr-only" htmlFor="message">Message Miss Minutes</label>
        <input id="message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tell Miss Minutes what’s on your mind…" disabled={assistant.isThinking} />
        <button className="voice-button" type="button" onClick={listen} disabled={assistant.isThinking || isListening} aria-label="Speak your message">🎙</button>
        <button type="submit" disabled={assistant.isThinking}>Send</button>
      </form>
      <div className="voice-actions">
        <button className="quiet-button" type="button" onClick={speak}>Read latest reply aloud</button>
        {voiceNote && <span role="status">{voiceNote}</span>}
      </div>
    </main>
  )
}
