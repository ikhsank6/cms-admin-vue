import { expect, test } from '@playwright/test'
import { PASSWORD, USERS, login } from './helpers'

test('rejects invalid credentials', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(USERS.superAdmin)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByTestId('login-error')).toContainText('Email atau password salah')
})

test('protected routes redirect to login and back after authentication', async ({ page }) => {
  await page.goto('/admin/articles')
  await expect(page).toHaveURL(/\/admin\/login\?redirect=/)
  await page.getByLabel('Email').fill(USERS.superAdmin)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/admin\/articles$/)
})

test('session survives a reload (refresh token) and logout ends it', async ({ page }) => {
  await login(page)
  await page.reload()
  await expect(page.getByTestId('user-menu')).toBeVisible()
  await page.getByTestId('user-menu').click()
  await page.getByTestId('logout').click()
  await page.getByTestId('confirm-ok').click()
  await expect(page).toHaveURL(/\/admin\/login/)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login/)
})

test('viewer role is read-only', async ({ page }) => {
  await login(page, USERS.viewer)
  await page.goto('/admin/pages')
  await expect(page.getByTestId('page-row').first()).toBeVisible()
  await expect(page.getByTestId('create-page')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0)

  await page.goto('/admin/users')
  await expect(page.getByRole('heading', { name: 'Akses ditolak' })).toBeVisible()
})
