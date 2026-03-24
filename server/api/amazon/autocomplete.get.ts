import { AutocompleteCommand } from '@aws-sdk/client-geo-places'
import { getAmazonLocationClient } from '../../utils/amazon-location-client'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  const country = query.country as string

  if (!q) {
    throw createError({ statusCode: 400, statusMessage: 'q is required' })
  }

  const client = getAmazonLocationClient()

  const command = new AutocompleteCommand({
    QueryText: q,
    MaxResults: 5,
    ...(country
      ? { Filter: { IncludeCountries: [country] } }
      : {}),
  })

  const response = await client.send(command)
  return response
})
