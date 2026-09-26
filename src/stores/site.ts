import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Menu, SiteSettings } from '@/types'
import { publicService } from '@/services/public'

/** Public-site shell data: settings, navigation menus. Loaded once per visit. */
export const useSiteStore = defineStore('site', () => {
  const settings = ref<SiteSettings | null>(null)
  const menus = ref<Menu[]>([])
  const loaded = ref(false)
  let pending: Promise<void> | null = null

  const headerMenu = computed(() => menus.value.find((m) => m.location === 'header')?.items ?? [])
  const footerMenu = computed(() => menus.value.find((m) => m.location === 'footer')?.items ?? [])
  const siteName = computed(() => settings.value?.siteName ?? 'CMS Portal')

  function load(force = false): Promise<void> {
    if (loaded.value && !force) return Promise.resolve()
    pending ??= Promise.all([publicService.settings(), publicService.menus()])
      .then(([s, m]) => {
        settings.value = s
        menus.value = m
        loaded.value = true
      })
      .catch(() => {
        loaded.value = true
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  return { settings, menus, loaded, headerMenu, footerMenu, siteName, load }
})
