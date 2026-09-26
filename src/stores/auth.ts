import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser } from '@/types'
import { hasAnyPermission, hasPermission } from '@/config/permissions'
import { authService } from '@/services/auth'
import { refreshAccessToken } from '@/services/api'
import { tokenStorage } from '@/services/token-storage'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const initialized = ref(false)
  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!user.value)
  const permissions = computed(() => user.value?.permissions ?? [])

  function can(permission: string | string[]) {
    return hasPermission(permissions.value, permission)
  }

  function canAny(list: string[]) {
    return hasAnyPermission(permissions.value, list)
  }

  /** Restore the session on app start using the persisted refresh token. */
  function init(): Promise<void> {
    if (initialized.value) return Promise.resolve()
    initPromise ??= (async () => {
      try {
        if (!tokenStorage.getAccessToken() && tokenStorage.getRefreshToken()) {
          await refreshAccessToken()
        }
        if (tokenStorage.getAccessToken()) user.value = await authService.me()
      } catch {
        tokenStorage.clear()
        user.value = null
      } finally {
        initialized.value = true
      }
    })()
    return initPromise
  }

  async function login(email: string, password: string) {
    const res = await authService.login(email, password)
    tokenStorage.setAccessToken(res.accessToken)
    tokenStorage.setRefreshToken(res.refreshToken)
    user.value = res.user
    initialized.value = true
  }

  async function logout() {
    try {
      await authService.logout(tokenStorage.getRefreshToken())
    } catch {
      /* ignore network errors on logout */
    } finally {
      clearSession()
    }
  }

  function clearSession() {
    tokenStorage.clear()
    user.value = null
  }

  async function refreshProfile() {
    user.value = await authService.me()
  }

  function setUser(value: AuthUser) {
    user.value = value
  }

  return {
    user,
    initialized,
    isAuthenticated,
    permissions,
    can,
    canAny,
    init,
    login,
    logout,
    clearSession,
    refreshProfile,
    setUser,
  }
})
