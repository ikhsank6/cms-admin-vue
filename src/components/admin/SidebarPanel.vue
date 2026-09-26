<script setup lang="ts">
import { computed } from 'vue'
import { PanelLeftClose } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import SidebarSubmenu from './SidebarSubmenu.vue'
import type { NavSection } from '@/config/navigation'

const props = defineProps<{ sections: NavSection[] }>()
const ui = useUiStore()

const section = computed(() => props.sections[ui.selectedSection] ?? props.sections[0])
</script>

<template>
  <div
    :class="
      cn(
        'bg-card border-border relative hidden h-full overflow-hidden border-r transition-[width] duration-300 ease-in-out md:block',
        ui.panelExpanded ? 'w-60' : 'w-0',
      )
    "
  >
    <button
      type="button"
      aria-label="Tutup submenu"
      class="text-muted-foreground bg-card hover:text-foreground hover:bg-muted border-border absolute top-3 right-2 z-10 inline-flex size-7 items-center justify-center rounded-lg border shadow-sm transition-colors"
      @click="ui.panelExpanded = false"
    >
      <PanelLeftClose class="size-4" />
    </button>
    <div v-if="section" class="flex w-60 flex-col gap-0.5 overflow-y-auto p-3">
      <SidebarSubmenu :section="section" label-class="pr-9" />
    </div>
  </div>
</template>
