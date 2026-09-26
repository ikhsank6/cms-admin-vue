const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

/** Return a URL safe to put in href/src; blocks javascript:, data: (except images) etc. */
export function safeUrl(url: string | null | undefined, fallback = '#'): string {
  if (!url) return fallback
  const trimmed = url.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return trimmed
  try {
    const parsed = new URL(trimmed)
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? trimmed : fallback
  } catch {
    // relative path without leading slash
    return /^[\w\-./]+$/.test(trimmed) ? `/${trimmed}` : fallback
  }
}

export function isExternalUrl(url: string): boolean {
  return /^(https?:)?\/\//i.test(url) || /^(mailto|tel):/i.test(url)
}

/** Image sources: also allow data:image (mock/local previews) and blob:. */
export function safeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(url) || url.startsWith('blob:'))
    return url
  const s = safeUrl(url, '')
  return s || undefined
}
