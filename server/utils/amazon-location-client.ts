import { GeoPlacesClient } from '@aws-sdk/client-geo-places'
import { withAPIKey } from '@aws/amazon-location-utilities-auth-helper'

let cachedClient: GeoPlacesClient | null = null

export function getAmazonLocationClient(): GeoPlacesClient {
  if (cachedClient) {
    return cachedClient
  }

  const config = useRuntimeConfig()
  const apiKey = config.amazonLocationApiKey as string
  const region = (config.amazonLocationRegion as string) || 'us-east-1'

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Amazon Location API key is not configured',
    })
  }

  const authHelper = withAPIKey(apiKey, region)
  cachedClient = new GeoPlacesClient(authHelper.getClientConfig())

  return cachedClient
}
