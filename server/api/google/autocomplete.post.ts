export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const response = await $fetch<any>('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.googlePlacesApiKey,
    },
    body: {
      input: body.input,
      ...(body.regionCode ? { includedRegionCodes: [body.regionCode] } : {}),
      ...(body.sessionToken ? { sessionToken: body.sessionToken } : {}),
    },
  })
  return response
})
