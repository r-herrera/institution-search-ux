export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const response = await $fetch<any>('https://addressvalidation.googleapis.com/v1:validateAddress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.googlePlacesApiKey,
    },
    body: {
      address: {
        regionCode: body.regionCode,
        addressLines: body.addressLines,
      },
    },
  })
  return response
})
