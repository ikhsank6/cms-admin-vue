import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { tokenStorage } from '@/services/token-storage'

vi.mock('@/services/auth', () => ({
  authService: {
    login: vi.fn(async () => ({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 900,
      user: { id: 1, name: 'Ed', email: 'e@x', permissions: ['page.view'], roles: [] },
    })),
    logout: vi.fn(async () => {}),
    me: vi.fn(),
  },
}))

const { useAuthStore } = await import('./auth')

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    tokenStorage.clear()
  })

  it('logs in, exposes permissions and logs out', async () => {
    const auth = useAuthStore()
    await auth.login('e@x', 'secret')
    expect(auth.isAuthenticated).toBe(true)
    expect(tokenStorage.getAccessToken()).toBe('a')
    expect(tokenStorage.getRefreshToken()).toBe('r')
    expect(auth.can('page.view')).toBe(true)
    expect(auth.can('page.delete')).toBe(false)

    await auth.logout()
    expect(auth.isAuthenticated).toBe(false)
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('init without a stored session resolves unauthenticated', async () => {
    const auth = useAuthStore()
    await auth.init()
    expect(auth.initialized).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
  })
})
