export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const apiKey = config.loqateApiKey as string
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Loqate API key is not configured' })
  }

  if (!body.address) {
    throw createError({ statusCode: 400, statusMessage: 'address is required' })
  }

  const addressText = Array.isArray(body.address) ? body.address.join(', ') : body.address

  // Step 1: Find — search for the address the user entered
  const findParams: Record<string, string> = {
    Key: apiKey,
    Text: addressText,
    IsMiddleware: 'true',
    Limit: '1',
  }
  if (body.country) {
    findParams.Countries = body.country
  }

  const findResponse: any = await $fetch('https://api.addressy.com/Capture/Interactive/Find/v1.10/json3.ws', {
    query: findParams,
  })

  if (!findResponse?.Items?.length || findResponse.Items[0].Error) {
    return { verified: false, match: null }
  }

  // Walk down containers until we get an Address type
  let item = findResponse.Items[0]
  let maxDepth = 5
  while (item.Type !== 'Address' && maxDepth > 0) {
    const drillResponse: any = await $fetch('https://api.addressy.com/Capture/Interactive/Find/v1.10/json3.ws', {
      query: {
        Key: apiKey,
        Text: item.Text,
        IsMiddleware: 'true',
        Container: item.Id,
        Limit: '1',
      },
    })
    if (!drillResponse?.Items?.length || drillResponse.Items[0].Error) break
    item = drillResponse.Items[0]
    maxDepth--
  }

  if (item.Type !== 'Address') {
    return { verified: false, match: null }
  }

  // Step 2: Retrieve — get the full standardized address
  const retrieveResponse: any = await $fetch('https://api.addressy.com/Capture/Interactive/Retrieve/v1.20/json3.ws', {
    query: {
      Key: apiKey,
      Id: item.Id,
    },
  })

  if (!retrieveResponse?.Items?.length || retrieveResponse.Items[0].Error) {
    return { verified: false, match: null }
  }

  return { verified: true, match: retrieveResponse.Items[0] }
})
