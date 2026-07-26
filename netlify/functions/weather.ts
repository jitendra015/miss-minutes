import type { Handler } from '@netlify/functions'

type Place = { name: string; country?: string; admin1?: string; latitude: number; longitude: number }
type Weather = { current?: { temperature_2m?: number; apparent_temperature?: number; weather_code?: number; wind_speed_10m?: number } }

const conditions: Record<number, string> = {
  0: 'clear skies', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'foggy', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain', 71: 'light snow', 73: 'snow',
  75: 'heavy snow', 80: 'rain showers', 81: 'rain showers', 82: 'heavy rain showers',
  95: 'a thunderstorm', 96: 'a thunderstorm with hail', 99: 'a severe thunderstorm with hail',
}

export const handler: Handler = async (event) => {
  const city = event.queryStringParameters?.city?.trim()
  if (!city) return { statusCode: 400, body: JSON.stringify({ error: 'A city is required.' }) }

  try {
    const locationUrl = new URL('https://geocoding-api.open-meteo.com/v1/search')
    locationUrl.search = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' }).toString()
    const locationData = await fetch(locationUrl).then((response) => response.json()) as { results?: Place[] }
    const place = locationData.results?.[0]
    if (!place) return { statusCode: 404, body: JSON.stringify({ error: `I could not find ${city}.` }) }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude), longitude: String(place.longitude), timezone: 'auto',
      current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    }).toString()
    const forecast = await fetch(forecastUrl).then((response) => response.json()) as Weather
    const current = forecast.current
    if (typeof current?.temperature_2m !== 'number') throw new Error('No current conditions returned')

    const placeName = [place.name, place.admin1, place.country].filter(Boolean).join(', ')
    const condition = conditions[current.weather_code ?? -1] ?? 'conditions unavailable'
    const feelsLike = typeof current.apparent_temperature === 'number' ? ` It feels like ${Math.round(current.apparent_temperature)}°C.` : ''
    const wind = typeof current.wind_speed_10m === 'number' ? ` Wind is ${Math.round(current.wind_speed_10m)} km/h.` : ''

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply: `In ${placeName}, it is ${Math.round(current.temperature_2m)}°C with ${condition}.${feelsLike}${wind}` }) }
  } catch (error) {
    console.error('Weather lookup error:', error)
    return { statusCode: 502, body: JSON.stringify({ error: 'Weather is unavailable right now.' }) }
  }
}
