import type { PaginationMeta } from '@/types'
import type { DbUser } from './db'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface MockRequest {
  method: Method
  path: string
  params: Record<string, string>
  query: Record<string, string>
  body: any // eslint-disable-line @typescript-eslint/no-explicit-any
  headers: Record<string, string>
  user: DbUser | null
  permissions: string[]
}

export interface MockResponse {
  status: number
  data?: unknown
}

export type Handler = (req: MockRequest) => MockResponse | Promise<MockResponse>

export class HttpError extends Error {
  status: number
  code: string
  details?: Record<string, string[]>
  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

interface Route {
  method: Method
  regex: RegExp
  keys: string[]
  handler: Handler
}

export class MockRouter {
  private routes: Route[] = []

  on(method: Method, pattern: string, handler: Handler) {
    const keys: string[] = []
    const regex = new RegExp(
      '^' +
        pattern.replace(/\//g, '\\/').replace(/:(\w+)/g, (_, key: string) => {
          keys.push(key)
          return '([^/]+)'
        }) +
        '\\/?$',
    )
    this.routes.push({ method, regex, keys, handler })
    return this
  }

  get = (p: string, h: Handler) => this.on('GET', p, h)
  post = (p: string, h: Handler) => this.on('POST', p, h)
  put = (p: string, h: Handler) => this.on('PUT', p, h)
  patch = (p: string, h: Handler) => this.on('PATCH', p, h)
  delete = (p: string, h: Handler) => this.on('DELETE', p, h)

  match(method: Method, path: string): { handler: Handler; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue
      const m = route.regex.exec(path)
      if (!m) continue
      const params: Record<string, string> = {}
      route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]!)))
      return { handler: route.handler, params }
    }
    return null
  }
}

export const ok = (data: unknown, status = 200): MockResponse => ({ status, data: { data } })
export const created = (data: unknown) => ok(data, 201)
export const noContent = (): MockResponse => ({ status: 204 })

export function paginate<T>(
  items: T[],
  query: Record<string, string>,
): { data: T[]; meta: PaginationMeta } {
  const perPage = Math.min(Math.max(Number(query.perPage) || 10, 1), 100)
  const total = items.length
  const totalPages = Math.max(Math.ceil(total / perPage), 1)
  const page = Math.min(Math.max(Number(query.page) || 1, 1), totalPages)
  return {
    data: items.slice((page - 1) * perPage, page * perPage),
    meta: { page, perPage, total, totalPages },
  }
}

export function notFound(what = 'Resource'): never {
  throw new HttpError(404, 'NOT_FOUND', `${what} tidak ditemukan`)
}

export function validation(details: Record<string, string[]>): never {
  throw new HttpError(422, 'VALIDATION_ERROR', 'Data tidak valid', details)
}

export function matchesSearch(
  search: string | undefined,
  ...fields: (string | null | undefined)[]
) {
  if (!search) return true
  const q = search.toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(q))
}

export function sortBy<T>(items: T[], sort: string | undefined, fallback: string): T[] {
  const spec = sort || fallback
  const desc = spec.startsWith('-')
  const key = (desc ? spec.slice(1) : spec) as keyof T
  return [...items].sort((a, b) => {
    const av = a[key] as unknown as string | number | null
    const bv = b[key] as unknown as string | number | null
    if (av === bv) return 0
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    return (av > bv ? 1 : -1) * (desc ? -1 : 1)
  })
}
