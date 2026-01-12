import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export interface GooglePayload {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture?: string
  given_name?: string
  family_name?: string
}

export const verifyGoogleIdToken = async (idToken: string): Promise<GooglePayload> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()

    if (!payload) {
      throw new Error('Invalid Google ID token')
    }

    return {
      sub: payload.sub,
      email: payload.email!,
      email_verified: payload.email_verified!,
      name: payload.name!,
      picture: payload.picture,
      given_name: payload.given_name,
      family_name: payload.family_name
    }
  } catch {
    throw new Error('Failed to verify Google ID token')
  }
}
