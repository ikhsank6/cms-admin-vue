import type {
  Article,
  AuditAction,
  AuditLog,
  AuthUser,
  Banner,
  ContentStatus,
  Media,
  Menu,
  MenuItem,
  Page,
  PageSection,
  SearchResult,
  User,
} from '@/types'
import { ALL_PERMISSIONS, PERMISSION_MODULES, hasPermission } from '@/config/permissions'
import { isValidSlug } from '@/utils/slug'
import { getDb, nextId, persist, uuid, type DbArticle, type DbMedia, type DbUser } from './db'
import {
  HttpError,
  MockRouter,
  created,
  matchesSearch,
  noContent,
  notFound,
  ok,
  paginate,
  sortBy,
  validation,
  type MockRequest,
} from './router'

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60

const now = () => new Date().toISOString()

// ---------------------------------------------------------------- serializers

function permissionsOf(user: DbUser): string[] {
  const db = getDb()
  const perms = new Set<string>()
  for (const roleId of user.roleIds) {
    db.roles.find((r) => r.id === roleId)?.permissions.forEach((p) => perms.add(p))
  }
  return [...perms]
}

function toUser(u: DbUser): User {
  const db = getDb()
  return {
    id: u.id,
    uuid: u.uuid,
    name: u.name,
    email: u.email,
    avatar: u.avatar ?? null,
    isActive: u.isActive,
    roles: db.roles
      .filter((r) => u.roleIds.includes(r.id))
      .map((r) => ({ id: r.id, name: r.name, slug: r.slug })),
    lastLoginAt: u.lastLoginAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

function toAuthUser(u: DbUser): AuthUser {
  return { ...toUser(u), permissions: permissionsOf(u) }
}

function toArticle(a: DbArticle): Article {
  const db = getDb()
  const category = db.categories.find((c) => c.id === a.categoryId)
  const author = db.users.find((u) => u.id === a.authorId)
  const { tagIds, authorId: _authorId, ...rest } = a
  void _authorId
  return {
    ...rest,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    tags: db.tags
      .filter((t) => tagIds.includes(t.id))
      .map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
    author: author ? { id: author.id, name: author.name } : null,
  }
}

function toMedia(m: DbMedia): Media {
  const { dataUrl, ...rest } = m
  // StorageService equivalent: URL derived from disk + storage key.
  return { ...rest, url: dataUrl ?? `/storage/${m.storageKey}` }
}

function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const active = items.filter((i) => i.isActive)
  const byParent = (parentId: number | null): MenuItem[] =>
    active
      .filter((i) => (i.parentId ?? null) === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({ ...i, children: byParent(i.id!) }))
  return byParent(null)
}

// ---------------------------------------------------------------- guards & audit

function requireAuth(req: MockRequest): DbUser {
  if (!req.user) throw new HttpError(401, 'UNAUTHORIZED', 'Sesi tidak valid atau telah berakhir')
  return req.user
}

function can(req: MockRequest, permission: string) {
  requireAuth(req)
  if (!hasPermission(req.permissions, permission)) {
    throw new HttpError(403, 'FORBIDDEN', `Anda tidak memiliki izin ${permission}`)
  }
}

function audit(
  req: MockRequest,
  action: AuditAction,
  module: string,
  resourceType: string,
  resourceId: string | number | null,
  oldData?: unknown,
  newData?: unknown,
  userOverride?: DbUser,
) {
  const db = getDb()
  const user = userOverride ?? req.user
  const log: AuditLog = {
    id: nextId('auditLogs'),
    userId: user?.id ?? null,
    user: user ? { id: user.id, name: user.name, email: user.email } : null,
    action,
    module,
    resourceType,
    resourceId: resourceId === null ? null : String(resourceId),
    oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
    newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
    ipAddress: '127.0.0.1',
    userAgent:
      req.headers['user-agent'] ?? (typeof navigator !== 'undefined' ? navigator.userAgent : null),
    createdAt: now(),
  }
  db.auditLogs.unshift(log)
  db.auditLogs = db.auditLogs.slice(0, 500)
}

function stripHeavy<T extends object>(obj: T): T {
  // Keep audit payloads small (drop embedded data URLs).
  return JSON.parse(
    JSON.stringify(obj, (_k, v) =>
      typeof v === 'string' && v.startsWith('data:') ? '[data-url]' : v,
    ),
  )
}

function required(body: Record<string, unknown>, fields: string[]) {
  const errors: Record<string, string[]> = {}
  for (const f of fields) {
    const v = body?.[f]
    if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) {
      errors[f] = ['Wajib diisi']
    }
  }
  if (Object.keys(errors).length) validation(errors)
}

function checkSlug(slug: string, taken: boolean) {
  if (!isValidSlug(slug))
    validation({ slug: ['Slug hanya boleh huruf kecil, angka, dan tanda hubung'] })
  if (taken) validation({ slug: ['Slug sudah digunakan'] })
}

const isLive = (status: ContentStatus, publishedAt?: string | null) =>
  status === 'PUBLISHED' && (!publishedAt || new Date(publishedAt).getTime() <= Date.now())

// ---------------------------------------------------------------- tokens

