import type { ApiResponse, ID, ListParams, Paginated } from '@/types'
import { api } from './api'

function cleanParams(params?: ListParams) {
  if (!params) return undefined
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )
}

/** Standard REST resource: list/get/create/update/remove. */
export function createResource<T, TInput = Partial<T>>(basePath: string) {
  return {
    async list(params?: ListParams): Promise<Paginated<T>> {
      const res = await api.get<Paginated<T>>(basePath, { params: cleanParams(params) })
      return res.data
    },
    async get(id: ID): Promise<T> {
      const res = await api.get<ApiResponse<T>>(`${basePath}/${id}`)
      return res.data.data
    },
    async create(input: TInput): Promise<T> {
      const res = await api.post<ApiResponse<T>>(basePath, input)
      return res.data.data
    },
    async update(id: ID, input: TInput): Promise<T> {
      const res = await api.put<ApiResponse<T>>(`${basePath}/${id}`, input)
      return res.data.data
    },
    async remove(id: ID): Promise<void> {
      await api.delete(`${basePath}/${id}`)
    },
  }
}

export function withPublishing<T>(basePath: string) {
  return {
    async publish(id: ID): Promise<T> {
      const res = await api.patch<ApiResponse<T>>(`${basePath}/${id}/publish`)
      return res.data.data
    },
    async unpublish(id: ID): Promise<T> {
      const res = await api.patch<ApiResponse<T>>(`${basePath}/${id}/unpublish`)
      return res.data.data
    },
  }
}

export { cleanParams }
