export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const apiKey = config.loqateApiKey as string
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Loqate API key is not configured' })
  }

  const text = query.text as string
  const container = query.container as string | undefined
  const country = query.country as string | undefined

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'text is required' })
  }

  const params: Record<string, string> = {
    Key: apiKey,
    Text: text,
    IsMiddleware: 'true',
    Limit: '7',
  }

  if (container) {
    params.Container = container
  }

  if (country) {
    params.Countries = country
  }

  // Forward client IP as Origin for location biasing (Loqate best practice)
  const clientIp = getRequestIP(event, { xForwardedFor: true })
  if (clientIp) {
    params.Origin = clientIp
  }

  const response = await $fetch<any>(
    'https://api.addressy.com/Capture/Interactive/Find/v1.20/json6.ws',
    { query: params }
  )

  return response
})
