<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import SidebarSubmenu from './SidebarSubmenu.vue'
import type { NavSection } from '@/config/navigation'

const props = defineProps<{ sections: NavSection[] }>()
const ui = useUiStore()

const section = computed(() => props.sections[ui.selectedSection] ?? props.sections[0])

function close() {
  ui.mobileSidebarOpen = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="ui.mobileSidebarOpen" class="fixed inset-0 z-40 md:hidden">
      <div class="fixed inset-0 bg-black/40" @click="close" />
      <div class="bg-card relative flex h-full w-[320px] max-w-[85vw] flex-col">
        <!-- Column 1 — icon rail -->
        <div class="flex flex-1 min-h-0">
          <nav
            class="bg-sidebar flex w-[72px] shrink-0 flex-col items-center gap-1.5 pt-3 pb-4"
            aria-label="Menu utama"
          >
            <button
              v-for="(s, i) in props.sections"
              :key="s.label"
              type="button"
              :aria-label="s.label"
              :class="
                cn(
                  'inline-flex size-11 items-center justify-center rounded-xl transition-colors',
                  i === ui.selectedSection
                    ? 'bg-sidebar-active text-sidebar-active-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground',
                )
              "
              @click="ui.selectedSection = i"
            >
              <component :is="s.icon" class="size-5" :stroke-width="2" />
            </button>
          </nav>
          <!-- Column 2 — submenu -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="section" class="flex flex-col gap-0.5 p-3">
              <SidebarSubmenu :section="section" @navigate="close" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
