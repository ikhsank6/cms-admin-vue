import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ gfm: true, breaks: false })

/** Render Markdown to sanitized HTML. All user-authored rich content must go through this. */
export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return ''
  const html = marked.parse(source, { async: false }) as string
  return sanitizeHtml(html)
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'script', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  })
}

/** Strip markdown/HTML to plain text (for excerpts, meta descriptions). */
export function toPlainText(source: string | null | undefined): string {
  if (!source) return ''
  const html = marked.parse(source, { async: false }) as string
  const div = document.createElement('div')
  div.innerHTML = DOMPurify.sanitize(html)
  return (div.textContent || '').replace(/\s+/g, ' ').trim()
}
