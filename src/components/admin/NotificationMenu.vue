<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Bell, CheckCheck, Info, ShieldAlert, UserPlus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'warning' | 'user'
}

// Static demo feed — the backend does not define a notifications endpoint yet (PRD out of scope).
const notifications = reactive<Notification[]>([
  {
    id: '1',
    title: 'Pengguna baru mendaftar',
    message: 'Ada editor baru yang baru saja dibuat.',
    time: '2 menit lalu',
    read: false,
    type: 'user',
  },
  {
    id: '2',
    title: 'Artikel menunggu review',
    message: 'Satu draft artikel siap untuk dipublikasikan.',
    time: '1 jam lalu',
    read: false,
    type: 'info',
  },
  {
    id: '3',
    title: 'Peringatan keamanan',
    message: 'Terdeteksi login dari perangkat baru.',
    time: '3 jam lalu',
    read: false,
    type: 'warning',
  },
  {
    id: '4',
    title: 'Pembaruan sistem',
    message: 'CMS berhasil diperbarui ke versi terbaru.',
    time: 'Kemarin',
    read: true,
    type: 'info',
  },
])

const typeConfig = {
  info: { icon: Info, class: 'text-blue-500 bg-blue-500/10' },
  warning: { icon: ShieldAlert, class: 'text-amber-500 bg-amber-500/10' },
  user: { icon: UserPlus, class: 'text-emerald-500 bg-emerald-500/10' },
} as const

const unreadCount = computed(() => notifications.filter((n) => !n.read).length)

function markAllRead() {
  notifications.forEach((n) => (n.read = true))
}
function markRead(n: Notification) {
  n.read = true
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        aria-label="Notifikasi"
        class="relative inline-flex size-9 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Bell class="size-5" />
        <span
          v-if="unreadCount"
          class="bg-destructive ring-navbar absolute top-1.5 right-1.5 size-2 rounded-full ring-2"
        />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-80 p-0">
      <div class="flex items-center justify-between border-b px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold">Notifikasi</span>
          <span
            v-if="unreadCount"
            class="bg-destructive text-destructive-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
          >
            {{ unreadCount }}
          </span>
        </div>
        <Button
          v-if="unreadCount"
          variant="ghost"
          size="sm"
          class="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
          @click="markAllRead"
        >
          <CheckCheck class="size-3.5" /> Tandai semua
        </Button>
      </div>
      <div class="max-h-80 overflow-y-auto">
        <p v-if="!notifications.length" class="text-muted-foreground py-10 text-center text-sm">
          Tidak ada notifikasi
        </p>
        <button
          v-for="n in notifications"
          :key="n.id"
          type="button"
          :class="
            cn(
              'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50',
              !n.read && 'bg-muted/30',
            )
          "
          @click="markRead(n)"
        >
          <span
            :class="
              cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                typeConfig[n.type].class,
              )
            "
          >
            <component :is="typeConfig[n.type].icon" class="size-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-2">
              <span :class="cn('truncate text-sm', !n.read && 'font-semibold')">{{ n.title }}</span>
              <span v-if="!n.read" class="bg-brand size-2 shrink-0 rounded-full" />
            </span>
            <span class="text-muted-foreground line-clamp-2 block text-xs">{{ n.message }}</span>
            <span class="text-muted-foreground/70 mt-1 block text-[10px]">{{ n.time }}</span>
          </span>
        </button>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
