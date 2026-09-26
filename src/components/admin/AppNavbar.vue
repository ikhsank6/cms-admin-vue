<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ExternalLink, LayoutTemplate, Menu } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import SearchCommand from './SearchCommand.vue'
import NotificationMenu from './NotificationMenu.vue'
import UserMenu from './UserMenu.vue'

const ui = useUiStore()

const dateLabel = ref('')
let timer: ReturnType<typeof setInterval> | undefined

function formatDate() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

onMounted(() => {
  dateLabel.value = formatDate()
  timer = setInterval(() => (dateLabel.value = formatDate()), 60_000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <header
    class="bg-navbar text-navbar-foreground sticky top-0 z-30 flex h-14 items-center gap-3 px-4 shadow-[0_1px_8px_0_rgba(0,0,0,0.35)]"
  >
    <button
      type="button"
      aria-label="Buka menu"
      class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white md:hidden"
      @click="ui.mobileSidebarOpen = true"
    >
      <Menu class="size-5" />
    </button>

    <RouterLink to="/admin" class="group flex shrink-0 items-center gap-2.5 text-white">
      <span
        class="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1 transition-transform group-hover:scale-105"
      >
        <LayoutTemplate class="size-5" />
      </span>
      <span class="hidden flex-col leading-none sm:flex">
        <span class="text-[15px] font-extrabold tracking-tight">CMS Portal</span>
        <span class="mt-1 text-[8px] font-medium tracking-[0.2px] text-white/50 uppercase">
          Admin CMS
        </span>
      </span>
    </RouterLink>

    <div class="ml-1 shrink-0 sm:ml-4">
      <SearchCommand />
    </div>

    <div class="flex flex-1 justify-end pr-3">
      <span v-if="dateLabel" class="hidden text-sm text-white/60 sm:block">{{ dateLabel }}</span>
    </div>

    <div class="flex shrink-0 items-center gap-1">
      <a
        href="/"
        target="_blank"
        rel="noopener"
        class="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
      >
        <ExternalLink class="size-4" /> Lihat Website
      </a>
      <NotificationMenu />
      <UserMenu />
    </div>
  </header>
</template>
