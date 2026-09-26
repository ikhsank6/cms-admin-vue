import type { Component } from 'vue'
import {
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  Menu as MenuIcon,
  Newspaper,
  ScrollText,
  Settings,
  Shield,
  Users,
  GalleryHorizontalEnd,
} from 'lucide-vue-next'

export interface NavItem {
  label: string
  to: string
  icon: Component
  permission?: string
}

/** One rail icon (column 1) plus the submenu it opens in the panel (column 2). */
export interface NavSection {
  label: string
  icon: Component
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Beranda',
    icon: LayoutDashboard,
    items: [{ label: 'Dashboard', to: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Konten',
    icon: FileText,
    items: [
      { label: 'Pages', to: '/admin/pages', icon: FileText, permission: 'page.view' },
      { label: 'Articles', to: '/admin/articles', icon: Newspaper, permission: 'article.view' },
      {
        label: 'Categories & Tags',
        to: '/admin/categories',
        icon: FolderTree,
        permission: 'category.view',
      },
      {
        label: 'Banners',
        to: '/admin/banners',
        icon: GalleryHorizontalEnd,
        permission: 'banner.view',
      },
      { label: 'Media Library', to: '/admin/media', icon: Image, permission: 'media.view' },
      { label: 'Menus', to: '/admin/menus', icon: MenuIcon, permission: 'menu.view' },
    ],
  },
  {
    label: 'Manajemen',
    icon: Users,
    items: [
      { label: 'Users', to: '/admin/users', icon: Users, permission: 'user.view' },
      { label: 'Roles & Permissions', to: '/admin/roles', icon: Shield, permission: 'role.view' },
    ],
  },
  {
    label: 'Pengaturan',
    icon: Settings,
    items: [
      { label: 'Settings', to: '/admin/settings', icon: Settings, permission: 'setting.view' },
      {
        label: 'Audit Log',
        to: '/admin/audit-logs',
        icon: ScrollText,
        permission: 'audit_log.view',
      },
    ],
  },
]

export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items)

/** Whether `path` belongs to the given nav item (exact match, or a sub-route of it). */
export function isItemActive(path: string, item: NavItem): boolean {
  if (item.to === '/admin') return path === '/admin'
  return path === item.to || path.startsWith(`${item.to}/`)
}

/** Index of the section whose item best matches `path` (longest `to` wins). Falls back to 0. */
export function findActiveSectionIndex(path: string): number {
  let best = 0
  let bestLength = -1
  navSections.forEach((section, i) => {
    for (const item of section.items) {
      if (isItemActive(path, item) && item.to.length > bestLength) {
        best = i
        bestLength = item.to.length
      }
    }
  })
  return best
}

/** Sections filtered down to the items the current user can see (RBAC), empty groups dropped. */
export function visibleSections(canFn: (permission: string) => boolean): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || canFn(item.permission)),
    }))
    .filter((section) => section.items.length > 0)
}
