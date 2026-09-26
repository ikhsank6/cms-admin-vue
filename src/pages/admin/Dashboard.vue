<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { FileText, Image, Newspaper, Plus, Users } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { dashboardService } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime, formatNumber } from '@/utils/format'
import type { DashboardStats } from '@/types'

const auth = useAuthStore()
const stats = ref<DashboardStats | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await dashboardService.get()
  } catch (e) {
    error.value = errorMessage(e)
  }
})

const cards = [
  { key: 'pages', label: 'Pages', icon: FileText, to: '/admin/pages' },
  { key: 'articles', label: 'Articles', icon: Newspaper, to: '/admin/articles' },
  { key: 'media', label: 'Media', icon: Image, to: '/admin/media' },
  { key: 'users', label: 'Users', icon: Users, to: '/admin/users' },
] as const

const actionVariant = (a: string) =>
  a === 'DELETE'
    ? 'destructive'
    : a === 'PUBLISH'
      ? 'success'
      : a === 'CREATE'
        ? 'default'
        : 'secondary'
</script>

<template>
  <div>
    <PageHeader
      :title="`Halo, ${auth.user?.name ?? ''}`"
      description="Ringkasan konten dan aktivitas CMS."
    >
      <template #actions>
        <Button v-if="auth.can('article.create')" as-child variant="outline"
          ><RouterLink to="/admin/articles/new"><Plus /> Artikel</RouterLink></Button
        >
        <Button v-if="auth.can('page.create')" as-child
          ><RouterLink to="/admin/pages/new"><Plus /> Page</RouterLink></Button
        >
      </template>
    </PageHeader>

    <p v-if="error" class="text-destructive">{{ error }}</p>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RouterLink v-for="c in cards" :key="c.key" :to="c.to">
        <Card class="gap-2 py-5 transition hover:shadow-md">
          <CardHeader class="flex flex-row items-center justify-between px-5">
            <CardDescription>{{ c.label }}</CardDescription>
            <component :is="c.icon" class="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent class="px-5">
            <Skeleton v-if="!stats" class="h-8 w-16" />
            <p v-else class="text-3xl font-bold tabular-nums" :data-testid="`stat-${c.key}`">
              {{ formatNumber(stats.totals[c.key]) }}
            </p>
          </CardContent>
        </Card>
      </RouterLink>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <Card v-for="k in ['pages', 'articles'] as const" :key="k" class="gap-3 py-5">
        <CardHeader class="px-5"
          ><CardTitle class="text-base capitalize">Status {{ k }}</CardTitle></CardHeader
        >
        <CardContent class="px-5">
          <div v-if="stats" class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Published</span><b>{{ stats[k].published }}</b>
            </div>
            <div class="bg-muted h-2 overflow-hidden rounded-full">
              <div
                class="bg-success h-full"
                :style="{
                  width: `${(stats[k].published / Math.max(stats[k].published + stats[k].draft, 1)) * 100}%`,
                }"
              />
            </div>
            <div class="flex justify-between text-sm">
              <span>Draft</span><b>{{ stats[k].draft }}</b>
            </div>
          </div>
          <Skeleton v-else class="h-16" />
        </CardContent>
      </Card>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <Card class="gap-3 py-5">
        <CardHeader class="px-5"
          ><CardTitle class="text-base">Konten Terbaru</CardTitle></CardHeader
        >
        <CardContent class="px-5">
          <ul v-if="stats?.latestContent.length" class="divide-y">
            <li
              v-for="c in stats.latestContent"
              :key="`${c.type}-${c.id}`"
              class="flex items-center gap-3 py-2.5"
            >
              <component
                :is="c.type === 'page' ? FileText : Newspaper"
                class="text-muted-foreground size-4 shrink-0"
              />
              <RouterLink
                :to="`/admin/${c.type}s/${c.id}`"
                class="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                >{{ c.title }}</RouterLink
              >
              <StatusBadge :status="c.status" />
              <span class="text-muted-foreground hidden text-xs sm:inline">{{
                formatDateTime(c.updatedAt)
              }}</span>
            </li>
          </ul>
          <EmptyState v-else-if="stats" title="Belum ada konten" />
          <Skeleton v-else class="h-40" />
        </CardContent>
      </Card>
      <Card class="gap-3 py-5">
        <CardHeader class="flex flex-row items-center justify-between px-5">
          <CardTitle class="text-base">Aktivitas Terbaru</CardTitle>
          <RouterLink
            v-if="auth.can('audit_log.view')"
            to="/admin/audit-logs"
            class="text-muted-foreground text-xs hover:underline"
            >Lihat semua</RouterLink
          >
        </CardHeader>
        <CardContent class="px-5">
          <ul v-if="stats?.recentActivities.length" class="divide-y">
            <li
              v-for="a in stats.recentActivities"
              :key="a.id"
              class="flex items-center gap-3 py-2.5 text-sm"
            >
              <Badge :variant="actionVariant(a.action)" class="w-20">{{ a.action }}</Badge>
              <span class="min-w-0 flex-1 truncate">
                <b>{{ a.user?.name ?? 'Sistem' }}</b> · {{ a.resourceType
                }}<template v-if="a.resourceId"> #{{ a.resourceId }}</template>
              </span>
              <span class="text-muted-foreground text-xs">{{ formatDateTime(a.createdAt) }}</span>
            </li>
          </ul>
          <EmptyState v-else-if="stats" title="Belum ada aktivitas" />
          <Skeleton v-else class="h-40" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
