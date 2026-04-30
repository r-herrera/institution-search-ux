export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const apiKey = config.loqateApiKey as string
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Loqate API key is not configured' })
  }

  const id = query.id as string

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const response = await $fetch<any>(
    'https://api.addressy.com/Capture/Interactive/Retrieve/v1.30/json6.ws',
    {
      query: {
        Key: apiKey,
        Id: id,
      },
    }
  )

  return response
})
