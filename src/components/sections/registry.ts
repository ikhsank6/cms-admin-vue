import type { Component } from 'vue'
import {
  BarChart3,
  Contact,
  HelpCircle,
  Image,
  Images,
  LayoutGrid,
  Megaphone,
  Newspaper,
  PanelTop,
  Rows3,
  Type,
  Wrench,
} from 'lucide-vue-next'
import type { PageSection, SectionContent, SectionType } from '@/types'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'markdown'
  | 'url'
  | 'number'
  | 'image'
  | 'images'
  | 'select'
  | 'boolean'
  | 'list'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  /** For `list` fields. */
  itemFields?: FieldDef[]
  itemLabel?: string
}

export interface SectionDefinition {
  type: SectionType
  label: string
  description: string
  icon: Component
  fields: FieldDef[]
  defaults: () => SectionContent
}

export const SERVICE_ICONS = [
  'file-check',
  'message-square',
  'database',
  'shield',
  'users',
  'globe',
  'briefcase',
  'heart',
] as const

const button: FieldDef[] = [
  { key: 'buttonLabel', label: 'Label Tombol', type: 'text' },
  { key: 'buttonUrl', label: 'URL Tombol', type: 'url', placeholder: '/about' },
]

export const SECTION_DEFINITIONS: Record<SectionType, SectionDefinition> = {
  HERO: {
    type: 'HERO',
    label: 'Hero',
    description: 'Banner utama dengan judul, deskripsi, gambar, dan tombol',
    icon: PanelTop,
    fields: [
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'image', label: 'Gambar Latar', type: 'image' },
      ...button,
    ],
    defaults: () => ({
      title: 'Judul Hero',
      description: '',
      image: null,
      buttonLabel: '',
      buttonUrl: '',
    }),
  },
  TEXT: {
    type: 'TEXT',
    label: 'Text',
    description: 'Blok teks (Markdown)',
    icon: Type,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'body', label: 'Konten', type: 'markdown', required: true },
      {
        key: 'align',
        label: 'Perataan',
        type: 'select',
        options: [
          { label: 'Kiri', value: 'left' },
          { label: 'Tengah', value: 'center' },
        ],
      },
    ],
    defaults: () => ({ title: '', body: '', align: 'left' }),
  },
  IMAGE: {
    type: 'IMAGE',
    label: 'Image',
    description: 'Gambar tunggal dengan keterangan',
    icon: Image,
    fields: [
      { key: 'image', label: 'Gambar', type: 'image', required: true },
      { key: 'alt', label: 'Alt Text', type: 'text' },
      { key: 'caption', label: 'Keterangan', type: 'text' },
    ],
    defaults: () => ({ image: null, alt: '', caption: '' }),
  },
  IMAGE_TEXT: {
    type: 'IMAGE_TEXT',
    label: 'Image + Text',
    description: 'Gambar berdampingan dengan teks',
    icon: Rows3,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'body', label: 'Konten', type: 'markdown' },
      { key: 'image', label: 'Gambar', type: 'image' },
      {
        key: 'imagePosition',
        label: 'Posisi Gambar',
        type: 'select',
        options: [
          { label: 'Kiri', value: 'left' },
          { label: 'Kanan', value: 'right' },
        ],
      },
      ...button,
    ],
    defaults: () => ({
      title: '',
      body: '',
      image: null,
      imagePosition: 'right',
      buttonLabel: '',
      buttonUrl: '',
    }),
  },
  STATISTIC: {
    type: 'STATISTIC',
    label: 'Statistic',
    description: 'Angka-angka capaian',
    icon: BarChart3,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      {
        key: 'items',
        label: 'Statistik',
        type: 'list',
        itemLabel: 'Statistik',
        itemFields: [
          { key: 'value', label: 'Nilai', type: 'text', required: true },
          { key: 'label', label: 'Label', type: 'text', required: true },
        ],
      },
    ],
    defaults: () => ({ title: '', items: [{ value: '100+', label: 'Label' }] }),
  },
  CARD: {
    type: 'CARD',
    label: 'Cards',
    description: 'Grid kartu dengan gambar dan tautan',
    icon: LayoutGrid,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      {
        key: 'items',
        label: 'Kartu',
        type: 'list',
        itemLabel: 'Kartu',
        itemFields: [
          { key: 'title', label: 'Judul', type: 'text', required: true },
          { key: 'description', label: 'Deskripsi', type: 'textarea' },
          { key: 'image', label: 'Gambar', type: 'image' },
          { key: 'url', label: 'URL', type: 'url' },
        ],
      },
    ],
    defaults: () => ({ title: '', items: [] }),
  },
  SERVICES: {
    type: 'SERVICES',
    label: 'Services',
    description: 'Daftar layanan dengan ikon',
    icon: Wrench,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      {
        key: 'items',
        label: 'Layanan',
        type: 'list',
        itemLabel: 'Layanan',
        itemFields: [
          { key: 'title', label: 'Nama Layanan', type: 'text', required: true },
          { key: 'description', label: 'Deskripsi', type: 'textarea' },
          {
            key: 'icon',
            label: 'Ikon',
            type: 'select',
            options: SERVICE_ICONS.map((i) => ({ label: i, value: i })),
          },
          { key: 'url', label: 'URL', type: 'url' },
        ],
      },
    ],
    defaults: () => ({ title: 'Layanan', description: '', items: [] }),
  },
  NEWS: {
    type: 'NEWS',
    label: 'News',
    description: 'Artikel terbaru (otomatis dari Article)',
    icon: Newspaper,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'limit', label: 'Jumlah Artikel', type: 'number' },
      { key: 'category', label: 'Slug Kategori (opsional)', type: 'text' },
    ],
    defaults: () => ({ title: 'Berita Terbaru', limit: 3, category: '' }),
  },
  GALLERY: {
    type: 'GALLERY',
    label: 'Gallery',
    description: 'Galeri gambar',
    icon: Images,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'images', label: 'Gambar', type: 'images' },
    ],
    defaults: () => ({ title: 'Galeri', images: [] }),
  },
  CTA: {
    type: 'CTA',
    label: 'Call to Action',
    description: 'Ajakan bertindak dengan tombol',
    icon: Megaphone,
    fields: [
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      ...button,
    ],
    defaults: () => ({
      title: 'Ajakan',
      description: '',
      buttonLabel: 'Hubungi Kami',
      buttonUrl: '/contact',
    }),
  },
  FAQ: {
    type: 'FAQ',
    label: 'FAQ',
    description: 'Pertanyaan yang sering diajukan',
    icon: HelpCircle,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      {
        key: 'items',
        label: 'Pertanyaan',
        type: 'list',
        itemLabel: 'Pertanyaan',
        itemFields: [
          { key: 'question', label: 'Pertanyaan', type: 'text', required: true },
          { key: 'answer', label: 'Jawaban', type: 'textarea', required: true },
        ],
      },
    ],
    defaults: () => ({ title: 'FAQ', items: [] }),
  },
  CONTACT: {
    type: 'CONTACT',
    label: 'Contact',
    description: 'Informasi kontak dari Website Settings',
    icon: Contact,
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
    ],
    defaults: () => ({ title: 'Hubungi Kami', description: '' }),
  },
}

