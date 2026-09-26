<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { findActiveSectionIndex } from '@/config/navigation'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import type { NavSection } from '@/config/navigation'

const props = defineProps<{ sections: NavSection[] }>()
const ui = useUiStore()
const route = useRoute()

const activeIndex = computed(() => findActiveSectionIndex(route.path))

// Keep the highlighted rail icon in sync with the current route, without forcing
// the submenu panel open (that only happens when the user clicks a rail icon).
watch(
  activeIndex,
  (i) => {
    ui.selectedSection = i
  },
  { immediate: true },
)
</script>

<template>
  <nav
    class="bg-sidebar hidden h-full w-[72px] shrink-0 flex-col items-center gap-1.5 pt-2.5 pb-4 md:flex"
    aria-label="Menu utama"
  >
    <button
      v-for="(section, i) in props.sections"
      :key="section.label"
      type="button"
      :title="section.label"
      :aria-label="section.label"
      :aria-current="i === activeIndex ? 'true' : undefined"
      :class="
        cn(
          'inline-flex size-11 items-center justify-center rounded-xl transition-colors',
          i === ui.selectedSection
            ? 'bg-sidebar-active text-sidebar-active-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground',
        )
      "
      @click="ui.selectSection(i)"
    >
      <component :is="section.icon" class="size-5" :stroke-width="2" />
    </button>
  </nav>
</template>
