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

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const adminNavigation: NavGroup[] = [
  {
    label: 'Umum',
    items: [{ label: 'Dashboard', to: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Konten',
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
    label: 'Sistem',
    items: [
      { label: 'Users', to: '/admin/users', icon: Users, permission: 'user.view' },
      { label: 'Roles & Permissions', to: '/admin/roles', icon: Shield, permission: 'role.view' },
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
