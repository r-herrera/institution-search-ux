import jwt from 'jsonwebtoken'

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getAppleMapsToken(): Promise<string> {
  const config = useRuntimeConfig()

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  // Step 1: Sign a JWT (auth token)
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: config.appleMapsTeamId,
    iat: now,
    exp: now + 1800,
  }

  const privateKey = (config.appleMapsPrivateKey as string).replace(/\\n/g, '\n')

  const authToken = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    keyid: config.appleMapsKeyId,
    header: { alg: 'ES256', kid: config.appleMapsKeyId as string, typ: 'JWT' },
  })

  // Step 2: Exchange JWT for a Maps access token
  const response = await $fetch<{ accessToken: string; expiresInSeconds: number }>(
    'https://maps-api.apple.com/v1/token',
    { headers: { Authorization: `Bearer ${authToken}` } },
  )

  cachedToken = {
    token: response.accessToken,
    expiresAt: Date.now() + response.expiresInSeconds * 1000,
  }
  return response.accessToken
}
