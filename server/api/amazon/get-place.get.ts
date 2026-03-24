import { GetPlaceCommand } from '@aws-sdk/client-geo-places'
import { getAmazonLocationClient } from '../../utils/amazon-location-client'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const placeId = query.placeId as string

  if (!placeId) {
    throw createError({ statusCode: 400, statusMessage: 'placeId is required' })
  }

  const client = getAmazonLocationClient()

  const command = new GetPlaceCommand({
    PlaceId: placeId,
  })

  const response = await client.send(command)
  return response
})
