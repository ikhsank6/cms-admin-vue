<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ExternalLink,
  LayoutTemplate,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  UserRound,
} from 'lucide-vue-next'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { adminNavigation } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const navigation = computed(() =>
  adminNavigation
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.permission || auth.can(i.permission)) }))
    .filter((g) => g.items.length),
)

function isActive(to: string) {
  return to === '/admin' ? route.path === '/admin' : route.path.startsWith(to)
}

watch(
  () => route.fullPath,
  () => (ui.mobileSidebarOpen = false),
)

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="bg-muted/30 flex min-h-svh">
    <!-- Mobile overlay -->
    <div
      v-if="ui.mobileSidebarOpen"
      class="fixed inset-0 z-30 bg-black/40 lg:hidden"
      @click="ui.mobileSidebarOpen = false"
    />

    <aside
      :class="
        cn(
          'bg-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-all lg:sticky lg:top-0 lg:h-svh',
          ui.sidebarCollapsed && 'lg:w-16',
          ui.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )
      "
    >
      <div class="flex h-14 items-center gap-2 border-b px-4">
        <span
          class="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md"
        >
          <LayoutTemplate class="size-4" />
        </span>
        <span v-if="!ui.sidebarCollapsed" class="truncate font-semibold">CMS Admin</span>
      </div>
      <nav class="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Admin">
        <div v-for="group in navigation" :key="group.label">
          <p
            v-if="!ui.sidebarCollapsed"
            class="text-muted-foreground mb-1 px-2 text-xs font-medium uppercase tracking-wide"
          >
            {{ group.label }}
          </p>
          <ul class="space-y-0.5">
            <li v-for="item in group.items" :key="item.to">
              <RouterLink
                :to="item.to"
                :title="item.label"
                :class="
                  cn(
                    'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                    isActive(item.to)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-foreground/80',
                    ui.sidebarCollapsed && 'lg:justify-center',
                  )
                "
              >
                <component :is="item.icon" class="size-4 shrink-0" />
                <span :class="cn('truncate', ui.sidebarCollapsed && 'lg:hidden')">{{
                  item.label
                }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>
      <div class="hidden border-t p-3 lg:block">
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-start"
          @click="ui.sidebarCollapsed = !ui.sidebarCollapsed"
        >
          <PanelLeftOpen v-if="ui.sidebarCollapsed" />
          <template v-else><PanelLeftClose /> Ciutkan</template>
        </Button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="bg-background/95 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur"
      >
        <Button
          variant="ghost"
          size="icon"
          class="lg:hidden"
          aria-label="Menu"
          @click="ui.mobileSidebarOpen = true"
        >
          <Menu />
        </Button>
        <p class="truncate text-sm font-medium">{{ route.meta.title }}</p>
        <div class="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" as-child>
            <a href="/" target="_blank" rel="noopener"
              ><ExternalLink /> <span class="hidden sm:inline">Lihat Website</span></a
            >
          </Button>
          <Button variant="ghost" size="icon" aria-label="Tema" @click="ui.toggleDark()">
            <Sun v-if="ui.isDark" /><Moon v-else />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="flex items-center gap-2 rounded-md p-1 hover:bg-accent"
                data-testid="user-menu"
              >
                <Avatar :name="auth.user?.name" :src="auth.user?.avatar" />
                <span class="hidden text-left text-sm leading-tight md:block">
                  <span class="block font-medium">{{ auth.user?.name }}</span>
                  <span class="text-muted-foreground block text-xs">{{
                    auth.user?.roles.map((r) => r.name).join(', ')
                  }}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56">
              <DropdownMenuLabel class="text-muted-foreground truncate text-xs font-normal">{{
                auth.user?.email
              }}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @select="router.push('/admin/profile')"
                ><UserRound /> Profil</DropdownMenuItem
              >
              <DropdownMenuItem variant="destructive" data-testid="logout" @select="logout"
                ><LogOut /> Logout</DropdownMenuItem
              >
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main class="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
        <RouterView v-slot="{ Component, route: r }">
          <component :is="Component" :key="r.path" />
        </RouterView>
      </main>
    </div>
  </div>
</template>
