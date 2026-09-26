// In-browser mock database. Seeds realistic data and persists to localStorage so the
// admin CMS and the public site can be demoed and E2E-tested without the backend.
import type {
  Article,
  AuditLog,
  Banner,
  Category,
  Media,
  Menu,
  Page,
  Role,
  SiteSettings,
  Tag,
} from '@/types'
import { ALL_PERMISSIONS, SUPER_PERMISSION } from '@/config/permissions'

export interface DbUser {
  id: number
  uuid: string
  name: string
  email: string
  password: string
  avatar?: string | null
  isActive: boolean
  roleIds: number[]
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface DbArticle extends Omit<Article, 'category' | 'tags' | 'author'> {
  tagIds: number[]
  authorId: number | null
}

export interface DbMedia extends Omit<Media, 'url'> {
  /** Mock-only: file bytes as a data URL (the real backend stores bytes in Local/S3). */
  dataUrl?: string
}

export interface Database {
  seq: Record<string, number>
  users: DbUser[]
  roles: Role[]
  pages: Page[]
  articles: DbArticle[]
  categories: Category[]
  tags: Tag[]
  media: DbMedia[]
  banners: Banner[]
  menus: Menu[]
  settings: SiteSettings
  auditLogs: AuditLog[]
  refreshTokens: Record<string, number>
  resetTokens: Record<string, number>
}

const STORAGE_KEY = 'cms.mockdb.v1'

export const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

function svgPlaceholder(hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},70%,25%)"/></linearGradient></defs><rect width="1200" height="675" fill="url(#g)"/><circle cx="980" cy="120" r="260" fill="rgba(255,255,255,.08)"/><circle cx="160" cy="600" r="200" fill="rgba(255,255,255,.06)"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function seed(): Database {
  const seedMedia: DbMedia[] = [
    ['Hero Transformasi', 210],
    ['Layanan Publik', 160],
    ['Kegiatan Kantor', 20],
    ['Galeri 1', 280],
    ['Galeri 2', 320],
    ['Galeri 3', 100],
  ].map(([label, hue], i) => ({
    id: i + 1,
    uuid: uuid(),
    originalName: `${String(label).toLowerCase().replace(/\s+/g, '-')}.svg`,
    storageKey: `gallery/2026/09/${String(label).toLowerCase().replace(/\s+/g, '-')}.svg`,
    disk: 'local',
    mimeType: 'image/svg+xml',
    size: 2048 + i * 512,
    width: 1200,
    height: 675,
    alt: String(label),
    folder: 'gallery',
    dataUrl: svgPlaceholder(Number(hue)),
    createdAt: daysAgo(10 - i),
    updatedAt: daysAgo(10 - i),
  }))
  const img = (i: number) => seedMedia[i]!.dataUrl!

  const roles: Role[] = [
    {
      id: 1,
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Akses penuh ke seluruh sistem',
      isSystem: true,
      permissions: [SUPER_PERMISSION],
    },
    {
      id: 2,
      name: 'Editor',
      slug: 'editor',
      description: 'Mengelola konten website',
      isSystem: false,
      permissions: ALL_PERMISSIONS.filter(
        (p) => !p.startsWith('user.') && !p.startsWith('role.') && p !== 'setting.update',
      ),
    },
    {
      id: 3,
      name: 'Viewer',
      slug: 'viewer',
      description: 'Hanya dapat melihat data CMS',
      isSystem: false,
      permissions: ALL_PERMISSIONS.filter(
        (p) => p.endsWith('.view') && !/^(user|role|audit_log)\./.test(p),
      ),
    },
  ]

  const users: DbUser[] = [
    ['Super Admin', 'superadmin@cms.local', [1]],
    ['Editor Konten', 'editor@cms.local', [2]],
    ['Viewer', 'viewer@cms.local', [3]],
  ].map(([name, email, roleIds], i) => ({
    id: i + 1,
    uuid: uuid(),
    name: name as string,
    email: email as string,
    password: 'Password123!',
    isActive: true,
    roleIds: roleIds as number[],
    lastLoginAt: null,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  }))

  const categories: Category[] = [
    'News',
    'Announcement',
    'Events',
    'Press Release',
    'Information',
  ].map((name, i) => ({
    id: i + 1,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: `Kategori ${name}`,
  }))

  const tags: Tag[] = ['Digital', 'Layanan', 'Inovasi', 'Kegiatan'].map((name, i) => ({
    id: i + 1,
    name,
    slug: name.toLowerCase(),
  }))

  const articleTitles = [
    'Peluncuran Portal Layanan Digital Terpadu',
    'Pengumuman Jadwal Pelayanan Akhir Tahun',
    'Workshop Transformasi Digital untuk UMKM',
    'Rilis Pers: Capaian Kinerja Semester I',
    'Informasi Pemeliharaan Sistem',
    'Draft: Rencana Program Tahun Depan',
  ]
  const articles: DbArticle[] = articleTitles.map((title, i) => {
    const draft = i === articleTitles.length - 1
    return {
      id: i + 1,
      uuid: uuid(),
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-'),
      excerpt: `Ringkasan singkat untuk artikel "${title}".`,
      content: `## ${title}\n\nIni adalah konten contoh untuk artikel **${title}**. Konten ditulis menggunakan Markdown dan dirender dengan aman di website publik.\n\n- Poin pertama\n- Poin kedua\n- Poin ketiga\n\n> Kutipan penting terkait artikel ini.\n\nParagraf penutup dengan [tautan](/about).`,
      featuredImage: img(i % 3),
      categoryId: (i % categories.length) + 1,
      tagIds: [(i % tags.length) + 1],
      authorId: 1,
      status: draft ? 'DRAFT' : 'PUBLISHED',
      publishedAt: draft ? null : daysAgo(i * 3 + 1),
      seo: { title, description: `Ringkasan singkat untuk artikel "${title}".` },
      createdAt: daysAgo(i * 3 + 2),
      updatedAt: daysAgo(i * 3 + 1),
    }
  })

  const section = (
    id: number,
    type: Page['sections'][number]['type'],
    order: number,
    content: Record<string, unknown>,
  ) => ({
    id,
    type,
    sortOrder: order,
    isActive: true,
    content,
  })

  const pages: Page[] = [
    {
      id: 1,
      uuid: uuid(),
      title: 'Home',
      slug: 'home',
      status: 'PUBLISHED',
      publishedAt: daysAgo(20),
      featuredImage: img(0),
      content: null,
      seo: {
        title: 'Beranda',
        description: 'Portal resmi — informasi, layanan, dan berita terbaru.',
      },
      sections: [
        section(1, 'HERO', 1, {
          title: 'Selamat Datang',
          description: 'Portal resmi untuk informasi, layanan, dan berita terbaru.',
          image: img(0),
          buttonLabel: 'Selengkapnya',
          buttonUrl: '/about',
        }),
        section(2, 'STATISTIC', 2, {
          title: 'Capaian Kami',
          items: [
            { label: 'Layanan Digital', value: '120+' },
            { label: 'Pengguna Aktif', value: '50K' },
            { label: 'Mitra', value: '85' },
            { label: 'Tahun Pengalaman', value: '15' },
          ],
        }),
        section(3, 'SERVICES', 3, {
          title: 'Layanan',
          description: 'Layanan unggulan yang dapat diakses secara online.',
          items: [
            {
              title: 'Perizinan Online',
              description: 'Ajukan perizinan tanpa antre.',
              icon: 'file-check',
            },
            {
              title: 'Pengaduan',
              description: 'Sampaikan aspirasi dan pengaduan.',
              icon: 'message-square',
            },
            {
              title: 'Informasi Publik',
              description: 'Akses data dan dokumen publik.',
              icon: 'database',
            },
          ],
        }),
        section(4, 'NEWS', 4, { title: 'Berita Terbaru', limit: 3 }),
        section(5, 'GALLERY', 5, {
          title: 'Galeri',
          images: [img(3), img(4), img(5)],
        }),
        section(6, 'CTA', 6, {
          title: 'Butuh bantuan?',
          description: 'Tim kami siap membantu Anda.',
          buttonLabel: 'Hubungi Kami',
          buttonUrl: '/contact',
        }),
      ],
      createdAt: daysAgo(25),
      updatedAt: daysAgo(20),
    },
    {
      id: 2,
      uuid: uuid(),
      title: 'About',
      slug: 'about',
      status: 'PUBLISHED',
      publishedAt: daysAgo(19),
      content: null,
      seo: { title: 'Tentang Kami' },
      sections: [
        section(7, 'IMAGE_TEXT', 1, {
          title: 'Tentang Kami',
          body: 'Kami berkomitmen menghadirkan layanan publik yang **cepat**, **transparan**, dan **akuntabel** melalui transformasi digital.',
          image: img(2),
          imagePosition: 'right',
        }),
        section(8, 'FAQ', 2, {
          title: 'Pertanyaan Umum',
          items: [
            {
              question: 'Bagaimana cara mengakses layanan?',
              answer: 'Semua layanan dapat diakses melalui portal ini.',
            },
            {
              question: 'Apakah layanan berbayar?',
              answer: 'Sebagian besar layanan tidak dipungut biaya.',
            },
          ],
        }),
      ],
      createdAt: daysAgo(24),
      updatedAt: daysAgo(19),
    },
    {
      id: 3,
      uuid: uuid(),
      title: 'Services',
      slug: 'services',
      status: 'PUBLISHED',
      publishedAt: daysAgo(18),
      content: null,
      seo: { title: 'Layanan' },
      sections: [
        section(9, 'CARD', 1, {
          title: 'Layanan Kami',
          items: [
            {
              title: 'Konsultasi',
              description: 'Konsultasi layanan secara daring.',
              image: img(1),
              url: '/contact',
            },
            {
              title: 'Pelatihan',
              description: 'Program pelatihan digital.',
              image: img(2),
              url: '/news',
            },
            {
              title: 'Pendampingan',
              description: 'Pendampingan implementasi.',
              image: img(0),
              url: '/contact',
            },
          ],
        }),
      ],
      createdAt: daysAgo(23),
      updatedAt: daysAgo(18),
    },
    {
      id: 4,
      uuid: uuid(),
      title: 'Contact',
      slug: 'contact',
      status: 'PUBLISHED',
      publishedAt: daysAgo(17),
      content: null,
      seo: { title: 'Kontak' },
      sections: [
        section(10, 'CONTACT', 1, {
          title: 'Hubungi Kami',
          description: 'Silakan hubungi kami melalui kanal berikut.',
          showMap: false,
        }),
      ],
      createdAt: daysAgo(22),
      updatedAt: daysAgo(17),
    },
    {
      id: 5,
      uuid: uuid(),
      title: 'FAQ',
      slug: 'faq',
      status: 'DRAFT',
      publishedAt: null,
      content: null,
      seo: null,
      sections: [],
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
  ]

  const banners: Banner[] = [
    {
      id: 1,
      title: 'Transformasi Digital',
      subtitle: 'Membangun Indonesia melalui layanan publik yang modern.',
      image: img(0),
      buttonLabel: 'Pelajari Selengkapnya',
      buttonUrl: '/about',
      startDate: null,
      endDate: null,
      sortOrder: 1,
      status: 'PUBLISHED',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },
  ]

  const menus: Menu[] = [
    {
      id: 1,
      name: 'Main Menu',
      location: 'header',
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
      items: [
        {
          id: 1,
          title: 'Home',
          url: '/',
          linkType: 'URL',
          parentId: null,
          sortOrder: 1,
          target: '_self',
          isActive: true,
        },
        {
          id: 2,
          title: 'About',
          url: '/about',
          linkType: 'PAGE',
          parentId: null,
          sortOrder: 2,
          target: '_self',
          isActive: true,
        },
        {
          id: 3,
          title: 'Profile',
          url: '/about',
          linkType: 'PAGE',
          parentId: 2,
          sortOrder: 1,
          target: '_self',
          isActive: true,
        },
        {
          id: 4,
          title: 'FAQ',
          url: '/faq',
          linkType: 'PAGE',
          parentId: 2,
          sortOrder: 2,
          target: '_self',
          isActive: true,
        },
        {
          id: 5,
          title: 'Services',
          url: '/services',
          linkType: 'PAGE',
          parentId: null,
          sortOrder: 3,
          target: '_self',
          isActive: true,
        },
        {
          id: 6,
          title: 'News',
          url: '/news',
          linkType: 'URL',
          parentId: null,
          sortOrder: 4,
          target: '_self',
          isActive: true,
        },
        {
          id: 7,
          title: 'Contact',
          url: '/contact',
          linkType: 'PAGE',
          parentId: null,
          sortOrder: 5,
          target: '_self',
          isActive: true,
        },
      ],
    },
    {
      id: 2,
      name: 'Footer Menu',
      location: 'footer',
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
      items: [
        {
          id: 8,
          title: 'Tentang',
          url: '/about',
          linkType: 'PAGE',
          parentId: null,
          sortOrder: 1,
          target: '_self',
          isActive: true,
        },
        {
          id: 9,
          title: 'Berita',
          url: '/news',
          linkType: 'URL',
          parentId: null,
          sortOrder: 2,
          target: '_self',
          isActive: true,
        },
        {
          id: 10,
          title: 'Kontak',
          url: '/contact',
          linkType: 'PAGE',
          parentId: null,
          sortOrder: 3,
          target: '_self',
          isActive: true,
        },
      ],
    },
  ]

  const settings: SiteSettings = {
    siteName: 'CMS Portal',
    tagline: 'Portal Resmi',
    logo: null,
    favicon: null,
    email: 'info@example.go.id',
    phone: '(021) 123-4567',
    address: 'Jl. Merdeka No. 1, Jakarta',
    footerText: '© 2026 CMS Portal. Seluruh hak cipta dilindungi.',
    social: {
      facebook: 'https://facebook.com/',
      instagram: 'https://instagram.com/',
      youtube: 'https://youtube.com/',
      tiktok: null,
      linkedin: null,
      x: 'https://x.com/',
    },
    googleAnalyticsId: null,
    googleTagManagerId: null,
  }

  return {
    seq: {
      users: users.length,
      roles: roles.length,
      pages: pages.length,
      sections: 10,
      articles: articles.length,
      categories: categories.length,
      tags: tags.length,
      media: seedMedia.length,
      banners: banners.length,
      menus: menus.length,
      menuItems: 10,
      auditLogs: 0,
    },
    users,
    roles,
    pages,
    articles,
    categories,
    tags,
    media: seedMedia,
    banners,
    menus,
    settings,
    auditLogs: [],
    refreshTokens: {},
    resetTokens: {},
  }
}

let db: Database | null = null

export function getDb(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    db = raw ? (JSON.parse(raw) as Database) : seed()
  } catch {
    db = seed()
  }
  return db
}

export function persist() {
  if (!db) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    /* quota exceeded — keep in memory */
  }
}

export function resetDb() {
  db = seed()
  persist()
}

export function nextId(key: string): number {
  const d = getDb()
  d.seq[key] = (d.seq[key] ?? 0) + 1
  return d.seq[key]!
}
