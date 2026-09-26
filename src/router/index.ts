import {
  createRouter,
  createWebHistory,
  type RouteComponent,
  type RouteRecordRaw,
} from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    permission?: string
    title?: string
  }
}

const admin = (
  path: string,
  name: string,
  component: () => Promise<RouteComponent | { default: RouteComponent }>,
  permission?: string,
  title?: string,
): RouteRecordRaw => ({ path, name, component, meta: { permission, title } })

export const routes: RouteRecordRaw[] = [
  // ---------------- Admin CMS
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      admin('', 'dashboard', () => import('@/pages/admin/Dashboard.vue'), undefined, 'Dashboard'),
      admin('pages', 'pages', () => import('@/pages/admin/Pages.vue'), 'page.view', 'Pages'),
      admin(
        'pages/new',
        'page-create',
        () => import('@/pages/admin/PageEditor.vue'),
        'page.create',
        'Buat Page',
      ),
      admin(
        'pages/:id',
        'page-edit',
        () => import('@/pages/admin/PageEditor.vue'),
        'page.view',
        'Edit Page',
      ),
      admin(
        'articles',
        'articles',
        () => import('@/pages/admin/Articles.vue'),
        'article.view',
        'Articles',
      ),
      admin(
        'articles/new',
        'article-create',
        () => import('@/pages/admin/ArticleEditor.vue'),
        'article.create',
        'Buat Artikel',
      ),
      admin(
        'articles/:id',
        'article-edit',
        () => import('@/pages/admin/ArticleEditor.vue'),
        'article.view',
        'Edit Artikel',
      ),
      admin(
        'categories',
        'categories',
        () => import('@/pages/admin/Categories.vue'),
        'category.view',
        'Categories & Tags',
      ),
      admin(
        'banners',
        'banners',
        () => import('@/pages/admin/Banners.vue'),
        'banner.view',
        'Banners',
      ),
      admin(
        'media',
        'media',
        () => import('@/pages/admin/Media.vue'),
        'media.view',
        'Media Library',
      ),
      admin('menus', 'menus', () => import('@/pages/admin/Menus.vue'), 'menu.view', 'Menus'),
      admin('users', 'users', () => import('@/pages/admin/Users.vue'), 'user.view', 'Users'),
      admin(
        'roles',
        'roles',
        () => import('@/pages/admin/Roles.vue'),
        'role.view',
        'Roles & Permissions',
      ),
      admin(
        'settings',
        'settings',
        () => import('@/pages/admin/Settings.vue'),
        'setting.view',
        'Settings',
      ),
      admin(
        'audit-logs',
        'audit-logs',
        () => import('@/pages/admin/AuditLogs.vue'),
        'audit_log.view',
        'Audit Log',
      ),
      admin('profile', 'profile', () => import('@/pages/admin/Profile.vue'), undefined, 'Profil'),
      admin(
        'forbidden',
        'forbidden',
        () => import('@/pages/admin/Forbidden.vue'),
        undefined,
        'Akses Ditolak',
      ),
      admin(
        ':pathMatch(.*)*',
        'admin-not-found',
        () => import('@/pages/NotFound.vue'),
        undefined,
        'Tidak Ditemukan',
      ),
    ],
  },
  // ---------------- Admin auth (guest). Declared after the CMS record so `/admin` resolves to the dashboard.
  {
    path: '/admin',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { guestOnly: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/pages/admin/auth/Login.vue'),
        meta: { title: 'Login' },
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/pages/admin/auth/ForgotPassword.vue'),
        meta: { title: 'Lupa Password' },
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('@/pages/admin/auth/ResetPassword.vue'),
        meta: { title: 'Reset Password' },
      },
    ],
  },
  // ---------------- Public website
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/public/Home.vue') },
      { path: 'news', name: 'news', component: () => import('@/pages/public/Articles.vue') },
      {
        path: 'news/:slug',
        name: 'news-detail',
        component: () => import('@/pages/public/ArticleDetail.vue'),
      },
      { path: 'search', name: 'search', component: () => import('@/pages/public/Search.vue') },
      { path: 'contact', name: 'contact', component: () => import('@/pages/public/Contact.vue') },
      {
        path: ':slug([a-z0-9-]+)',
        name: 'page',
        component: () => import('@/pages/public/Page.vue'),
      },
      {
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/pages/NotFound.vue'),
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const isAdmin = to.path.startsWith('/admin')
  if (!isAdmin) return true

  const auth = useAuthStore()
  await auth.init()

  if (to.matched.some((r) => r.meta.guestOnly) && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  if (to.matched.some((r) => r.meta.requiresAuth) && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  const permission = to.meta.permission
  if (permission && !auth.can(permission)) {
    return { name: 'forbidden' }
  }
  return true
})

router.afterEach((to) => {
  if (to.path.startsWith('/admin') && to.meta.title) {
    document.title = `${to.meta.title} · CMS Admin`
  }
})
