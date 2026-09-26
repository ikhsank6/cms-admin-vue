import { beforeEach, describe, expect, it } from 'vitest'
import { createApi } from '@/services/api'
import { tokenStorage } from '@/services/token-storage'
import { mockAdapter } from './adapter'
import { resetDb } from './db'
import type { Page } from '@/types'

// Integration tests of the admin/public API contract against the mock backend.
const api = createApi(mockAdapter)

async function loginAs(email: string) {
  const { data } = await api.post('/auth/login', { email, password: 'Password123!' })
  tokenStorage.setAccessToken(data.data.accessToken)
  tokenStorage.setRefreshToken(data.data.refreshToken)
  return data.data
}

describe('mock API contract', () => {
  beforeEach(() => {
    resetDb()
    tokenStorage.clear()
  })

  it('logs in and returns the user with permissions', async () => {
    const res = await loginAs('editor@cms.local')
    expect(res.user.email).toBe('editor@cms.local')
    expect(res.user.permissions).toContain('page.publish')
    expect(res.user.permissions).not.toContain('user.view')
  })

  it('rejects bad credentials with 401', async () => {
    await expect(
      api.post('/auth/login', { email: 'editor@cms.local', password: 'x' }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })
  })

  it('requires authentication for admin endpoints', async () => {
    await expect(api.get('/admin/pages')).rejects.toMatchObject({ status: 401 })
  })

  it('enforces RBAC with 403', async () => {
    await loginAs('viewer@cms.local')
    await expect(api.get('/admin/pages')).resolves.toBeTruthy()
    await expect(api.post('/admin/pages', { title: 'X', slug: 'x' })).rejects.toMatchObject({
      status: 403,
    })
    await expect(api.get('/admin/users')).rejects.toMatchObject({ status: 403 })
  })

  it('validates unique slugs with 422 field errors', async () => {
    await loginAs('superadmin@cms.local')
    await expect(api.post('/admin/pages', { title: 'Home 2', slug: 'home' })).rejects.toMatchObject(
      {
        status: 422,
        details: { slug: ['Slug sudah digunakan'] },
      },
    )
  })

  it('only exposes published content on the public API', async () => {
    await loginAs('superadmin@cms.local')
    const created = (
      await api.post('/admin/pages', {
        title: 'Rahasia',
        slug: 'rahasia',
        sections: [{ type: 'TEXT', content: { body: 'hi' } }],
      })
    ).data.data as Page
    expect(created.status).toBe('DRAFT')
    await expect(api.get('/public/pages/rahasia')).rejects.toMatchObject({ status: 404 })

    await api.patch(`/admin/pages/${created.id}/publish`)
    const pub = (await api.get('/public/pages/rahasia')).data.data as Page
    expect(pub.sections).toHaveLength(1)
    expect(pub.sections[0]!.type).toBe('TEXT')

    await api.patch(`/admin/pages/${created.id}/unpublish`)
    await expect(api.get('/public/pages/rahasia')).rejects.toMatchObject({ status: 404 })
  })

  it('hides inactive sections and future-scheduled articles from the public API', async () => {
    await loginAs('superadmin@cms.local')
    const future = new Date(Date.now() + 86_400_000).toISOString()
    await api.post('/admin/articles', {
      title: 'Nanti',
      slug: 'nanti',
      content: 'x',
      status: 'PUBLISHED',
      publishedAt: future,
      tagIds: [],
    })
    const list = (await api.get('/public/articles', { params: { perPage: 50 } })).data.data as {
      slug: string
    }[]
    expect(list.map((a) => a.slug)).not.toContain('nanti')
    expect(list.map((a) => a.slug)).not.toContain('draft-rencana-program-tahun-depan')

    const home = (await api.get('/admin/pages/1')).data.data as Page
    home.sections[0]!.isActive = false
    await api.put('/admin/pages/1', home)
    const pub = (await api.get('/public/pages/home')).data.data as Page
    expect(pub.sections.find((s) => s.type === 'HERO')).toBeUndefined()
  })

  it('records audit logs for mutations', async () => {
    await loginAs('superadmin@cms.local')
    await api.patch('/admin/articles/1/unpublish')
    const logs = (await api.get('/admin/audit-logs')).data.data as {
      action: string
      resourceType: string
    }[]
    expect(logs[0]).toMatchObject({ action: 'UNPUBLISH', resourceType: 'Article' })
    expect(logs.some((l) => l.action === 'LOGIN')).toBe(true)
  })

  it('rotates refresh tokens', async () => {
    const { refreshToken } = await loginAs('editor@cms.local')
    const r1 = await api.post('/auth/refresh', { refreshToken })
    expect(r1.data.data.refreshToken).not.toBe(refreshToken)
    await expect(api.post('/auth/refresh', { refreshToken })).rejects.toMatchObject({ status: 401 })
  })

  it('returns a nested public menu tree without inactive items', async () => {
    const menus = (await api.get('/public/menus')).data.data as {
      location: string
      items: { title: string; children: unknown[] }[]
    }[]
    const header = menus.find((m) => m.location === 'header')!
    const about = header.items.find((i) => i.title === 'About')!
    expect(about.children).toHaveLength(2)
  })
})
