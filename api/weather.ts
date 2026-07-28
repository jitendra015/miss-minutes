import type { IncomingMessage, ServerResponse } from 'node:http'

type Place = { name: string; country?: string; admin1?: string; latitude: number; longitude: number }
type Weather = { current?: { temperature_2m?: number; apparent_temperature?: number; weather_code?: number; wind_speed_10m?: number } }

const conditions: Record<number, string> = {
  0: 'clear skies', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'foggy', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain', 71: 'light snow', 73: 'snow',
  75: 'heavy snow', 80: 'rain showers', 81: 'rain showers', 82: 'heavy rain showers',
  95: 'a thunderstorm', 96: 'a thunderstorm with hail', 99: 'a severe thunderstorm with hail',
}

function sendJson(response: ServerResponse, statusCode: number, body: Record<string, unknown>) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return sendJson(response, 405, { error: 'Method not allowed.' })
  }

  const city = new URL(request.url ?? '/', 'http://localhost').searchParams.get('city')?.trim()
  if (!city) return sendJson(response, 400, { error: 'A city is required.' })

  try {
    const locationUrl = new URL('https://geocoding-api.open-meteo.com/v1/search')
    locationUrl.search = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' }).toString()
    const locationData = await fetch(locationUrl).then((result) => result.json()) as { results?: Place[] }
    const place = locationData.results?.[0]
    if (!place) return sendJson(response, 404, { error: `I could not find ${city}.` })

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude), longitude: String(place.longitude), timezone: 'auto',
      current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    }).toString()
    const forecast = await fetch(forecastUrl).then((result) => result.json()) as Weather
    const current = forecast.current
    if (typeof current?.temperature_2m !== 'number') throw new Error('No current conditions returned')

    const placeName = [place.name, place.admin1, place.country].filter(Boolean).join(', ')
    const condition = conditions[current.weather_code ?? -1] ?? 'conditions unavailable'
    const feelsLike = typeof current.apparent_temperature === 'number' ? ` It feels like ${Math.round(current.apparent_temperature)}°C.` : ''
    const wind = typeof current.wind_speed_10m === 'number' ? ` Wind is ${Math.round(current.wind_speed_10m)} km/h.` : ''
    return sendJson(response, 200, { reply: `In ${placeName}, it is ${Math.round(current.temperature_2m)}°C with ${condition}.${feelsLike}${wind}` })
  } catch (error) {
    console.error('Weather lookup error:', error)
    return sendJson(response, 502, { error: 'Weather is unavailable right now.' })
  }
}
