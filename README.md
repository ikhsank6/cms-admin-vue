# CMS Portal — Admin CMS & Public Landing Page (Frontend)

Frontend for **CMS Portal** (PRD v1.0.0): a single Vue 3 application that serves both

- **Admin CMS** (`/admin/*`): content management for administrators and editors
- **Public Landing Page** (`/`, `/news`, `/:slug`, …): the public website, which shows only `PUBLISHED` content

It talks to the ElysiaJS REST API (`/api/v1`). A built-in **mock API** runs the whole app in the browser without a backend, for local development, demos and E2E tests.

## Tech stack

| Area | Library |
| --- | --- |
| Framework | Vue 3 (`<script setup>`), TypeScript, Vite |
| State / routing | Pinia, Vue Router |
| UI | Tailwind CSS v4, shadcn-vue style components (reka-ui), Lucide icons, vue-sonner |
| Data | Axios (JWT + refresh-token interceptor), Zod validation, VueUse |
| Content | Markdown (marked) sanitized with DOMPurify |
| SEO | @unhead/vue (title, meta, canonical, Open Graph, JSON-LD) |
| Tests | Vitest + Vue Test Utils (unit/integration), Playwright (E2E) |
| Delivery | Docker (nginx), GitHub Actions CI |

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173, uses the mock API (.env.development)
```

Demo accounts (mock API only), password `Password123!`:

| Email | Role | Access |
| --- | --- | --- |
| `superadmin@cms.local` | Super Admin | Everything (`*`) |
| `editor@cms.local` | Editor | Content, media and publishing. No users, roles or settings changes |
| `viewer@cms.local` | Viewer | Read-only content |

The mock database is stored in `localStorage` (`cms.mockdb.v1`). Clear that key to reset the seed data.

### Against the real backend

```bash
cp .env.example .env.local
# VITE_API_MOCK=false
# VITE_API_PROXY_TARGET=http://localhost:3000   # the dev server proxies /api to the backend
npm run dev
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`vue-tsc`) and production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` / `lint:fix` | ESLint (Vue + TypeScript) |
| `npm run typecheck` | `vue-tsc` only |
| `npm test` | Unit and integration tests (Vitest) |
| `npm run test:e2e` | Playwright E2E tests (starts the dev server with the mock API) |

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | Base URL of the REST API |
| `VITE_API_PROXY_TARGET` | — | Dev server only: proxy `/api` to this origin |
| `VITE_API_MOCK` | `false` (`true` in `.env.development`) | Use the in-browser mock API. The mock code and seed data are excluded from builds where this is not `true` |
| `VITE_SITE_URL` | `window.location.origin` | Public origin for canonical and OG URLs |
| `VITE_UPLOAD_MAX_MB` | `10` | Client-side upload size limit (the server must enforce its own) |

## Features (PRD mapping)

| PRD | Where |
| --- | --- |
| §6 Auth: login, logout, refresh token, forgot/reset/change password, profile | `pages/admin/auth/*`, `pages/admin/Profile.vue`, `services/api.ts`, `stores/auth.ts` |
| §6.2 RBAC | `config/permissions.ts`, route `meta.permission`, `auth.can()`, `v-can`, role editor with a permission matrix |
| §7 Dashboard | `pages/admin/Dashboard.vue` |
| §8–9 Pages and Section/Block builder (12 section types) | `pages/admin/PageEditor.vue`, `components/sections/*` |
| §10–11 Articles, categories and tags | `pages/admin/Article*.vue`, `pages/admin/Categories.vue` |
| §12–15 Media library, upload validation, presigned (S3) and local upload flows | `pages/admin/Media.vue`, `components/media/*`, `services/media.ts`, `utils/file-validation.ts` |
| §16 Banners / hero, with a schedule window | `pages/admin/Banners.vue` |
| §17 Nested menus (page, article or URL; `_self`/`_blank`) | `pages/admin/Menus.vue`, `components/admin/MenuTree.vue` |
| §18 SEO metadata and head tags | `components/common/SeoFields.vue`, `composables/useSeo.ts` |
| §19 Website settings, social links, GA/GTM | `pages/admin/Settings.vue`, `layouts/PublicLayout.vue` |
| §20 Audit log with a field-level diff | `pages/admin/AuditLogs.vue` |
| §21 Public site: home, dynamic pages, news, detail, category, search, navigation, footer | `pages/public/*`, `layouts/PublicLayout.vue` |
| §29 Image performance | lazy loading, `fetchpriority` on the hero, route-level code splitting |
| §31 Security | sanitized rich content, `safeUrl` for every link, upload checks (extension, MIME, size, magic bytes, SVG script check), CSP and security headers in nginx |
| §33 Testing | `src/**/*.test.ts`, `e2e/*.spec.ts` |

## Project structure

```
src/
├── assets/            Tailwind theme (shadcn tokens, light/dark)
├── components/
│   ├── ui/            shadcn-vue style primitives (button, card, dialog, table, tabs…)
│   ├── common/        PageHeader, FormField, ImageField, MarkdownEditor, SeoFields, …
│   ├── admin/         TaxonomyManager, MenuTree
│   ├── media/         MediaUploader, MediaPicker, MediaThumb
│   ├── sections/      registry.ts (schemas), SectionBuilder (admin), SectionRenderer + render/* (public)
│   └── public/        ArticleCard, SectionShell
├── composables/       useResourceList, useFormSubmit, useContentEditor, useSeo, useConfirm, useAsyncData
├── config/            env, permissions, admin navigation
├── directives/        v-can
├── layouts/           AdminLayout, AuthLayout, PublicLayout
├── mocks/             In-browser mock API (db seed, router, handlers, axios adapter)
├── pages/admin/       Dashboard, Pages, PageEditor, Articles, ArticleEditor, Categories, Banners,
│                      Media, Menus, Users, Roles, Settings, AuditLogs, Profile, auth/*
├── pages/public/      Home, Page, Articles, ArticleDetail, Search, Contact
├── router/            Routes and auth/permission guards
├── services/          api (axios + refresh), auth, admin resources, media upload, public
├── stores/            auth, site (public settings and menus), ui
├── types/             Domain types shared with the API contract
└── utils/             format, slug, markdown, url, file-validation, diff, validation
```

### Adding a section type

1. Add the type to `SectionType` in `src/types/index.ts`.
2. Add a definition (fields and defaults) in `src/components/sections/registry.ts`. The admin form is generated from it.
3. Add a renderer in `src/components/sections/render/` and register it in `SectionRenderer.vue`.

## API contract

See [`docs/API.md`](docs/API.md) for the endpoints, payloads and conventions this frontend expects from the ElysiaJS backend. The mock API in `src/mocks/` implements the same contract, and `src/mocks/mock-api.test.ts` covers it.

## Testing

```bash
npm test             # 46 unit/integration tests: utils, RBAC, upload validation, API client refresh,
                     # section registry, SectionBuilder, auth store, mock API contract
npm run test:e2e     # 8 Playwright tests: login → create page → add sections → publish → verify on the
                     # public site, draft visibility, media upload + spoofed-file rejection,
                     # auth redirect, session restore/logout, viewer read-only
```

## Docker

```bash
docker compose up --build                        # nginx on :8080, proxies /api to API_UPSTREAM
VITE_API_MOCK=true docker compose up --build     # standalone demo build
```

The image is a multi-stage build (Node → nginx). nginx provides:

- the SPA fallback
- immutable caching for `/assets`
- security headers and CSP
- a `/healthz` endpoint
- proxying of `/api/`, `/storage/` (local disk uploads) and `/sitemap.xml` to `API_UPSTREAM`

## Notes for the backend

- `sitemap.xml` is generated by the backend (`GET /api/v1/public/sitemap.xml`) and proxied by nginx.
- Media URLs are produced by the backend `StorageService` from `disk` + `storage_key`. The frontend never builds storage URLs itself.
- All upload checks in the frontend are for UX only. The backend must validate extension, MIME, size and content, and sanitize SVG files.
