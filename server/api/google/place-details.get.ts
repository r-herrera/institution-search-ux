export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const placeId = query.placeId as string

  if (!placeId) {
    throw createError({ statusCode: 400, statusMessage: 'placeId is required' })
  }

  const response = await $fetch<any>(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': config.googlePlacesApiKey,
      'X-Goog-FieldMask': 'addressComponents,formattedAddress,location',
    },
  })
  return response
})
