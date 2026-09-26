import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  ApiError,
  createApi,
  refreshAccessToken,
  setSessionExpiredHandler,
  toApiError,
} from './api'
import { tokenStorage } from './token-storage'

function res(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  const response = { data, status, statusText: '', headers: new AxiosHeaders(), config }
  if (status >= 400) throw new AxiosError('fail', 'ERR', config, null, response)
  return response
}

describe('api client', () => {
  beforeEach(() => tokenStorage.clear())

  it('attaches the bearer token', async () => {
    tokenStorage.setAccessToken('abc')
    const adapter = vi.fn(async (c: InternalAxiosRequestConfig) =>
      res(c, 200, { auth: c.headers.get('Authorization') }),
    )
    const api = createApi(adapter)
    const r = await api.get('/x')
    expect(r.data.auth).toBe('Bearer abc')
  })

  it('refreshes once on concurrent 401s and retries the requests', async () => {
    tokenStorage.setAccessToken('old')
    tokenStorage.setRefreshToken('rt1')
    let refreshCalls = 0
    const adapter = vi.fn(async (c: InternalAxiosRequestConfig) => {
      if (c.url === '/auth/refresh') {
        refreshCalls++
        return res(c, 200, { data: { accessToken: 'new', refreshToken: 'rt2', expiresIn: 900 } })
      }
      const auth = c.headers.get('Authorization')
      return auth === 'Bearer new'
        ? res(c, 200, { ok: c.url })
        : res(c, 401, { error: { code: 'UNAUTHORIZED', message: 'x' } })
    })
    const api = createApi(adapter)
    const [a, b] = await Promise.all([api.get('/a'), api.get('/b')])
    expect(a.data.ok).toBe('/a')
    expect(b.data.ok).toBe('/b')
    expect(refreshCalls).toBe(1)
    expect(tokenStorage.getAccessToken()).toBe('new')
    expect(tokenStorage.getRefreshToken()).toBe('rt2')
  })

  it('calls the session-expired handler when refresh fails', async () => {
    tokenStorage.setRefreshToken('bad')
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    const adapter = vi.fn(async (c: InternalAxiosRequestConfig) =>
      res(c, 401, { error: { code: 'UNAUTHORIZED', message: 'Sesi berakhir' } }),
    )
    const api = createApi(adapter)
    await expect(api.get('/x')).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
    expect(onExpired).toHaveBeenCalledOnce()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('returns null from refresh when there is no refresh token', async () => {
    const adapter = vi.fn(async (c: InternalAxiosRequestConfig) => res(c, 200, {}))
    await expect(refreshAccessToken(createApi(adapter))).resolves.toBeNull()
    expect(adapter).not.toHaveBeenCalled()
  })

  it('normalizes errors', () => {
    expect(toApiError(new Error('boom'))).toBeInstanceOf(ApiError)
    const netErr = new AxiosError('Network Error', 'ERR_NETWORK', {} as InternalAxiosRequestConfig)
    expect(toApiError(netErr).code).toBe('NETWORK_ERROR')
  })
})
