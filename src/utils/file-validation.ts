// Client-side upload validation: extension, MIME type, size and file signature (magic bytes).
// This is a UX guard only — the backend MUST re-validate every upload.

export interface FileRule {
  mime: string
  extensions: string[]
  /** Expected leading bytes (hex). Empty = content not sniffable (e.g. text formats). */
  signatures: string[]
}

export const ALLOWED_FILE_RULES: FileRule[] = [
  { mime: 'image/jpeg', extensions: ['jpg', 'jpeg'], signatures: ['ffd8ff'] },
  { mime: 'image/png', extensions: ['png'], signatures: ['89504e470d0a1a0a'] },
  { mime: 'image/gif', extensions: ['gif'], signatures: ['474946383761', '474946383961'] },
  { mime: 'image/webp', extensions: ['webp'], signatures: ['52494646'] },
  { mime: 'image/avif', extensions: ['avif'], signatures: [] },
  { mime: 'image/svg+xml', extensions: ['svg'], signatures: [] },
  { mime: 'application/pdf', extensions: ['pdf'], signatures: ['25504446'] },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    signatures: ['504b0304'],
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    signatures: ['504b0304'],
  },
  { mime: 'application/msword', extensions: ['doc'], signatures: ['d0cf11e0a1b11ae1'] },
  { mime: 'application/vnd.ms-excel', extensions: ['xls'], signatures: ['d0cf11e0a1b11ae1'] },
]

export const ACCEPT_ATTRIBUTE = ALLOWED_FILE_RULES.map((r) => r.mime).join(',')

export type FileValidationResult = { ok: true; rule: FileRule } | { ok: false; error: string }

export function getExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : ''
}

async function readHeaderHex(file: Blob, bytes = 16): Promise<string> {
  const slice = file.slice(0, bytes)
  const buffer =
    typeof slice.arrayBuffer === 'function'
      ? await slice.arrayBuffer()
      : await new Response(slice).arrayBuffer()
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function validateFile(file: File, maxBytes: number): Promise<FileValidationResult> {
  const ext = getExtension(file.name)
  const rule = ALLOWED_FILE_RULES.find((r) => r.extensions.includes(ext))
  if (!rule) return { ok: false, error: `Ekstensi .${ext || '?'} tidak diizinkan` }
  if (file.type && file.type !== rule.mime) {
    return { ok: false, error: `Tipe MIME ${file.type} tidak sesuai dengan ekstensi .${ext}` }
  }
  if (file.size <= 0) return { ok: false, error: 'File kosong' }
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `Ukuran file melebihi batas ${Math.round(maxBytes / 1024 / 1024)} MB`,
    }
  }
  if (rule.signatures.length) {
    const header = await readHeaderHex(file)
    if (!rule.signatures.some((sig) => header.startsWith(sig))) {
      return { ok: false, error: 'Isi file tidak sesuai dengan tipenya' }
    }
  }
  if (rule.mime === 'image/svg+xml') {
    const text = await file.text()
    if (/<script|on\w+\s*=|javascript:/i.test(text)) {
      return { ok: false, error: 'SVG mengandung script atau event handler' }
    }
  }
  return { ok: true, rule }
}

export function isImage(mime: string): boolean {
  return mime.startsWith('image/')
}

export type MediaKind = 'image' | 'pdf' | 'document' | 'other'

export function mediaKind(mime: string): MediaKind {
  if (isImage(mime)) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (/word|excel|spreadsheet|officedocument|msword/.test(mime)) return 'document'
  return 'other'
}