export const SECTION_TYPES = Object.keys(SECTION_DEFINITIONS) as SectionType[]

let keySeq = 0
export const sectionKey = () => `s${Date.now().toString(36)}${(keySeq++).toString(36)}`

export function createSection(type: SectionType, sortOrder: number): PageSection {
  return {
    key: sectionKey(),
    type,
    sortOrder,
    isActive: true,
    content: SECTION_DEFINITIONS[type].defaults(),
  }
}

/** Validate required fields of a section; returns human readable errors. */
export function validateSection(section: PageSection): string[] {
  const def = SECTION_DEFINITIONS[section.type]
  if (!def) return [`Tipe section tidak dikenal: ${section.type}`]
  const errors: string[] = []
  const isEmpty = (v: unknown) =>
    v === undefined || v === null || (typeof v === 'string' && !v.trim())
  for (const field of def.fields) {
    const value = section.content[field.key]
    if (field.required && isEmpty(value)) errors.push(`${def.label}: ${field.label} wajib diisi`)
    if (field.type === 'list' && Array.isArray(value)) {
      value.forEach((item, i) => {
        for (const f of field.itemFields ?? []) {
          if (f.required && isEmpty((item as Record<string, unknown>)[f.key])) {
            errors.push(
              `${def.label}: ${field.itemLabel ?? 'Item'} #${i + 1} — ${f.label} wajib diisi`,
            )
          }
        }
      })
    }
  }
  return errors
}
