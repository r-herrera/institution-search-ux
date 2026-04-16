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

  const lines: string[] = Array.isArray(body.address) ? body.address : [body.address]

  const addressInput: Record<string, string> = {}
  lines.forEach((line, i) => {
    addressInput[`Address${i + 1}`] = line
  })
  if (body.country) {
    addressInput.Country = body.country
  }

  const response: any = await $fetch(
    'https://api.addressy.com/Cleansing/International/Batch/v1.20/json6.ws',
    {
      method: 'POST',
      body: {
        Key: apiKey,
        Addresses: [addressInput],
      },
    }
  )

  const match = response?.[0]?.Matches?.[0]

  if (!match) {
    return { verified: false, match: null }
  }

  const avc: string = match.AVC || ''
  const verified = avc.startsWith('V')

  return {
    verified,
    match: {
      Line1: match.Address1 || '',
      Line2: match.Address2 || '',
      City: match.Locality || '',
      Province: match.AdministrativeArea || '',
      ProvinceName: match.AdministrativeAreaName || '',
      PostalCode: match.PostalCode || '',
      CountryName: match.CountryName || '',
      CountryIso2: match.Country || '',
      AVC: match.AVC || '',
    },
  }
})
