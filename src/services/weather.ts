function weatherLocation(message: string) {
  const match = message.match(/\b(?:weather|forecast|temperature)\b.*?\b(?:in|at|for)\s+(.+?)[?.!]*$/i)
  return match?.[1]?.trim() || null
}

export async function getWeatherReply(message: string) {
  const city = weatherLocation(message)
  if (!city) return null

  try {
    const response = await fetch(`/.netlify/functions/weather?city=${encodeURIComponent(city)}`)
    if (!response.ok) return null
    const body = await response.json() as { reply?: unknown }
    return typeof body.reply === 'string' ? body.reply : null
  } catch {
    return null
  }
}
