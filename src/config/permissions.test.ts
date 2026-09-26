import { describe, expect, it } from 'vitest'
import { ALL_PERMISSIONS, hasAnyPermission, hasPermission } from './permissions'

describe('permissions', () => {
  it('builds the catalogue as module.action', () => {
    expect(ALL_PERMISSIONS).toContain('page.publish')
    expect(ALL_PERMISSIONS).toContain('media.upload')
    expect(ALL_PERMISSIONS).toContain('audit_log.view')
  })
  it('checks single and multiple permissions', () => {
    const granted = ['page.view', 'page.update']
    expect(hasPermission(granted, 'page.view')).toBe(true)
    expect(hasPermission(granted, 'page.delete')).toBe(false)
    expect(hasPermission(granted, ['page.view', 'page.update'])).toBe(true)
    expect(hasPermission(granted, ['page.view', 'page.delete'])).toBe(false)
    expect(hasAnyPermission(granted, ['page.delete', 'page.update'])).toBe(true)
  })
  it('grants everything to the wildcard', () => {
    expect(hasPermission(['*'], 'user.delete')).toBe(true)
    expect(hasAnyPermission(['*'], ['x.y'])).toBe(true)
  })
})
