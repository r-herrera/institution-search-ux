export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const apiKey = config.loqateApiKey as string
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Loqate API key is not configured' })
  }

  // Step 2: Retrieve — fetches full address details for a selected suggestion
  const response: any = await $fetch('https://api.addressy.com/Capture/Interactive/Retrieve/v1.20/json3.ws', {
    query: {
      Key: apiKey,
      Id: id,
    },
  })

  return response
})
