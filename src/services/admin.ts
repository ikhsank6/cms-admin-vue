import type {
  ApiResponse,
  Article,
  ArticleInput,
  AuditLog,
  Banner,
  BannerInput,
  Category,
  DashboardStats,
  ID,
  Menu,
  MenuItem,
  Page,
  PageInput,
  Permission,
  Role,
  SiteSettings,
  Tag,
  User,
} from '@/types'
import { api } from './api'
import { createResource, withPublishing } from './crud'

const A = '/admin'

export interface UserInput {
  name: string
  email: string
  password?: string
  isActive: boolean
  roleIds: ID[]
}

export interface RoleInput {
  name: string
  slug: string
  description?: string
  permissions: string[]
}

export const pageService = {
  ...createResource<Page, PageInput>(`${A}/pages`),
  ...withPublishing<Page>(`${A}/pages`),
}

export const articleService = {
  ...createResource<Article, ArticleInput>(`${A}/articles`),
  ...withPublishing<Article>(`${A}/articles`),
}

export const categoryService = createResource<Category, Partial<Category>>(`${A}/categories`)
export const tagService = createResource<Tag, Partial<Tag>>(`${A}/tags`)

export const bannerService = {
  ...createResource<Banner, BannerInput>(`${A}/banners`),
  ...withPublishing<Banner>(`${A}/banners`),
}

export const userService = createResource<User, UserInput>(`${A}/users`)

export const roleService = {
  ...createResource<Role, RoleInput>(`${A}/roles`),
  async permissions(): Promise<Permission[]> {
    const res = await api.get<ApiResponse<Permission[]>>(`${A}/permissions`)
    return res.data.data
  },
}

export const menuService = {
  ...createResource<Menu, { name: string; location: string }>(`${A}/menus`),
  /** Replace the full item tree of a menu (order + nesting). */
  async saveItems(menuId: ID, items: MenuItem[]): Promise<Menu> {
    const res = await api.put<ApiResponse<Menu>>(`${A}/menus/${menuId}/items`, { items })
    return res.data.data
  },
}

export const settingsService = {
  async get(): Promise<SiteSettings> {
    const res = await api.get<ApiResponse<SiteSettings>>(`${A}/settings`)
    return res.data.data
  },
  async update(input: SiteSettings): Promise<SiteSettings> {
    const res = await api.put<ApiResponse<SiteSettings>>(`${A}/settings`, input)
    return res.data.data
  },
}

export const auditLogService = createResource<AuditLog, never>(`${A}/audit-logs`)

export const dashboardService = {
  async get(): Promise<DashboardStats> {
    const res = await api.get<ApiResponse<DashboardStats>>(`${A}/dashboard`)
    return res.data.data
  },
}
