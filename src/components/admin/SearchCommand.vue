<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { navSections } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const input = ref<HTMLInputElement | null>(null)
const auth = useAuthStore()
const router = useRouter()

const groups = computed(() => {
  const q = query.value.trim().toLowerCase()
  return navSections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => !item.permission || auth.can(item.permission))
        .filter((item) => !q || item.label.toLowerCase().includes(q)),
    }))
    .filter((section) => section.items.length)
})
const flatResults = computed(() => groups.value.flatMap((g) => g.items))

watch(query, () => (activeIndex.value = 0))
watch(open, (v) => {
  if (v) {
    query.value = ''
    activeIndex.value = 0
    nextTick(() => input.value?.focus())
  }
})

function select(to: string) {
  open.value = false
  router.push(to)
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}

function onListKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, flatResults.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    const item = flatResults.value[activeIndex.value]
    if (item) select(item.to)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

defineExpose({ open: () => (open.value = true) })
</script>

<template>
  <button
    type="button"
    aria-label="Cari menu"
    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-left text-sm text-white/40 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/60 lg:w-64 lg:justify-between lg:px-3"
    @click="open = true"
  >
    <span class="flex items-center gap-2">
      <Search class="size-4 shrink-0" />
      <span class="hidden lg:inline">Cari...</span>
    </span>
    <kbd
      class="hidden h-5 items-center gap-0.5 rounded-xs border border-white/15 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/50 lg:inline-flex"
    >
      <span class="text-[9px]">Ctrl+</span>K
    </kbd>
  </button>

  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50" />
      <DialogContent
        class="bg-popover text-popover-foreground fixed top-[18%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border shadow-lg"
        @keydown="onListKeydown"
      >
        <DialogTitle class="sr-only">Pencarian Menu</DialogTitle>
        <div class="flex items-center gap-2 border-b px-4 py-3">
          <Search class="text-muted-foreground size-4 shrink-0" />
          <input
            ref="input"
            v-model="query"
            type="text"
            placeholder="Ketik nama menu untuk mencari…"
            class="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div class="max-h-80 overflow-y-auto p-2">
          <p v-if="!flatResults.length" class="text-muted-foreground px-3 py-6 text-center text-sm">
            Menu tidak ditemukan.
          </p>
          <div v-for="group in groups" :key="group.label" class="mb-1 last:mb-0">
            <p class="text-muted-foreground px-3 py-1.5 text-[11px] font-semibold uppercase">
              {{ group.label }}
            </p>
            <button
              v-for="item in group.items"
              :key="item.to"
              type="button"
              :class="
                cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm',
                  flatResults[activeIndex] === item
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/60',
                )
              "
              @mouseenter="activeIndex = flatResults.indexOf(item)"
              @click="select(item.to)"
            >
              <component :is="item.icon" class="text-muted-foreground mr-1 size-4 shrink-0" />
              <span class="flex-1 font-medium">{{ item.label }}</span>
              <span
                class="text-muted-foreground bg-muted shrink-0 rounded-sm px-1.5 py-0.5 text-[10px]"
              >
                {{ group.label }}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
