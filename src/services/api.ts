import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { config } from '@/config/env'
import type { ApiErrorBody, AuthTokens } from '@/types'
import { tokenStorage } from './token-storage'

export class ApiError extends Error {
  status: number
  code: string
  details?: Record<string, string[]>

  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; skipAuthRefresh?: boolean }

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Do not try to refresh the access token when this request returns 401. */
    skipAuthRefresh?: boolean
  }
}

let onSessionExpired: (() => void) | null = null
let refreshPromise: Promise<string | null> | null = null

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

export function createApi(adapter?: InternalAxiosRequestConfig['adapter']): AxiosInstance {
  const instance = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30_000,
    withCredentials: true,
    headers: { Accept: 'application/json' },
    adapter,
  })

  instance.interceptors.request.use((req) => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      req.headers = AxiosHeaders.from(req.headers)
      req.headers.set('Authorization', `Bearer ${token}`)
    }
    return req
  })

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<ApiErrorBody>) => {
      const original = error.config as RetriableConfig | undefined
      const status = error.response?.status ?? 0

      if (status === 401 && original && !original._retry && !original.skipAuthRefresh) {
        original._retry = true
        const newToken = await refreshAccessToken(instance)
        if (newToken) {
          original.headers = AxiosHeaders.from(original.headers)
          original.headers.set('Authorization', `Bearer ${newToken}`)
          return instance.request(original)
        }
        onSessionExpired?.()
      }
      return Promise.reject(toApiError(error))
    },
  )

  return instance
}

/** Single-flight refresh: concurrent 401s share one refresh request. */
export function refreshAccessToken(instance: AxiosInstance = api): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return Promise.resolve(null)

  refreshPromise = instance
    .post<{ data: AuthTokens }>('/auth/refresh', { refreshToken }, { skipAuthRefresh: true })
    .then((res) => {
      tokenStorage.setAccessToken(res.data.data.accessToken)
      tokenStorage.setRefreshToken(res.data.data.refreshToken)
      return res.data.data.accessToken
    })
    .catch(() => {
      tokenStorage.clear()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.error) {
      return new ApiError(
        error.response?.status ?? 0,
        body.error.code,
        body.error.message,
        body.error.details,
      )
    }
    if (!error.response) return new ApiError(0, 'NETWORK_ERROR', 'Tidak dapat terhubung ke server')
    return new ApiError(error.response.status, 'HTTP_ERROR', error.message)
  }
  return new ApiError(0, 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error')
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message
}

let adapter: InternalAxiosRequestConfig['adapter'] | undefined
if (import.meta.env.VITE_API_MOCK === 'true') {
  // Loaded eagerly in dev/demo builds only; tree-shaken when VITE_API_MOCK !== 'true'.
  const { mockAdapter } = await import('@/mocks/adapter')
  adapter = mockAdapter
}

export const api = createApi(adapter)
