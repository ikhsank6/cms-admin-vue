import { describe, expect, it } from 'vitest'
import { SECTION_DEFINITIONS, SECTION_TYPES, createSection, validateSection } from './registry'

describe('section registry', () => {
  it('defines all MVP section types', () => {
    expect(SECTION_TYPES).toEqual([
      'HERO',
      'TEXT',
      'IMAGE',
      'IMAGE_TEXT',
      'STATISTIC',
      'CARD',
      'SERVICES',
      'NEWS',
      'GALLERY',
      'CTA',
      'FAQ',
      'CONTACT',
    ])
  })
  it('creates sections with independent default content', () => {
    const a = createSection('STATISTIC', 1)
    const b = createSection('STATISTIC', 2)
    ;(a.content.items as unknown[]).push({})
    expect((b.content.items as unknown[]).length).toBe(1)
    expect(a.key).not.toBe(b.key)
    expect(a).toMatchObject({ type: 'STATISTIC', sortOrder: 1, isActive: true })
  })
  it('every default passes validation except fields that require user input', () => {
    for (const type of SECTION_TYPES) {
      const def = SECTION_DEFINITIONS[type]
      const errors = validateSection(createSection(type, 1))
      const requiredEmpty = def.fields.filter((f) => f.required && !def.defaults()[f.key])
      expect(errors.length).toBe(requiredEmpty.length)
    }
  })
  it('validates required fields in repeaters', () => {
    const s = createSection('FAQ', 1)
    s.content.items = [{ question: 'Q?', answer: '' }]
    expect(validateSection(s)).toEqual(['FAQ: Pertanyaan #1 — Jawaban wajib diisi'])
  })
})
