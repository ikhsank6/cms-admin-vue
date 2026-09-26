import { expect, test } from '@playwright/test'
import { login } from './helpers'

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

test('uploads an image to the media library and rejects spoofed files', async ({ page }) => {
  await login(page)
  await page.goto('/admin/media')
  await expect(page.getByTestId('media-item').first()).toBeVisible()
  const before = await page.getByTestId('media-item').count()

  await page
    .getByTestId('media-upload-input')
    .setInputFiles({ name: 'e2e-pixel.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText('e2e-pixel.png berhasil diunggah')).toBeVisible()
  await expect(page.getByTestId('media-item')).toHaveCount(before + 1)
  await expect(page.getByTestId('media-item').first()).toContainText('e2e-pixel.png')

  await page.getByTestId('media-upload-input').setInputFiles({
    name: 'shell.png',
    mimeType: 'image/png',
    buffer: Buffer.from('<?php system($_GET["c"]); ?>'),
  })
  await expect(page.getByText('shell.png: Isi file tidak sesuai dengan tipenya')).toBeVisible()
  await expect(page.getByTestId('media-item')).toHaveCount(before + 1)
})
