import { describe, expect, it } from 'vitest'
import { getExtension, mediaKind, validateFile } from './file-validation'

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]
const file = (bytes: number[] | string, name: string, type: string) =>
  new File([typeof bytes === 'string' ? bytes : new Uint8Array(bytes)], name, { type })
const MB = 1024 * 1024

describe('validateFile', () => {
  it('accepts a valid PNG and PDF', async () => {
    expect((await validateFile(file(PNG, 'a.png', 'image/png'), MB)).ok).toBe(true)
    expect((await validateFile(file(PDF, 'doc.PDF', 'application/pdf'), MB)).ok).toBe(true)
  })
  it('rejects disallowed extensions', async () => {
    const r = await validateFile(file('echo', 'run.sh', 'text/x-sh'), MB)
    expect(r).toMatchObject({ ok: false })
  })
  it('rejects MIME/extension mismatch', async () => {
    const r = await validateFile(file(PNG, 'a.png', 'image/jpeg'), MB)
    expect(r.ok).toBe(false)
  })
  it('rejects files whose content does not match their type', async () => {
    const r = await validateFile(file('<?php echo 1;', 'shell.png', 'image/png'), MB)
    expect(r).toEqual({ ok: false, error: 'Isi file tidak sesuai dengan tipenya' })
  })
  it('rejects files over the size limit', async () => {
    const r = await validateFile(file(PNG, 'a.png', 'image/png'), 4)
    expect(r.ok).toBe(false)
  })
  it('rejects SVG with scripts', async () => {
    const r = await validateFile(
      file('<svg onload="alert(1)"></svg>', 'x.svg', 'image/svg+xml'),
      MB,
    )
    expect(r.ok).toBe(false)
    const ok = await validateFile(
      file('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'x.svg', 'image/svg+xml'),
      MB,
    )
    expect(ok.ok).toBe(true)
  })
})

describe('helpers', () => {
  it('extracts extension and kind', () => {
    expect(getExtension('a.b.JPG')).toBe('jpg')
    expect(getExtension('noext')).toBe('')
    expect(mediaKind('image/webp')).toBe('image')
    expect(mediaKind('application/pdf')).toBe('pdf')
    expect(
      mediaKind('application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    ).toBe('document')
  })
})
