export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const text = query.text as string
  const country = query.country as string

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'text is required' })
  }

  const apiKey = config.loqateApiKey as string
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Loqate API key is not configured' })
  }

  // Step 1: Find — returns address suggestions
  const params: Record<string, string> = {
    Key: apiKey,
    Text: text,
    IsMiddleware: 'true',
    Limit: '7',
  }

  if (country) {
    params.Countries = country
  }

  const findResponse: any = await $fetch('https://api.addressy.com/Capture/Interactive/Find/v1.10/json3.ws', {
    query: params,
  })

  return findResponse
})
