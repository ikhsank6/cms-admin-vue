<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { visibleSections } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import AppFooter from '@/components/common/AppFooter.vue'
import AppNavbar from '@/components/admin/AppNavbar.vue'
import SidebarRail from '@/components/admin/SidebarRail.vue'
import SidebarPanel from '@/components/admin/SidebarPanel.vue'
import MobileSidebarDrawer from '@/components/admin/MobileSidebarDrawer.vue'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()

const sections = computed(() => visibleSections((p) => auth.can(p)))

watch(
  () => route.fullPath,
  () => (ui.mobileSidebarOpen = false),
)
</script>

<template>
  <div class="flex h-svh overflow-hidden">
    <!-- Column 1 — icon rail, full height -->
    <SidebarRail :sections="sections" />

    <!-- Right side — navbar on top, then (submenu panel + content) below -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AppNavbar />
      <div class="flex min-h-0 flex-1 overflow-hidden">
        <SidebarPanel :sections="sections" />
        <main class="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div class="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
            <RouterView v-slot="{ Component, route: r }">
              <component :is="Component" :key="r.path" />
            </RouterView>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>

    <MobileSidebarDrawer :sections="sections" />
  </div>
</template>
