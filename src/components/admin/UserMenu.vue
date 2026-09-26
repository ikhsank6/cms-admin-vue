<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogOut, Moon, Settings, Sun, UserRound } from 'lucide-vue-next'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useConfirm } from '@/composables/useConfirm'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const { confirm } = useConfirm()

async function logout() {
  const ok = await confirm({
    title: 'Keluar dari akun?',
    description: 'Sesi Anda akan diakhiri dan Anda akan diarahkan ke halaman login.',
    confirmLabel: 'Keluar',
    destructive: true,
  })
  if (!ok) return
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        aria-label="Menu pengguna"
        data-testid="user-menu"
        class="rounded-full ring-2 ring-transparent transition-all hover:ring-white/30 focus-visible:ring-white/50 focus-visible:outline-none"
      >
        <Avatar :name="auth.user?.name" :src="auth.user?.avatar" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-64 p-0" :side-offset="8">
      <div class="flex items-center gap-3 border-b px-4 py-3.5">
        <Avatar :name="auth.user?.name" :src="auth.user?.avatar" class="size-10" />
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">{{ auth.user?.name }}</p>
          <p class="text-muted-foreground truncate text-xs">{{ auth.user?.email }}</p>
        </div>
      </div>
      <div class="p-1.5">
        <DropdownMenuItem
          class="gap-2.5 rounded-lg px-3 py-2"
          @select="router.push('/admin/profile')"
        >
          <UserRound class="text-muted-foreground size-4 shrink-0" />
          <span class="text-sm">Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          class="gap-2.5 rounded-lg px-3 py-2"
          @select="router.push('/admin/settings')"
        >
          <Settings class="text-muted-foreground size-4 shrink-0" />
          <span class="text-sm">Pengaturan</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="gap-2.5 rounded-lg px-3 py-2" @select="ui.toggleDark()">
          <Sun v-if="ui.isDark" class="text-muted-foreground size-4 shrink-0" />
          <Moon v-else class="text-muted-foreground size-4 shrink-0" />
          <span class="text-sm">{{ ui.isDark ? 'Mode Terang' : 'Mode Gelap' }}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          class="gap-2.5 rounded-lg px-3 py-2"
          data-testid="logout"
          @select="logout"
        >
          <LogOut class="size-4 shrink-0" />
          <span class="text-sm">Keluar</span>
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
