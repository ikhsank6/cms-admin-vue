# REST API contract (frontend expectations)

Base URL: `/api/v1`. All bodies are JSON unless noted. Types refer to `src/types/index.ts`.

## Conventions

**Single resource**

```json
{ "data": { ... } }
```

**Paginated list.** Query parameters are `page`, `perPage`, `search` and `sort` (for example `-updatedAt`), plus module-specific filters.

```json
{ "data": [ ... ], "meta": { "page": 1, "perPage": 10, "total": 42, "totalPages": 5 } }
```

**Error**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Data tidak valid", "details": { "slug": ["Slug sudah digunakan"] } } }
```

The admin forms map `details` onto the matching fields.

| Status | Meaning in the UI |
| --- | --- |
| 401 | The client tries `POST /auth/refresh` once, then redirects to login |
| 403 | Missing permission (a toast, or the Forbidden page for route guards) |
| 404 | Not found (the public site renders its 404 page) |
| 409 | Conflict, for example a role that is still in use |
| 422 | Validation error with `details` |

**Auth header:** `Authorization: Bearer <accessToken>`.

**Status values:** `DRAFT | PUBLISHED | ARCHIVED`. Public endpoints return only `PUBLISHED` content whose `publishedAt` is empty or in the past.

## Auth

| Method | Path | Body → Response |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` → `LoginResponse { accessToken, refreshToken, expiresIn, user: AuthUser }` |
| POST | `/auth/refresh` | `{ refreshToken }` → `AuthTokens` (the refresh token is rotated) |
| POST | `/auth/logout` | `{ refreshToken }` → 204 |
| GET | `/auth/me` | → `AuthUser` (includes the flattened `permissions: string[]`) |
| PUT | `/auth/profile` | `{ name, email, avatar? }` → `AuthUser` |
| PUT | `/auth/change-password` | `{ currentPassword, newPassword }` → 204 |
| POST | `/auth/forgot-password` | `{ email }` → 204 (always 204, to avoid user enumeration) |
| POST | `/auth/reset-password` | `{ token, password }` → 204 |

The reset link in the email should point to `/admin/reset-password?token=…`.

Permissions use the form `module.action` (see `src/config/permissions.ts`). `*` grants everything (Super Admin).

## Admin (`/admin`, requires auth and permissions)

| Resource | Endpoints | Permission prefix |
| --- | --- | --- |
| Dashboard | `GET /admin/dashboard` → `DashboardStats` | (authenticated) |
| Pages | `GET/POST /admin/pages`, `GET/PUT/DELETE /admin/pages/:id`, `PATCH /admin/pages/:id/publish`, `PATCH /admin/pages/:id/unpublish` | `page.*` |
| Articles | Same shape under `/admin/articles`. Filters: `status`, `categoryId` | `article.*` |
| Categories | `GET/POST /admin/categories`, `GET/PUT/DELETE /admin/categories/:id` | `category.*` |
| Tags | `GET/POST /admin/tags`, `GET/PUT/DELETE /admin/tags/:id` | `tag.*` |
| Banners | CRUD and publish/unpublish under `/admin/banners` | `banner.*` |
| Media | `GET /admin/media` (filters: `type=image\|pdf\|document`, `from`, `to`), `POST /admin/media/upload-url`, `POST /admin/media` (multipart), `POST /admin/media/complete`, `PUT /admin/media/:id` (`{ alt }`), `DELETE /admin/media/:id` | `media.*` |
| Menus | CRUD under `/admin/menus`, plus `PUT /admin/menus/:id/items` with body `{ items: MenuItem[] }` (replaces the whole tree) | `menu.*` |
| Users | CRUD under `/admin/users`. Body: `{ name, email, password?, isActive, roleIds }`. Filter: `role` | `user.*` |
| Roles | CRUD under `/admin/roles`. Body: `{ name, slug, description, permissions: string[] }`. Plus `GET /admin/permissions` | `role.*` |
| Settings | `GET /admin/settings`, `PUT /admin/settings` → `SiteSettings` | `setting.*` |
| Audit logs | `GET /admin/audit-logs` (filters: `action`, `module`, `userId`, `from`, `to`), `GET /admin/audit-logs/:id` | `audit_log.view` |

### Page payload

`PageInput` has `title`, `slug`, `content?`, `featuredImage?`, `status`, `publishedAt?`, `sections[]` and `seo?`.

Sections are saved atomically with the page. Each section is `{ id?, type, sortOrder, isActive, content }`. `content` is JSON whose shape is defined per `type` in `src/components/sections/registry.ts`. Section types are:

`HERO, TEXT, IMAGE, IMAGE_TEXT, STATISTIC, CARD, SERVICES, NEWS, GALLERY, CTA, FAQ, CONTACT`

Changing `status` requires `page.publish`. The same rule applies to articles (`article.publish`) and banners (`banner.publish`).

### Article payload

`ArticleInput` has `title`, `slug`, `excerpt?`, `content` (Markdown), `featuredImage?`, `categoryId?`, `tagIds[]`, `status`, `publishedAt?` and `seo?`. Responses embed `category`, `tags` and `author`.

### Media upload (PRD §15)

1. `POST /admin/media/upload-url` with `{ originalName, mimeType, size, folder }`. The response is an `UploadTicket`:
   - S3-compatible storage: `{ driver: "s3", uploadUrl, method: "PUT", headers?, storageKey, expiresIn }`. The browser `PUT`s the file to `uploadUrl` without the `Authorization` header, then calls `POST /admin/media/complete` with `{ storageKey, originalName, mimeType, size, folder }`, which returns `Media`.
   - Local storage: `{ driver: "local" }`. The browser sends `POST /admin/media` as `multipart/form-data` with `file` and `folder`, which returns `Media`.
2. `Media.url` is always produced by the backend `StorageService` from `disk` and `storageKey`.

The backend must validate the extension, MIME type, size and file content (magic bytes), and sanitize SVG files.

## Public (`/public`, no auth, published content only, cacheable in Redis)

| Method | Path | Response |
| --- | --- | --- |
| GET | `/public/home` | `PublicHome { page: Page \| null, banners: Banner[], latestArticles: Article[] }`. `page` is the page with slug `home`. `banners` contains active banners (published and inside their start/end window) |
| GET | `/public/pages/:slug` | `Page`, with only active sections, sorted by `sortOrder` |
| GET | `/public/articles` | Paginated `Article`. Filters: `category` (slug), `tag` (slug), `search`, `page`, `perPage` |
| GET | `/public/articles/:slug` | `Article` |
| GET | `/public/categories` | `Category[]`, including the published `articlesCount` |
| GET | `/public/menus` | `Menu[]`. `items` is a nested tree (`children`) of active items |
| GET | `/public/settings` | `SiteSettings` |
| GET | `/public/search?q=` | `SearchResult[]` (pages and articles, minimum 2 characters) |
| GET | `/public/sitemap.xml` | XML sitemap. nginx serves it at `/sitemap.xml` |

Suggested cache keys (PRD §28): `page:{slug}`, `article:{slug}`, `articles:latest`, `menu:{location}` and `settings:public`. Invalidate them whenever the underlying content changes.
