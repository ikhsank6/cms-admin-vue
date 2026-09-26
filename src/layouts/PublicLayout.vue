<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import {
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  Menu,
  Search,
  X,
  Youtube,
} from 'lucide-vue-next'
import SmartLink from '@/components/common/SmartLink.vue'
import { useSiteStore } from '@/stores/site'
import { safeImageUrl, safeUrl } from '@/utils/url'
import { cn } from '@/lib/utils'

const site = useSiteStore()
const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)
const query = ref('')
const scrollProgress = ref(0)

function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = max > 0 ? Math.min(window.scrollY / max, 1) : 0
}
onMounted(() => window.addEventListener('scroll', updateScrollProgress, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', updateScrollProgress))
watch(() => route.fullPath, updateScrollProgress)

onMounted(() => site.load())
watch(
  () => route.fullPath,
  () => (mobileOpen.value = false),
)

const socials = computed(() => {
  const s = site.settings?.social ?? {}
  return [
    { key: 'facebook', icon: Facebook, url: s.facebook },
    { key: 'instagram', icon: Instagram, url: s.instagram },
    { key: 'youtube', icon: Youtube, url: s.youtube },
    { key: 'linkedin', icon: Linkedin, url: s.linkedin },
    { key: 'x', label: '𝕏', url: s.x },
    { key: 'tiktok', label: 'TikTok', url: s.tiktok },
  ].filter((i) => i.url)
})

// Favicon + optional Google Analytics / Tag Manager from Website Settings.
useHead({
  htmlAttrs: { lang: 'id' },
  link: () =>
    site.settings?.favicon ? [{ rel: 'icon', href: safeImageUrl(site.settings.favicon) }] : [],
  script: () => {
    const scripts = []
    const ga = site.settings?.googleAnalyticsId
    const gtm = site.settings?.googleTagManagerId
    if (ga && /^G-[A-Z0-9]+$/i.test(ga)) {
      scripts.push({ src: `https://www.googletagmanager.com/gtag/js?id=${ga}`, async: true })
      scripts.push({
        innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`,
      })
    }
    if (gtm && /^GTM-[A-Z0-9]+$/i.test(gtm)) {
      scripts.push({
        innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`,
      })
    }
    return scripts
  },
})

function isActive(url: string) {
  return url === '/' ? route.path === '/' : route.path.startsWith(url)
}

function submitSearch() {
  if (query.value.trim()) router.push({ name: 'search', query: { q: query.value.trim() } })
}
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-2"
      >Lewati ke konten</a
    >
    <header class="bg-background/90 sticky top-0 z-40 border-b backdrop-blur relative">
      <div class="bg-border absolute inset-x-0 top-full h-px overflow-hidden" aria-hidden="true">
        <div
          class="bg-brand h-full transition-[width] duration-150 ease-out"
          :style="{ width: `${scrollProgress * 100}%` }"
        />
      </div>
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2 font-bold">
          <img
            v-if="site.settings?.logo"
            :src="safeImageUrl(site.settings.logo)"
            :alt="site.siteName"
            class="h-8 w-auto"
          />
          <span>{{ site.siteName }}</span>
        </RouterLink>

        <nav class="hidden flex-1 lg:block" aria-label="Utama">
          <ul class="flex items-center gap-1">
            <li v-for="item in site.headerMenu" :key="item.id" class="group relative">
              <SmartLink
                :to="item.url"
                :target="item.target"
                :class="
                  cn(
                    'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent',
                    isActive(item.url) && 'text-brand',
                  )
                "
              >
                {{ item.title }}
                <ChevronDown v-if="item.children?.length" class="size-3.5" />
              </SmartLink>
              <ul
                v-if="item.children?.length"
                class="bg-popover invisible absolute top-full left-0 min-w-48 rounded-md border p-1 opacity-0 shadow-md transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
              >
                <li v-for="child in item.children" :key="child.id">
                  <SmartLink
                    :to="child.url"
                    :target="child.target"
                    class="block rounded px-3 py-2 text-sm hover:bg-accent"
                    >{{ child.title }}</SmartLink
                  >
                </li>
              </ul>
            </li>
          </ul>
        </nav>

        <form
          class="ml-auto hidden items-center md:flex lg:ml-0"
          role="search"
          @submit.prevent="submitSearch"
        >
          <label class="relative">
            <span class="sr-only">Cari</span>
            <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              v-model="query"
              type="search"
              placeholder="Cari…"
              class="bg-muted/60 h-9 w-44 rounded-full pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
          </label>
        </form>

        <button
          type="button"
          class="ml-auto rounded-md p-2 lg:hidden md:ml-0"
          aria-label="Menu"
          @click="mobileOpen = !mobileOpen"
        >
          <X v-if="mobileOpen" class="size-5" /><Menu v-else class="size-5" />
        </button>
      </div>

      <nav v-if="mobileOpen" class="border-t lg:hidden" aria-label="Mobile">
        <form class="p-4 md:hidden" role="search" @submit.prevent="submitSearch">
          <input
            v-model="query"
            type="search"
            placeholder="Cari…"
            class="bg-muted/60 h-10 w-full rounded-md px-3 text-sm outline-none"
          />
        </form>
        <ul class="space-y-1 px-4 pb-4">
          <li v-for="item in site.headerMenu" :key="item.id">
            <SmartLink
              :to="item.url"
              :target="item.target"
              class="block rounded-md px-3 py-2 font-medium hover:bg-accent"
              >{{ item.title }}</SmartLink
            >
            <ul v-if="item.children?.length" class="ml-4 border-l pl-2">
              <li v-for="child in item.children" :key="child.id">
                <SmartLink
                  :to="child.url"
                  :target="child.target"
                  class="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >{{ child.title }}</SmartLink
                >
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>

    <main id="main" class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t bg-slate-950 text-slate-300">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p class="text-lg font-bold text-white">{{ site.siteName }}</p>
          <p v-if="site.settings?.tagline" class="mt-2 text-sm">{{ site.settings.tagline }}</p>
          <div class="mt-4 flex gap-3">
            <a
              v-for="s in socials"
              :key="s.key"
              :href="safeUrl(s.url)"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="s.key"
              class="flex size-9 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
            >
              <component :is="s.icon" v-if="s.icon" class="size-4" />
              <span v-else class="text-xs">{{ s.label }}</span>
            </a>
          </div>
        </div>
        <div>
          <p class="mb-3 font-semibold text-white">Tautan</p>
          <ul class="space-y-2 text-sm">
            <li v-for="item in site.footerMenu" :key="item.id">
              <SmartLink :to="item.url" :target="item.target" class="hover:text-white">{{
                item.title
              }}</SmartLink>
            </li>
          </ul>
        </div>
        <div class="space-y-2 text-sm">
          <p class="mb-3 font-semibold text-white">Kontak</p>
          <p v-if="site.settings?.address">{{ site.settings.address }}</p>
          <p v-if="site.settings?.phone">{{ site.settings.phone }}</p>
          <p v-if="site.settings?.email">
            <a :href="`mailto:${site.settings.email}`" class="hover:text-white">{{
              site.settings.email
            }}</a>
          </p>
        </div>
      </div>
      <div class="border-t border-white/10 py-5 text-center text-xs">
        {{ site.settings?.footerText ?? `© ${new Date().getFullYear()} ${site.siteName}` }}
      </div>
    </footer>
  </div>
</template>
