import { describe, expect, it } from 'vitest'
import { isValidSlug, slugify } from './slug'
import { formatBytes, fromDateTimeLocal, toDateTimeLocal, truncate } from './format'
import { isExternalUrl, safeImageUrl, safeUrl } from './url'
import { diffObjects } from './diff'
import { renderMarkdown } from './markdown'
import { deepClone } from './clone'
import { reactive } from 'vue'

describe('slugify', () => {
  it('creates url-safe slugs', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('  Berita & Pengumuman 2026!  ')).toBe('berita-and-pengumuman-2026')
    expect(slugify('Café Déjà-vu')).toBe('cafe-deja-vu')
    expect(slugify('--a__b--')).toBe('a-b')
  })
  it('validates slugs', () => {
    expect(isValidSlug('about-us')).toBe(true)
    expect(isValidSlug('About')).toBe(false)
    expect(isValidSlug('a--b')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })
})

describe('format', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
  it('round-trips datetime-local values', () => {
    const iso = fromDateTimeLocal('2026-09-26T10:30')!
    expect(toDateTimeLocal(iso)).toBe('2026-09-26T10:30')
    expect(fromDateTimeLocal('')).toBeNull()
  })
  it('truncates text', () => {
    expect(truncate('abcdef', 3)).toBe('abc…')
    expect(truncate('ab', 3)).toBe('ab')
  })
})

describe('safeUrl', () => {
  it('allows relative and http(s)/mailto/tel URLs', () => {
    expect(safeUrl('/about')).toBe('/about')
    expect(safeUrl('https://example.com')).toBe('https://example.com')
    expect(safeUrl('mailto:a@b.c')).toBe('mailto:a@b.c')
    expect(safeUrl('about')).toBe('/about')
  })
  it('blocks script URLs', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#')
    expect(safeUrl(' JavaScript:alert(1)')).toBe('#')
    expect(safeUrl('data:text/html,<script>')).toBe('#')
  })
  it('only allows image data URLs for images', () => {
    expect(safeImageUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
    expect(safeImageUrl('data:text/html;base64,AAA')).toBeUndefined()
  })
  it('detects external URLs', () => {
    expect(isExternalUrl('https://x.com')).toBe(true)
    expect(isExternalUrl('/news')).toBe(false)
  })
})

describe('renderMarkdown', () => {
  it('renders markdown', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
  })
  it('sanitizes XSS payloads', () => {
    const html = renderMarkdown(
      '<img src=x onerror="alert(1)"><script>alert(1)</script>[x](javascript:alert(1))',
    )
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('javascript:')
  })
})

describe('diffObjects', () => {
  it('lists changed fields only', () => {
    const diff = diffObjects(
      { title: 'A', seo: { title: 'x' }, same: 1 },
      { title: 'B', seo: { title: 'x' }, same: 1 },
    )
    expect(diff).toEqual([{ path: 'title', before: 'A', after: 'B' }])
  })
  it('shows every field when one side is missing', () => {
    expect(diffObjects(null, { a: 1 })).toEqual([{ path: 'a', before: '', after: '1' }])
  })
})

describe('deepClone', () => {
  it('clones reactive proxies', () => {
    const state = reactive({ a: [{ b: 1 }] })
    const copy = deepClone(state)
    copy.a[0]!.b = 2
    expect(state.a[0]!.b).toBe(1)
  })
})
