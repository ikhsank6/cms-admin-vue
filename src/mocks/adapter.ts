import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { config as appConfig } from '@/config/env'
import { afterMutation, permissionsOf, router, userFromAccessToken } from './handlers'
import { HttpError, type Method } from './router'

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 150

function parseBody(data: unknown): unknown {
  if (data === undefined || data === null || data === '') return {}
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
  return data
}

function resolvePath(config: InternalAxiosRequestConfig): {
  path: string
  query: Record<string, string>
} {
  const base = config.baseURL ?? appConfig.apiBaseUrl
  let url = config.url ?? ''
  if (url.startsWith(base)) url = url.slice(base.length)
  const [pathname, qs] = url.split('?')
  const query: Record<string, string> = {}
  new URLSearchParams(qs ?? '').forEach((v, k) => (query[k] = v))
  for (const [k, v] of Object.entries(config.params ?? {})) {
    if (v !== undefined && v !== null && v !== '') query[k] = String(v)
  }
  return { path: pathname || '/', query }
}

/** Axios adapter that serves every request from the in-memory mock API. */
export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  if (LATENCY_MS) await new Promise((r) => setTimeout(r, LATENCY_MS))

  const method = (config.method ?? 'get').toUpperCase() as Method
  const { path, query } = resolvePath(config)
  const headers = AxiosHeaders.from(config.headers)
  const auth = String(headers.get('Authorization') ?? '')
  const user = userFromAccessToken(auth.replace(/^Bearer\s+/i, '') || undefined)

  const respond = (status: number, data: unknown): AxiosResponse => {
    const response: AxiosResponse = {
      data,
      status,
      statusText: String(status),
      headers: new AxiosHeaders({ 'content-type': 'application/json' }),
      config,
      request: { responseURL: path },
    }
    if (status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
        config,
        response.request,
        response,
      )
    }
    return response
  }

  const match = router.match(method, path)
  if (!match) {
    return respond(404, {
      error: { code: 'ROUTE_NOT_FOUND', message: `${method} ${path} not found` },
    })
  }

  try {
    const result = await match.handler({
      method,
      path,
      params: match.params,
      query,
      body: parseBody(config.data),
      headers: Object.fromEntries(
        Object.entries(headers.toJSON()).map(([k, v]) => [k.toLowerCase(), String(v)]),
      ),
      user,
      permissions: user ? permissionsOf(user) : [],
    })
    afterMutation(method)
    // Deep clone so callers never mutate the mock DB by reference.
    return respond(result.status, result.data === undefined ? '' : structuredClone(result.data))
  } catch (err) {
    if (err instanceof HttpError) {
      return respond(err.status, {
        error: { code: err.code, message: err.message, details: err.details },
      })
    }
    if (err instanceof AxiosError) throw err
    console.error('[mock] handler error', err)
    return respond(500, {
      error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server' },
    })
  }
}
