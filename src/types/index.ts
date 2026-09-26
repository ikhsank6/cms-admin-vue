// Domain types shared by the admin CMS, the public site and the mock API.
// They mirror the REST contract documented in docs/API.md.

export type ID = number

export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface ApiResponse<T> {
  data: T
}

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface ListParams {
  page?: number
  perPage?: number
  search?: string
  sort?: string
  [key: string]: string | number | boolean | undefined
}

// ---------- Auth / RBAC ----------

export interface Permission {
  id: ID
  key: string
  module: string
  description?: string
}

export interface Role {
  id: ID
  name: string
  slug: string
  description?: string
  isSystem?: boolean
  permissions: string[]
  usersCount?: number
}

export interface User {
  id: ID
  uuid: string
  name: string
  email: string
  avatar?: string | null
  isActive: boolean
  roles: Pick<Role, 'id' | 'name' | 'slug'>[]
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthUser extends User {
  permissions: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser
}

// ---------- SEO ----------

export interface SeoMetadata {
  title?: string | null
  description?: string | null
  keywords?: string | null
  canonicalUrl?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  robots?: string | null
}

// ---------- Media ----------

export type StorageDisk = 'local' | 's3'

export interface Media {
  id: ID
  uuid: string
  originalName: string
  storageKey: string
  disk: StorageDisk
  mimeType: string
  size: number
  width?: number | null
  height?: number | null
  alt?: string | null
  folder?: string | null
  /** Public URL, generated server-side by StorageService (never stored as primary data). */
  url: string
  createdAt: string
  updatedAt: string
}

export type UploadTicket =
  | {
      driver: 's3'
      uploadUrl: string
      method: 'PUT'
      headers?: Record<string, string>
      storageKey: string
      expiresIn: number
    }
  | { driver: 'local' }

// ---------- Pages & sections ----------

export type SectionType =
  | 'HERO'
  | 'TEXT'
  | 'IMAGE'
  | 'IMAGE_TEXT'
  | 'STATISTIC'
  | 'CARD'
  | 'SERVICES'
  | 'NEWS'
  | 'GALLERY'
  | 'CTA'
  | 'FAQ'
  | 'CONTACT'

export type SectionContent = Record<string, unknown>

export interface PageSection {
  id?: ID
  /** Client-side key used for list rendering before the section is saved. */
  key?: string
  type: SectionType
  sortOrder: number
  isActive: boolean
  content: SectionContent
}

export interface Page {
  id: ID
  uuid: string
  title: string
  slug: string
  content?: string | null
  featuredImage?: string | null
  status: ContentStatus
  publishedAt?: string | null
  sections: PageSection[]
  seo?: SeoMetadata | null
  createdAt: string
  updatedAt: string
}

export type PageInput = Pick<
  Page,
  'title' | 'slug' | 'content' | 'featuredImage' | 'status' | 'publishedAt' | 'sections' | 'seo'
>

// ---------- Articles ----------

export interface Category {
  id: ID
  name: string
  slug: string
  description?: string | null
  articlesCount?: number
}

export interface Tag {
  id: ID
  name: string
  slug: string
  articlesCount?: number
}

export interface Article {
  id: ID
  uuid: string
  title: string
  slug: string
  excerpt?: string | null
  /** Markdown content. Rendered and sanitized on display. */
  content: string
  featuredImage?: string | null
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null
  categoryId?: ID | null
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[]
  author?: Pick<User, 'id' | 'name'> | null
  status: ContentStatus
  publishedAt?: string | null
  seo?: SeoMetadata | null
  createdAt: string
  updatedAt: string
}

export interface ArticleInput {
  title: string
  slug: string
  excerpt?: string | null
  content: string
  featuredImage?: string | null
  categoryId?: ID | null
  tagIds: ID[]
  status: ContentStatus
  publishedAt?: string | null
  seo?: SeoMetadata | null
}

// ---------- Banners ----------

export interface Banner {
  id: ID
  title: string
  subtitle?: string | null
  image?: string | null
  buttonLabel?: string | null
  buttonUrl?: string | null
  startDate?: string | null
  endDate?: string | null
  sortOrder: number
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

export type BannerInput = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>

// ---------- Menus ----------

export type MenuTarget = '_self' | '_blank'
export type MenuLinkType = 'PAGE' | 'ARTICLE' | 'URL'

export interface MenuItem {
  id?: ID
  key?: string
  title: string
  url: string
  linkType: MenuLinkType
  parentId?: ID | null
  sortOrder: number
  target: MenuTarget
  isActive: boolean
  children?: MenuItem[]
}

export interface Menu {
  id: ID
  name: string
  /** Where the menu is rendered, e.g. "header" or "footer". */
  location: string
  items: MenuItem[]
  createdAt: string
  updatedAt: string
}

// ---------- Settings ----------

export interface SiteSettings {
  siteName: string
  tagline?: string | null
  logo?: string | null
  favicon?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  footerText?: string | null
  social: {
    facebook?: string | null
    instagram?: string | null
    youtube?: string | null
    tiktok?: string | null
    linkedin?: string | null
    x?: string | null
  }
  googleAnalyticsId?: string | null
  googleTagManagerId?: string | null
}

// ---------- Audit log ----------

export type AuditAction =
  'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH' | 'LOGIN' | 'LOGOUT'

export interface AuditLog {
  id: ID
  userId: ID | null
  user?: Pick<User, 'id' | 'name' | 'email'> | null
  action: AuditAction
  module: string
  resourceType: string
  resourceId: string | null
  oldData?: unknown
  newData?: unknown
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

// ---------- Dashboard ----------

export interface DashboardStats {
  totals: { pages: number; articles: number; media: number; users: number }
  pages: { published: number; draft: number }
  articles: { published: number; draft: number }
  recentActivities: AuditLog[]
  latestContent: {
    type: 'page' | 'article'
    id: ID
    title: string
    status: ContentStatus
    updatedAt: string
  }[]
}

// ---------- Public ----------

export interface PublicHome {
  page: Page | null
  banners: Banner[]
  latestArticles: Article[]
}

export interface SearchResult {
  type: 'page' | 'article'
  title: string
  slug: string
  excerpt?: string | null
  url: string
  publishedAt?: string | null
}
