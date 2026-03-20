import { getAppleMapsToken } from '../../utils/apple-maps-token'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  const limitToCountries = query.country as string

  if (!q) {
    throw createError({ statusCode: 400, statusMessage: 'q is required' })
  }

  const token = await getAppleMapsToken()

  // If q is a completionUrl path (e.g. /v1/search?q=...&metadata=...),
  // fetch it directly against Apple's API base URL.
  if (q.startsWith('/v1/')) {
    const response: any = await $fetch(`https://maps-api.apple.com${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response
  }

  const params: Record<string, string> = { q }
  if (limitToCountries) {
    params.limitToCountries = limitToCountries
  }

  const response: any = await $fetch('https://maps-api.apple.com/v1/search', {
    headers: { Authorization: `Bearer ${token}` },
    query: params,
  })
  return response
})
