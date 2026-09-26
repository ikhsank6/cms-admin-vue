import { expect, test } from '@playwright/test'
import { login, unique } from './helpers'

// PRD §33: Login → Create Page → Add Section → Publish → Open Public Page → Verify Content
test('create a page with sections, publish it and see it on the public site', async ({ page }) => {
  const slug = unique('e2e-page')
  const heading = `Judul Hero ${slug}`
  const body = `Konten teks ${slug}`

  await login(page)
  await page.goto('/admin/pages')
  await page.getByTestId('create-page').click()
  await expect(page).toHaveURL(/\/admin\/pages\/new$/)

  await page.getByRole('tab', { name: 'Umum' }).click()
  await page.getByTestId('page-title-input').fill(`Halaman ${slug}`)
  await page.getByTestId('page-slug-input').fill(slug)

  await page.getByTestId('tab-sections').click()
  await page.getByTestId('add-section').click()
  await page.getByTestId('section-type-HERO').click()
  await page.getByTestId('field-title').first().fill(heading)

  await page.getByTestId('add-section').click()
  await page.getByTestId('section-type-TEXT').click()
  await page.locator('textarea[id$="-body"]').fill(`## Subjudul\n\n${body}`)

  await expect(page.getByTestId('section-item')).toHaveCount(2)
  await page.getByTestId('publish-page').click()
  await expect(page.getByText('Page dipublikasikan')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/pages\/\d+$/)

  await page.goto(`/${slug}`)
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  await expect(page.getByText(body)).toBeVisible()
  await expect(page.locator('[data-section="HERO"]')).toBeVisible()
  await expect(page).toHaveTitle(new RegExp(`Halaman ${slug}`))
})

test('draft pages are not visible on the public site', async ({ page }) => {
  const slug = unique('e2e-draft')
  await login(page)
  await page.goto('/admin/pages/new')
  await page.getByRole('tab', { name: 'Umum' }).click()
  await page.getByTestId('page-title-input').fill(`Draft ${slug}`)
  await page.getByTestId('page-slug-input').fill(slug)
  await page.getByTestId('save-page').click()
  await expect(page.getByText('Page disimpan')).toBeVisible()

  await page.goto(`/${slug}`)
  await expect(page.getByTestId('not-found')).toBeVisible()
})

test('unpublished seed article is hidden while published articles are listed', async ({ page }) => {
  await page.goto('/news')
  await expect(page.getByTestId('article-card').first()).toBeVisible()
  await expect(page.getByText('Draft: Rencana Program Tahun Depan')).toHaveCount(0)
  await page.getByTestId('article-card').first().getByRole('heading').getByRole('link').click()
  await expect(page.getByTestId('article-title')).toBeVisible()
})
