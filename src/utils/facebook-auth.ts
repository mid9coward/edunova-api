export interface FacebookPayload {
  id: string // Facebook user ID
  email: string
  name: string
  picture?: string
  first_name?: string
  last_name?: string
}

export const verifyFacebookAccessToken = async (accessToken: string): Promise<FacebookPayload> => {
  try {
    // Verify the access token with Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,email,name,picture,first_name,last_name`
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Failed to verify Facebook access token')
    }

    const payload = (await response.json()) as {
      id: string
      email: string
      name: string
      picture?: {
        data: {
          url: string
        }
      }
      first_name?: string
      last_name?: string
    }

    if (!payload.id) {
      throw new Error('Invalid Facebook access token')
    }

    // Extract picture URL from Facebook's nested structure
    const pictureUrl = payload.picture?.data?.url

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      first_name: payload.first_name,
      last_name: payload.last_name,
      picture: pictureUrl
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Failed to verify Facebook access token: ' + error.message)
    }
    throw new Error('Failed to verify Facebook access token')
  }
}
