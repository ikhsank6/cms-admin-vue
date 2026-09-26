import type {
  ApiResponse,
  Article,
  Category,
  ListParams,
  Menu,
  Page,
  Paginated,
  PublicHome,
  SearchResult,
  SiteSettings,
} from '@/types'
import { api } from './api'
import { cleanParams } from './crud'

const P = '/public'

export const publicService = {
  async home(): Promise<PublicHome> {
    return (await api.get<ApiResponse<PublicHome>>(`${P}/home`)).data.data
  },
  async page(slug: string): Promise<Page> {
    return (await api.get<ApiResponse<Page>>(`${P}/pages/${encodeURIComponent(slug)}`)).data.data
  },
  async articles(params?: ListParams): Promise<Paginated<Article>> {
    return (await api.get<Paginated<Article>>(`${P}/articles`, { params: cleanParams(params) }))
      .data
  },
  async article(slug: string): Promise<Article> {
    return (await api.get<ApiResponse<Article>>(`${P}/articles/${encodeURIComponent(slug)}`)).data
      .data
  },
  async categories(): Promise<Category[]> {
    return (await api.get<ApiResponse<Category[]>>(`${P}/categories`)).data.data
  },
  async menus(): Promise<Menu[]> {
    return (await api.get<ApiResponse<Menu[]>>(`${P}/menus`)).data.data
  },
  async settings(): Promise<SiteSettings> {
    return (await api.get<ApiResponse<SiteSettings>>(`${P}/settings`)).data.data
  },
  async search(q: string): Promise<SearchResult[]> {
    return (await api.get<ApiResponse<SearchResult[]>>(`${P}/search`, { params: { q } })).data.data
  },
}
