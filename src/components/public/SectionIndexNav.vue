<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useScrollSpy } from '@/composables/useScrollSpy'
import type { PageSection, SectionType } from '@/types'

const props = defineProps<{ sections: PageSection[] }>()

const defaultLabels: Record<SectionType, string> = {
  HERO: 'Beranda',
  TEXT: 'Tentang',
  IMAGE: 'Sorotan',
  IMAGE_TEXT: 'Tentang',
  STATISTIC: 'Capaian',
  CARD: 'Layanan',
  SERVICES: 'Layanan',
  NEWS: 'Berita',
  GALLERY: 'Galeri',
  CTA: 'Kontak',
  FAQ: 'Tanya Jawab',
  CONTACT: 'Kontak',
}

const entries = computed(() =>
  props.sections
    .map((s, i) => ({
      id: `section-${i}`,
      type: s.type,
      label: (s.content?.title as string) || defaultLabels[s.type],
    }))
    .filter((e, i) => e.type !== 'HERO' && props.sections[i]?.isActive !== false),
)
const ids = computed(() => entries.value.map((e) => e.id))
const { activeId } = useScrollSpy(ids)

const visible = ref(false)
function onScroll() {
  visible.value = window.scrollY > window.innerHeight * 0.6
}
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

function go(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-x-2"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="opacity-0 translate-x-2"
  >
    <nav
      v-if="visible && entries.length > 1"
      aria-label="Navigasi bagian halaman"
      class="fixed top-1/2 right-6 z-30 hidden -translate-y-1/2 xl:block"
    >
      <ul class="flex flex-col items-end gap-3.5">
        <li v-for="e in entries" :key="e.id">
          <a
            :href="`#${e.id}`"
            :aria-current="activeId === e.id ? 'true' : undefined"
            class="group flex items-center gap-3 outline-none"
            @click.prevent="go(e.id)"
          >
            <span
              :class="[
                'max-w-0 overflow-hidden text-xs font-medium whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-32 group-hover:opacity-100 group-focus:max-w-32 group-focus:opacity-100',
                activeId === e.id
                  ? 'text-foreground max-w-32 opacity-100'
                  : 'text-muted-foreground',
              ]"
            >
              {{ e.label }}
            </span>
            <span
              :class="[
                'size-1.5 shrink-0 rounded-full transition-all',
                activeId === e.id ? 'bg-brand scale-125' : 'bg-border group-hover:bg-foreground/50',
              ]"
            />
          </a>
        </li>
      </ul>
    </nav>
  </Transition>
</template>
