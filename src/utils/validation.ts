import { z } from 'zod'
import { SLUG_PATTERN } from './slug'

export const passwordSchema = z
  .string()
  .min(8, 'Minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Harus mengandung huruf')
  .regex(/\d/, 'Harus mengandung angka')

export const slugSchema = z
  .string()
  .min(1, 'Slug wajib diisi')
  .max(160, 'Maksimal 160 karakter')
  .regex(SLUG_PATTERN, 'Gunakan huruf kecil, angka, dan tanda hubung')

export const optionalUrl = z
  .string()
  .trim()
  .refine(
    (v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v),
    'URL harus diawali / atau http(s)://',
  )
  .nullish()

export const contentStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