export function issueTokens(user: DbUser) {
  const db = getDb()
  const refreshToken = `rt_${uuid()}`
  db.refreshTokens[refreshToken] = user.id
  return {
    accessToken: `mock.${user.id}.${Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000}.${uuid().slice(0, 8)}`,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  }
}

export function userFromAccessToken(token: string | undefined): DbUser | null {
  if (!token) return null
  const [prefix, id, exp] = token.split('.')
  if (prefix !== 'mock' || !id || !exp || Number(exp) < Date.now()) return null
  const user = getDb().users.find((u) => u.id === Number(id))
  return user?.isActive ? user : null
}

export { permissionsOf }

// ---------------------------------------------------------------- routes

export const router = new MockRouter()

// ----- Auth
router
  .post('/auth/login', (req) => {
    const db = getDb()
    required(req.body, ['email', 'password'])
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(req.body.email).toLowerCase(),
    )
    if (!user || user.password !== req.body.password) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email atau password salah')
    }
    if (!user.isActive) throw new HttpError(403, 'ACCOUNT_DISABLED', 'Akun dinonaktifkan')
    user.lastLoginAt = now()
    audit(req, 'LOGIN', 'auth', 'User', user.id, null, null, user)
    return ok({ ...issueTokens(user), user: toAuthUser(user) })
  })
  .post('/auth/refresh', (req) => {
    const db = getDb()
    const token = String(req.body?.refreshToken ?? '')
    const userId = db.refreshTokens[token]
    const user = db.users.find((u) => u.id === userId)
    if (!user || !user.isActive) throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Sesi berakhir')
    delete db.refreshTokens[token] // rotation
    return ok(issueTokens(user))
  })
  .post('/auth/logout', (req) => {
    const db = getDb()
    const token = String(req.body?.refreshToken ?? '')
    const userId = db.refreshTokens[token]
    delete db.refreshTokens[token]
    const user = db.users.find((u) => u.id === userId) ?? req.user
    if (user) audit(req, 'LOGOUT', 'auth', 'User', user.id, null, null, user)
    return noContent()
  })
  .get('/auth/me', (req) => ok(toAuthUser(requireAuth(req))))
  .put('/auth/profile', (req) => {
    const user = requireAuth(req)
    required(req.body, ['name', 'email'])
    const db = getDb()
    if (db.users.some((u) => u.email === req.body.email && u.id !== user.id)) {
      validation({ email: ['Email sudah digunakan'] })
    }
    const old = toUser(user)
    Object.assign(user, {
      name: req.body.name,
      email: req.body.email,
      avatar: req.body.avatar ?? user.avatar,
      updatedAt: now(),
    })
    audit(req, 'UPDATE', 'auth', 'Profile', user.id, old, toUser(user))
    return ok(toAuthUser(user))
  })
  .put('/auth/change-password', (req) => {
    const user = requireAuth(req)
    if (req.body?.currentPassword !== user.password) {
      validation({ currentPassword: ['Password saat ini salah'] })
    }
    if (String(req.body?.newPassword ?? '').length < 8) {
      validation({ newPassword: ['Minimal 8 karakter'] })
    }
    user.password = req.body.newPassword
    user.updatedAt = now()
    audit(req, 'UPDATE', 'auth', 'Password', user.id)
    return noContent()
  })
  .post('/auth/forgot-password', (req) => {
    const db = getDb()
    const user = db.users.find((u) => u.email === req.body?.email)
    if (user) {
      const token = `reset-${uuid().slice(0, 8)}`
      db.resetTokens[token] = user.id
      console.info(`[mock] Password reset link: /admin/reset-password?token=${token}`)
    }
    // Always 204 to avoid user enumeration.
    return noContent()
  })
  .post('/auth/reset-password', (req) => {
    const db = getDb()
    const userId = db.resetTokens[String(req.body?.token)]
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new HttpError(400, 'INVALID_TOKEN', 'Token reset tidak valid atau kedaluwarsa')
    if (String(req.body?.password ?? '').length < 8)
      validation({ password: ['Minimal 8 karakter'] })
    user.password = req.body.password
    delete db.resetTokens[String(req.body.token)]
    return noContent()
  })

