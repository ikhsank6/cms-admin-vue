import { expect, type Page } from '@playwright/test'

export const USERS = {
  superAdmin: 'superadmin@cms.local',
  editor: 'editor@cms.local',
  viewer: 'viewer@cms.local',
} as const
export const PASSWORD = 'Password123!'

export async function login(page: Page, email: string = USERS.superAdmin) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

export const unique = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
