// Access token lives in memory only; the refresh token is persisted so a reload can
// silently restore the session. (A backend may additionally use an httpOnly cookie.)
const REFRESH_KEY = 'cms.refreshToken'

let accessToken: string | null = null

export const tokenStorage = {
  getAccessToken: () => accessToken,
  setAccessToken(token: string | null) {
    accessToken = token
  },
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY)
    } catch {
      return null
    }
  },
  setRefreshToken(token: string | null) {
    try {
      if (token) localStorage.setItem(REFRESH_KEY, token)
      else localStorage.removeItem(REFRESH_KEY)
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    accessToken = null
    this.setRefreshToken(null)
  },
}
