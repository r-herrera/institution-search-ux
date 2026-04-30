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

  // Use structured fields for better match quality (per Loqate docs recommendation)
  if (body.locality) {
    addressInput.Locality = body.locality
  }
  if (body.administrativeArea) {
    addressInput.AdministrativeArea = body.administrativeArea
  }
  if (body.postalCode) {
    addressInput.PostalCode = body.postalCode
  }
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
  console.log("🚀 ~ match:", match)

  if (!match) {
    return { verified: false, verificationStatus: 'unverified', matchLevel: 0, match: null }
  }

  const avc: string = match.AVC || ''
  const avcStatus = avc.charAt(0) // V, P, A, R, U
  const postProcessedLevel = parseInt(avc.charAt(1)) || 0 // 0-5

  let verificationStatus: 'verified' | 'partial' | 'ambiguous' | 'unverified'
  if (avcStatus === 'V') {
    verificationStatus = 'verified'
  } else if (avcStatus === 'P') {
    verificationStatus = 'partial'
  } else if (avcStatus === 'A') {
    verificationStatus = 'ambiguous'
  } else {
    verificationStatus = 'unverified' // R (Reverted) or U (Unable to verify)
  }

  return {
    verified: verificationStatus === 'verified',
    verificationStatus,
    matchLevel: postProcessedLevel,
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