// ----- Dashboard
router.get('/admin/dashboard', (req) => {
  requireAuth(req)
  const db = getDb()
  const count = (list: { status: ContentStatus }[], s: ContentStatus) =>
    list.filter((i) => i.status === s).length
  const latest = [
    ...db.pages.map((p) => ({
      type: 'page' as const,
      id: p.id,
      title: p.title,
      status: p.status,
      updatedAt: p.updatedAt,
    })),
    ...db.articles.map((a) => ({
      type: 'article' as const,
      id: a.id,
      title: a.title,
      status: a.status,
      updatedAt: a.updatedAt,
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)
  return ok({
    totals: {
      pages: db.pages.length,
      articles: db.articles.length,
      media: db.media.length,
      users: db.users.length,
    },
    pages: { published: count(db.pages, 'PUBLISHED'), draft: count(db.pages, 'DRAFT') },
    articles: { published: count(db.articles, 'PUBLISHED'), draft: count(db.articles, 'DRAFT') },
    recentActivities: db.auditLogs.slice(0, 8),
    latestContent: latest,
  })
})

// ----- Users
router
  .get('/admin/users', (req) => {
    can(req, 'user.view')
    const { search, role } = req.query
    const list = getDb()
      .users.filter((u) => matchesSearch(search, u.name, u.email))
      .filter((u) => !role || u.roleIds.includes(Number(role)))
    return {
      status: 200,
      data: paginate(sortBy(list, req.query.sort, '-createdAt').map(toUser), req.query),
    }
  })
  .get('/admin/users/:id', (req) => {
    can(req, 'user.view')
    const u = getDb().users.find((x) => x.id === Number(req.params.id)) ?? notFound('User')
    return ok(toUser(u))
  })
  .post('/admin/users', (req) => {
    can(req, 'user.create')
    required(req.body, ['name', 'email', 'password'])
    const db = getDb()
    if (db.users.some((u) => u.email === req.body.email))
      validation({ email: ['Email sudah digunakan'] })
    if (String(req.body.password).length < 8) validation({ password: ['Minimal 8 karakter'] })
    const user: DbUser = {
      id: nextId('users'),
      uuid: uuid(),
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      isActive: req.body.isActive ?? true,
      roleIds: req.body.roleIds ?? [],
      createdAt: now(),
      updatedAt: now(),
    }
    db.users.push(user)
    audit(req, 'CREATE', 'users', 'User', user.id, null, toUser(user))
    return created(toUser(user))
  })
  .put('/admin/users/:id', (req) => {
    can(req, 'user.update')
    const db = getDb()
    const user = db.users.find((x) => x.id === Number(req.params.id)) ?? notFound('User')
    required(req.body, ['name', 'email'])
    if (db.users.some((u) => u.email === req.body.email && u.id !== user.id)) {
      validation({ email: ['Email sudah digunakan'] })
    }
    const old = toUser(user)
    user.name = req.body.name
    user.email = req.body.email
    user.isActive = req.body.isActive ?? user.isActive
    user.roleIds = req.body.roleIds ?? user.roleIds
    if (req.body.password) {
      if (String(req.body.password).length < 8) validation({ password: ['Minimal 8 karakter'] })
      user.password = req.body.password
    }
    user.updatedAt = now()
    audit(req, 'UPDATE', 'users', 'User', user.id, old, toUser(user))
    return ok(toUser(user))
  })
  .delete('/admin/users/:id', (req) => {
    can(req, 'user.delete')
    const db = getDb()
    const user = db.users.find((x) => x.id === Number(req.params.id)) ?? notFound('User')
    if (user.id === req.user?.id)
      throw new HttpError(400, 'CANNOT_DELETE_SELF', 'Tidak dapat menghapus akun sendiri')
    db.users = db.users.filter((u) => u.id !== user.id)
    audit(req, 'DELETE', 'users', 'User', user.id, toUser(user))
    return noContent()
  })

// ----- Roles & permissions
router
  .get('/admin/permissions', (req) => {
    requireAuth(req)
    let id = 0
    return ok(
      Object.entries(PERMISSION_MODULES).flatMap(([module, actions]) =>
        actions.map((a) => ({ id: ++id, key: `${module}.${a}`, module })),
      ),
    )
  })
  .get('/admin/roles', (req) => {
    can(req, 'role.view')
    const db = getDb()
    const list = db.roles
      .filter((r) => matchesSearch(req.query.search, r.name, r.slug))
      .map((r) => ({ ...r, usersCount: db.users.filter((u) => u.roleIds.includes(r.id)).length }))
    return { status: 200, data: paginate(list, { perPage: '100', ...req.query }) }
  })
  .get('/admin/roles/:id', (req) => {
    can(req, 'role.view')
    return ok(getDb().roles.find((r) => r.id === Number(req.params.id)) ?? notFound('Role'))
  })
  .post('/admin/roles', (req) => {
    can(req, 'role.create')
    required(req.body, ['name', 'slug'])
    const db = getDb()
    checkSlug(
      req.body.slug,
      db.roles.some((r) => r.slug === req.body.slug),
    )
    const role = {
      id: nextId('roles'),
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description ?? '',
      isSystem: false,
      permissions: (req.body.permissions ?? []).filter((p: string) =>
        (ALL_PERMISSIONS as string[]).includes(p),
      ),
    }
    db.roles.push(role)
    audit(req, 'CREATE', 'roles', 'Role', role.id, null, role)
    return created(role)
  })
  .put('/admin/roles/:id', (req) => {
    can(req, 'role.update')
    const db = getDb()
    const role = db.roles.find((r) => r.id === Number(req.params.id)) ?? notFound('Role')
    if (role.isSystem) throw new HttpError(400, 'SYSTEM_ROLE', 'Role sistem tidak dapat diubah')
    required(req.body, ['name', 'slug'])
    checkSlug(
      req.body.slug,
      db.roles.some((r) => r.slug === req.body.slug && r.id !== role.id),
    )
    const old = { ...role }
    Object.assign(role, {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description ?? '',
      permissions: (req.body.permissions ?? []).filter((p: string) =>
        (ALL_PERMISSIONS as string[]).includes(p),
      ),
    })
    audit(req, 'UPDATE', 'roles', 'Role', role.id, old, role)
    return ok(role)
  })
  .delete('/admin/roles/:id', (req) => {
    can(req, 'role.delete')
    const db = getDb()
    const role = db.roles.find((r) => r.id === Number(req.params.id)) ?? notFound('Role')
    if (role.isSystem) throw new HttpError(400, 'SYSTEM_ROLE', 'Role sistem tidak dapat dihapus')
    if (db.users.some((u) => u.roleIds.includes(role.id))) {
      throw new HttpError(409, 'ROLE_IN_USE', 'Role masih digunakan oleh user')
    }
    db.roles = db.roles.filter((r) => r.id !== role.id)
    audit(req, 'DELETE', 'roles', 'Role', role.id, role)
    return noContent()
  })

// ----- Pages
function normalizeSections(sections: PageSection[] | undefined): PageSection[] {
  return (sections ?? []).map((s, i) => ({
    id: s.id ?? nextId('sections'),
    type: s.type,
    sortOrder: s.sortOrder ?? i + 1,
    isActive: s.isActive ?? true,
    content: s.content ?? {},
  }))
}

function publishFields(
  status: ContentStatus,
  publishedAt: string | null | undefined,
  prev?: string | null,
) {
  if (status === 'PUBLISHED') return publishedAt ?? prev ?? now()
  return publishedAt ?? null
}

router
  .get('/admin/pages', (req) => {
    can(req, 'page.view')
    const { search, status } = req.query
    const list = getDb()
      .pages.filter((p) => matchesSearch(search, p.title, p.slug))
      .filter((p) => !status || p.status === status)
    return { status: 200, data: paginate(sortBy(list, req.query.sort, '-updatedAt'), req.query) }
  })
  .get('/admin/pages/:id', (req) => {
    can(req, 'page.view')
    return ok(getDb().pages.find((p) => p.id === Number(req.params.id)) ?? notFound('Page'))
  })
  .post('/admin/pages', (req) => {
    can(req, 'page.create')
    required(req.body, ['title', 'slug'])
    const db = getDb()
    checkSlug(
      req.body.slug,
      db.pages.some((p) => p.slug === req.body.slug),
    )
    const status: ContentStatus = req.body.status ?? 'DRAFT'
    if (status === 'PUBLISHED') can(req, 'page.publish')
    const page: Page = {
      id: nextId('pages'),
      uuid: uuid(),
      title: req.body.title,
      slug: req.body.slug,
      content: req.body.content ?? null,
      featuredImage: req.body.featuredImage ?? null,
      status,
      publishedAt: publishFields(status, req.body.publishedAt),
      sections: normalizeSections(req.body.sections),
      seo: req.body.seo ?? null,
      createdAt: now(),
      updatedAt: now(),
    }
    db.pages.push(page)
    audit(req, 'CREATE', 'pages', 'Page', page.id, null, stripHeavy(page))
    return created(page)
  })
  .put('/admin/pages/:id', (req) => {
    can(req, 'page.update')
    const db = getDb()
    const page = db.pages.find((p) => p.id === Number(req.params.id)) ?? notFound('Page')
    required(req.body, ['title', 'slug'])
    checkSlug(
      req.body.slug,
      db.pages.some((p) => p.slug === req.body.slug && p.id !== page.id),
    )
    const status: ContentStatus = req.body.status ?? page.status
    if (status !== page.status) can(req, 'page.publish')
    const old = stripHeavy(page)
    Object.assign(page, {
      title: req.body.title,
      slug: req.body.slug,
      content: req.body.content ?? null,
      featuredImage: req.body.featuredImage ?? null,
      status,
      publishedAt: publishFields(status, req.body.publishedAt, page.publishedAt),
      sections: normalizeSections(req.body.sections),
      seo: req.body.seo ?? null,
      updatedAt: now(),
    })
    audit(req, 'UPDATE', 'pages', 'Page', page.id, old, stripHeavy(page))
    return ok(page)
  })
  .delete('/admin/pages/:id', (req) => {
    can(req, 'page.delete')
    const db = getDb()
    const page = db.pages.find((p) => p.id === Number(req.params.id)) ?? notFound('Page')
    db.pages = db.pages.filter((p) => p.id !== page.id)
    audit(req, 'DELETE', 'pages', 'Page', page.id, stripHeavy(page))
    return noContent()
  })
  .patch('/admin/pages/:id/publish', (req) => {
    can(req, 'page.publish')
    const page = getDb().pages.find((p) => p.id === Number(req.params.id)) ?? notFound('Page')
    page.status = 'PUBLISHED'
    page.publishedAt = page.publishedAt ?? now()
    page.updatedAt = now()
    audit(req, 'PUBLISH', 'pages', 'Page', page.id)
    return ok(page)
  })
  .patch('/admin/pages/:id/unpublish', (req) => {
    can(req, 'page.publish')
    const page = getDb().pages.find((p) => p.id === Number(req.params.id)) ?? notFound('Page')
    page.status = 'DRAFT'
    page.updatedAt = now()
    audit(req, 'UNPUBLISH', 'pages', 'Page', page.id)
    return ok(page)
  })

// ----- Articles
function articleFromBody(body: MockRequest['body'], prev?: DbArticle): Partial<DbArticle> {
  const status: ContentStatus = body.status ?? prev?.status ?? 'DRAFT'
  return {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt ?? null,
    content: body.content ?? '',
    featuredImage: body.featuredImage ?? null,
    categoryId: body.categoryId ?? null,
    tagIds: body.tagIds ?? [],
    status,
    publishedAt: publishFields(status, body.publishedAt, prev?.publishedAt),
    seo: body.seo ?? null,
  }
}

router
  .get('/admin/articles', (req) => {
    can(req, 'article.view')
    const { search, status, categoryId } = req.query
    const list = getDb()
      .articles.filter((a) => matchesSearch(search, a.title, a.slug, a.excerpt))
      .filter((a) => !status || a.status === status)
      .filter((a) => !categoryId || a.categoryId === Number(categoryId))
    return {
      status: 200,
      data: paginate(sortBy(list, req.query.sort, '-updatedAt').map(toArticle), req.query),
    }
  })
  .get('/admin/articles/:id', (req) => {
    can(req, 'article.view')
    const a = getDb().articles.find((x) => x.id === Number(req.params.id)) ?? notFound('Article')
    return ok(toArticle(a))
  })
  .post('/admin/articles', (req) => {
    can(req, 'article.create')
    required(req.body, ['title', 'slug', 'content'])
    const db = getDb()
    checkSlug(
      req.body.slug,
      db.articles.some((a) => a.slug === req.body.slug),
    )
    if (req.body.status === 'PUBLISHED') can(req, 'article.publish')
    const article = {
      id: nextId('articles'),
      uuid: uuid(),
      authorId: req.user!.id,
      createdAt: now(),
      updatedAt: now(),
      ...articleFromBody(req.body),
    } as DbArticle
    db.articles.push(article)
    audit(req, 'CREATE', 'articles', 'Article', article.id, null, stripHeavy(toArticle(article)))
    return created(toArticle(article))
  })
  .put('/admin/articles/:id', (req) => {
    can(req, 'article.update')
    const db = getDb()
    const article = db.articles.find((a) => a.id === Number(req.params.id)) ?? notFound('Article')
    required(req.body, ['title', 'slug', 'content'])
    checkSlug(
      req.body.slug,
      db.articles.some((a) => a.slug === req.body.slug && a.id !== article.id),
    )
    if (req.body.status && req.body.status !== article.status) can(req, 'article.publish')
    const old = stripHeavy(toArticle(article))
    Object.assign(article, articleFromBody(req.body, article), { updatedAt: now() })
    audit(req, 'UPDATE', 'articles', 'Article', article.id, old, stripHeavy(toArticle(article)))
    return ok(toArticle(article))
  })
  .delete('/admin/articles/:id', (req) => {
    can(req, 'article.delete')
    const db = getDb()
    const article = db.articles.find((a) => a.id === Number(req.params.id)) ?? notFound('Article')
    db.articles = db.articles.filter((a) => a.id !== article.id)
    audit(req, 'DELETE', 'articles', 'Article', article.id, stripHeavy(toArticle(article)))
    return noContent()
  })
  .patch('/admin/articles/:id/publish', (req) => {
    can(req, 'article.publish')
    const a = getDb().articles.find((x) => x.id === Number(req.params.id)) ?? notFound('Article')
    a.status = 'PUBLISHED'
    a.publishedAt = a.publishedAt ?? now()
    a.updatedAt = now()
    audit(req, 'PUBLISH', 'articles', 'Article', a.id)
    return ok(toArticle(a))
  })
  .patch('/admin/articles/:id/unpublish', (req) => {
    can(req, 'article.publish')
    const a = getDb().articles.find((x) => x.id === Number(req.params.id)) ?? notFound('Article')
    a.status = 'DRAFT'
    a.updatedAt = now()
    audit(req, 'UNPUBLISH', 'articles', 'Article', a.id)
    return ok(toArticle(a))
  })

// ----- Categories & tags (same shape)
for (const [path, key, perm, label] of [
  ['categories', 'categories', 'category', 'Category'],
  ['tags', 'tags', 'tag', 'Tag'],
] as const) {
  router
    .get(`/admin/${path}`, (req) => {
      can(req, `${perm}.view`)
      const db = getDb()
      const field = key === 'categories' ? 'categoryId' : 'tagIds'
      const list = db[key]
        .filter((c) => matchesSearch(req.query.search, c.name, c.slug))
        .map((c) => ({
          ...c,
          articlesCount: db.articles.filter((a) =>
            field === 'categoryId' ? a.categoryId === c.id : a.tagIds.includes(c.id),
          ).length,
        }))
      return { status: 200, data: paginate(sortBy(list, req.query.sort, 'name'), req.query) }
    })
    .get(`/admin/${path}/:id`, (req) => {
      can(req, `${perm}.view`)
      return ok(getDb()[key].find((c) => c.id === Number(req.params.id)) ?? notFound(label))
    })
    .post(`/admin/${path}`, (req) => {
      can(req, `${perm}.create`)
      required(req.body, ['name', 'slug'])
      const db = getDb()
      checkSlug(
        req.body.slug,
        db[key].some((c) => c.slug === req.body.slug),
      )
      const item = {
        id: nextId(key),
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description ?? null,
      }
      db[key].push(item)
      audit(req, 'CREATE', path, label, item.id, null, item)
      return created(item)
    })
    .put(`/admin/${path}/:id`, (req) => {
      can(req, `${perm}.update`)
      const db = getDb()
      const item = db[key].find((c) => c.id === Number(req.params.id)) ?? notFound(label)
      required(req.body, ['name', 'slug'])
      checkSlug(
        req.body.slug,
        db[key].some((c) => c.slug === req.body.slug && c.id !== item.id),
      )
      const old = { ...item }
      Object.assign(item, {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description ?? null,
      })
      audit(req, 'UPDATE', path, label, item.id, old, item)
      return ok(item)
    })
    .delete(`/admin/${path}/:id`, (req) => {
      can(req, `${perm}.delete`)
      const db = getDb()
      const item = db[key].find((c) => c.id === Number(req.params.id)) ?? notFound(label)
      ;(db[key] as { id: number }[]) = db[key].filter((c) => c.id !== item.id)
      if (key === 'categories')
        db.articles.forEach((a) => a.categoryId === item.id && (a.categoryId = null))
      else db.articles.forEach((a) => (a.tagIds = a.tagIds.filter((t) => t !== item.id)))
      audit(req, 'DELETE', path, label, item.id, item)
      return noContent()
    })
}

// ----- Media
function storageKey(folder: string, name: string) {
  const d = new Date()
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : ''
  return `${folder}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${uuid().slice(0, 12)}${ext}`
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

router
  .get('/admin/media', (req) => {
    can(req, 'media.view')
    const { search, type, from, to } = req.query
    const list = getDb()
      .media.filter((m) => matchesSearch(search, m.originalName, m.alt))
      .filter((m) => {
        if (!type) return true
        if (type === 'image') return m.mimeType.startsWith('image/')
        if (type === 'pdf') return m.mimeType === 'application/pdf'
        if (type === 'document')
          return /word|excel|spreadsheet|officedocument|msword/.test(m.mimeType)
        return true
      })
      .filter((m) => !from || m.createdAt >= new Date(from).toISOString())
      .filter(
        (m) => !to || m.createdAt <= new Date(new Date(to).getTime() + 86_399_999).toISOString(),
      )
    return {
      status: 200,
      data: paginate(sortBy(list, req.query.sort, '-createdAt').map(toMedia), {
        perPage: '24',
        ...req.query,
      }),
    }
  })
  .post('/admin/media/upload-url', (req) => {
    can(req, 'media.upload')
    required(req.body, ['originalName', 'mimeType', 'size'])
    // Mock runs with STORAGE_DRIVER=local → client uploads through the API.
    return ok({ driver: 'local' })
  })
  .post('/admin/media', async (req) => {
    can(req, 'media.upload')
    const form = req.body as FormData
    const file = form?.get?.('file')
    if (!(file instanceof Blob)) validation({ file: ['File wajib diunggah'] })
    const name = (file as File).name ?? 'upload'
    const folder = String(form.get('folder') || 'uploads')
    const media: DbMedia = {
      id: nextId('media'),
      uuid: uuid(),
      originalName: name,
      storageKey: storageKey(folder, name),
      disk: 'local',
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      alt: name.replace(/\.[^.]+$/, ''),
      folder,
      dataUrl: await readAsDataUrl(file),
      createdAt: now(),
      updatedAt: now(),
    }
    getDb().media.unshift(media)
    audit(req, 'CREATE', 'media', 'Media', media.id, null, {
      originalName: name,
      storageKey: media.storageKey,
    })
    return created(toMedia(media))
  })
  .put('/admin/media/:id', (req) => {
    can(req, 'media.upload')
    const m = getDb().media.find((x) => x.id === Number(req.params.id)) ?? notFound('Media')
    m.alt = req.body?.alt ?? null
    m.updatedAt = now()
    audit(req, 'UPDATE', 'media', 'Media', m.id)
    return ok(toMedia(m))
  })
  .delete('/admin/media/:id', (req) => {
    can(req, 'media.delete')
    const db = getDb()
    const m = db.media.find((x) => x.id === Number(req.params.id)) ?? notFound('Media')
    db.media = db.media.filter((x) => x.id !== m.id)
    audit(req, 'DELETE', 'media', 'Media', m.id, {
      originalName: m.originalName,
      storageKey: m.storageKey,
    })
    return noContent()
  })

// ----- Banners
router
  .get('/admin/banners', (req) => {
    can(req, 'banner.view')
    const list = getDb().banners.filter((b) => matchesSearch(req.query.search, b.title, b.subtitle))
    return { status: 200, data: paginate(sortBy(list, req.query.sort, 'sortOrder'), req.query) }
  })
  .get('/admin/banners/:id', (req) => {
    can(req, 'banner.view')
    return ok(getDb().banners.find((b) => b.id === Number(req.params.id)) ?? notFound('Banner'))
  })
  .post('/admin/banners', (req) => {
    can(req, 'banner.create')
    required(req.body, ['title'])
    const banner: Banner = {
      ...req.body,
      id: nextId('banners'),
      sortOrder: Number(req.body.sortOrder ?? 1),
      status: req.body.status ?? 'DRAFT',
      createdAt: now(),
      updatedAt: now(),
    }
    getDb().banners.push(banner)
    audit(req, 'CREATE', 'banners', 'Banner', banner.id, null, stripHeavy(banner))
    return created(banner)
  })
  .put('/admin/banners/:id', (req) => {
    can(req, 'banner.update')
    const b = getDb().banners.find((x) => x.id === Number(req.params.id)) ?? notFound('Banner')
    required(req.body, ['title'])
    const old = stripHeavy(b)
    Object.assign(b, req.body, {
      id: b.id,
      sortOrder: Number(req.body.sortOrder ?? b.sortOrder),
      updatedAt: now(),
    })
    audit(req, 'UPDATE', 'banners', 'Banner', b.id, old, stripHeavy(b))
    return ok(b)
  })
  .delete('/admin/banners/:id', (req) => {
    can(req, 'banner.delete')
    const db = getDb()
    const b = db.banners.find((x) => x.id === Number(req.params.id)) ?? notFound('Banner')
    db.banners = db.banners.filter((x) => x.id !== b.id)
    audit(req, 'DELETE', 'banners', 'Banner', b.id, stripHeavy(b))
    return noContent()
  })
  .patch('/admin/banners/:id/publish', (req) => {
    can(req, 'banner.publish')
    const b = getDb().banners.find((x) => x.id === Number(req.params.id)) ?? notFound('Banner')
    b.status = 'PUBLISHED'
    b.updatedAt = now()
    audit(req, 'PUBLISH', 'banners', 'Banner', b.id)
    return ok(b)
  })
  .patch('/admin/banners/:id/unpublish', (req) => {
    can(req, 'banner.publish')
    const b = getDb().banners.find((x) => x.id === Number(req.params.id)) ?? notFound('Banner')
    b.status = 'DRAFT'
    b.updatedAt = now()
    audit(req, 'UNPUBLISH', 'banners', 'Banner', b.id)
    return ok(b)
  })

// ----- Menus
function flattenItems(items: MenuItem[], parentId: number | null = null): MenuItem[] {
  return items.flatMap((item, i) => {
    const id = item.id ?? nextId('menuItems')
    const { children, key: _key, ...rest } = item
    void _key
    return [{ ...rest, id, parentId, sortOrder: i + 1 }, ...flattenItems(children ?? [], id)]
  })
}

function menuWithTree(menu: Menu, activeOnly = false): Menu {
  const items = activeOnly
    ? menu.items
    : menu.items.map((i) => ({ ...i, isActive: true, _active: i.isActive }))
  const tree = buildMenuTree(items as MenuItem[])
  if (activeOnly) return { ...menu, items: tree }
  // Restore real isActive flags for admin view.
  const restore = (list: MenuItem[]): MenuItem[] =>
    list.map((i) => {
      const { _active, ...rest } = i as MenuItem & { _active: boolean }
      return { ...rest, isActive: _active, children: restore(i.children ?? []) }
    })
  return { ...menu, items: restore(tree) }
}

router
  .get('/admin/menus', (req) => {
    can(req, 'menu.view')
    return {
      status: 200,
      data: paginate(
        getDb().menus.map((m) => menuWithTree(m)),
        { perPage: '100', ...req.query },
      ),
    }
  })
  .get('/admin/menus/:id', (req) => {
    can(req, 'menu.view')
    const m = getDb().menus.find((x) => x.id === Number(req.params.id)) ?? notFound('Menu')
    return ok(menuWithTree(m))
  })
  .post('/admin/menus', (req) => {
    can(req, 'menu.create')
    required(req.body, ['name', 'location'])
    const db = getDb()
    if (db.menus.some((m) => m.location === req.body.location))
      validation({ location: ['Lokasi sudah digunakan menu lain'] })
    const menu: Menu = {
      id: nextId('menus'),
      name: req.body.name,
      location: req.body.location,
      items: [],
      createdAt: now(),
      updatedAt: now(),
    }
    db.menus.push(menu)
    audit(req, 'CREATE', 'menus', 'Menu', menu.id, null, menu)
    return created(menu)
  })
  .put('/admin/menus/:id', (req) => {
    can(req, 'menu.update')
    const db = getDb()
    const m = db.menus.find((x) => x.id === Number(req.params.id)) ?? notFound('Menu')
    required(req.body, ['name', 'location'])
    if (db.menus.some((x) => x.location === req.body.location && x.id !== m.id))
      validation({ location: ['Lokasi sudah digunakan menu lain'] })
    const old = { name: m.name, location: m.location }
    Object.assign(m, { name: req.body.name, location: req.body.location, updatedAt: now() })
    audit(req, 'UPDATE', 'menus', 'Menu', m.id, old, { name: m.name, location: m.location })
    return ok(menuWithTree(m))
  })
  .put('/admin/menus/:id/items', (req) => {
    can(req, 'menu.update')
    const m = getDb().menus.find((x) => x.id === Number(req.params.id)) ?? notFound('Menu')
    const items: MenuItem[] = req.body?.items ?? []
    const flat = flattenItems(items)
    const invalid = flat.find((i) => !i.title?.trim() || !i.url?.trim())
    if (invalid) validation({ items: ['Setiap item wajib memiliki judul dan URL'] })
    const old = m.items
    m.items = flat
    m.updatedAt = now()
    audit(req, 'UPDATE', 'menus', 'MenuItems', m.id, old, flat)
    return ok(menuWithTree(m))
  })
  .delete('/admin/menus/:id', (req) => {
    can(req, 'menu.delete')
    const db = getDb()
    const m = db.menus.find((x) => x.id === Number(req.params.id)) ?? notFound('Menu')
    db.menus = db.menus.filter((x) => x.id !== m.id)
    audit(req, 'DELETE', 'menus', 'Menu', m.id, m)
    return noContent()
  })

// ----- Settings
router
  .get('/admin/settings', (req) => {
    can(req, 'setting.view')
    return ok(getDb().settings)
  })
  .put('/admin/settings', (req) => {
    can(req, 'setting.update')
    required(req.body, ['siteName'])
    const db = getDb()
    const old = stripHeavy(db.settings)
    db.settings = {
      ...db.settings,
      ...req.body,
      social: { ...db.settings.social, ...req.body.social },
    }
    audit(req, 'UPDATE', 'settings', 'SiteSettings', null, old, stripHeavy(db.settings))
    return ok(db.settings)
  })

// ----- Audit logs
router
  .get('/admin/audit-logs', (req) => {
    can(req, 'audit_log.view')
    const { search, action, module, userId, from, to } = req.query
    const list = getDb()
      .auditLogs.filter((l) =>
        matchesSearch(search, l.resourceType, l.resourceId, l.user?.name, l.module),
      )
      .filter((l) => !action || l.action === action)
      .filter((l) => !module || l.module === module)
      .filter((l) => !userId || l.userId === Number(userId))
      .filter((l) => !from || l.createdAt >= new Date(from).toISOString())
      .filter(
        (l) => !to || l.createdAt <= new Date(new Date(to).getTime() + 86_399_999).toISOString(),
      )
    return { status: 200, data: paginate(list, { perPage: '20', ...req.query }) }
  })
  .get('/admin/audit-logs/:id', (req) => {
    can(req, 'audit_log.view')
    return ok(
      getDb().auditLogs.find((l) => l.id === Number(req.params.id)) ?? notFound('Audit log'),
    )
  })

// ----- Public (published content only)
const livePages = () => getDb().pages.filter((p) => isLive(p.status, p.publishedAt))
const liveArticles = () =>
  sortBy(
    getDb().articles.filter((a) => isLive(a.status, a.publishedAt)),
    undefined,
    '-publishedAt',
  )

function publicPage(p: Page): Page {
  return {
    ...p,
    sections: p.sections.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

function liveBanners(): Banner[] {
  const t = Date.now()
  return getDb()
    .banners.filter((b) => b.status === 'PUBLISHED')
    .filter((b) => !b.startDate || new Date(b.startDate).getTime() <= t)
    .filter((b) => !b.endDate || new Date(b.endDate).getTime() >= t)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

router
  .get('/public/home', () => {
    const home = livePages().find((p) => p.slug === 'home')
    return ok({
      page: home ? publicPage(home) : null,
      banners: liveBanners(),
      latestArticles: liveArticles().slice(0, 6).map(toArticle),
    })
  })
  .get('/public/pages/:slug', (req) => {
    const page = livePages().find((p) => p.slug === req.params.slug) ?? notFound('Halaman')
    return ok(publicPage(page))
  })
  .get('/public/articles', (req) => {
    const { search, category, tag } = req.query
    const db = getDb()
    const cat = category ? db.categories.find((c) => c.slug === category) : null
    const tg = tag ? db.tags.find((t) => t.slug === tag) : null
    const list = liveArticles()
      .filter((a) => matchesSearch(search, a.title, a.excerpt, a.content))
      .filter((a) => !category || a.categoryId === cat?.id)
      .filter((a) => !tag || (tg && a.tagIds.includes(tg.id)))
      .map(toArticle)
    return { status: 200, data: paginate(list, { perPage: '9', ...req.query }) }
  })
  .get('/public/articles/:slug', (req) => {
    const a = liveArticles().find((x) => x.slug === req.params.slug) ?? notFound('Artikel')
    return ok(toArticle(a))
  })
  .get('/public/categories', () => {
    const live = liveArticles()
    return ok(
      getDb().categories.map((c) => ({
        ...c,
        articlesCount: live.filter((a) => a.categoryId === c.id).length,
      })),
    )
  })
  .get('/public/menus', () => ok(getDb().menus.map((m) => menuWithTree(m, true))))
  .get('/public/settings', () => ok(getDb().settings))
  .get('/public/search', (req) => {
    const q = (req.query.q ?? '').trim()
    if (q.length < 2) return ok([])
    const results: SearchResult[] = [
      ...livePages()
        .filter((p) =>
          matchesSearch(
            q,
            p.title,
            p.seo?.description,
            JSON.stringify(p.sections.map((s) => s.content)),
          ),
        )
        .map((p) => ({
          type: 'page' as const,
          title: p.title,
          slug: p.slug,
          excerpt: p.seo?.description ?? null,
          url: p.slug === 'home' ? '/' : `/${p.slug}`,
          publishedAt: p.publishedAt,
        })),
      ...liveArticles()
        .filter((a) => matchesSearch(q, a.title, a.excerpt, a.content))
        .map((a) => ({
          type: 'article' as const,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          url: `/news/${a.slug}`,
          publishedAt: a.publishedAt,
        })),
    ]
    return ok(results.slice(0, 20))
  })

export function afterMutation(method: string) {
  if (method !== 'GET') persist()
}
