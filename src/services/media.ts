import axios from 'axios'
import type { ApiResponse, ListParams, Media, Paginated, UploadTicket } from '@/types'
import { config } from '@/config/env'
import { validateFile } from '@/utils/file-validation'
import { api } from './api'
import { cleanParams } from './crud'

const BASE = '/admin/media'

export interface UploadOptions {
  folder?: string
  onProgress?: (percent: number) => void
}

export const mediaService = {
  async list(params?: ListParams): Promise<Paginated<Media>> {
    const res = await api.get<Paginated<Media>>(BASE, { params: cleanParams(params) })
    return res.data
  },
  async update(id: number, input: { alt?: string | null }): Promise<Media> {
    const res = await api.put<ApiResponse<Media>>(`${BASE}/${id}`, input)
    return res.data.data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`)
  },

  /**
   * Upload flow (PRD §15):
   *  1. Ask the API for an upload ticket.
   *  2a. S3-compatible: PUT the file straight to the presigned URL, then save metadata.
   *  2b. Local: send the file to the API as multipart/form-data.
   */
  async upload(file: File, options: UploadOptions = {}): Promise<Media> {
    const check = await validateFile(file, config.uploadMaxBytes)
    if (!check.ok) throw new Error(check.error)

    const meta = {
      originalName: file.name,
      mimeType: file.type || check.rule.mime,
      size: file.size,
      folder: options.folder ?? 'uploads',
    }
    const ticketRes = await api.post<ApiResponse<UploadTicket>>(`${BASE}/upload-url`, meta)
    const ticket = ticketRes.data.data

    const onUploadProgress = (e: { loaded: number; total?: number }) => {
      if (e.total) options.onProgress?.(Math.round((e.loaded / e.total) * 100))
    }

    if (ticket.driver === 's3') {
      // Plain axios: the presigned URL must not receive our Authorization header.
      await axios.request({
        url: ticket.uploadUrl,
        method: ticket.method,
        data: file,
        headers: { 'Content-Type': meta.mimeType, ...ticket.headers },
        onUploadProgress,
      })
      const res = await api.post<ApiResponse<Media>>(`${BASE}/complete`, {
        ...meta,
        storageKey: ticket.storageKey,
      })
      return res.data.data
    }

    const form = new FormData()
    form.append('file', file)
    form.append('folder', meta.folder)
    const res = await api.post<ApiResponse<Media>>(BASE, form, { onUploadProgress })
    return res.data.data
  },
}
