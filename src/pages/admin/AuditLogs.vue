<script setup lang="ts">
import { ref } from 'vue'
import { Eye, Search } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import PageHeader from '@/components/common/PageHeader.vue'
import DataPagination from '@/components/common/DataPagination.vue'
import DataTable, { type DataTableColumn } from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { auditLogService } from '@/services/admin'
import { useResourceList } from '@/composables/useResourceList'
import { formatDateTime } from '@/utils/format'
import { diffObjects } from '@/utils/diff'
import type { AuditAction, AuditLog } from '@/types'

const actions: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'PUBLISH',
  'UNPUBLISH',
  'LOGIN',
  'LOGOUT',
]
const modules = [
  'auth',
  'pages',
  'articles',
  'categories',
  'tags',
  'media',
  'banners',
  'menus',
  'settings',
  'users',
  'roles',
]
const { items, loading, page, perPage, meta, filters } = useResourceList(
  (p) => auditLogService.list(p),
  {
    search: '',
    action: '',
    module: '',
    from: '',
    to: '',
  },
  { perPage: 20 },
)
const selected = ref<AuditLog | null>(null)

const columns: DataTableColumn[] = [
  { key: 'createdAt', label: 'Waktu', class: 'text-sm whitespace-nowrap' },
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Aksi' },
  { key: 'resource', label: 'Resource' },
  {
    key: 'ipAddress',
    label: 'IP',
    hideBelow: 'lg',
    class: 'text-muted-foreground font-mono text-xs',
  },
  { key: 'actions', class: 'w-12' },
]

const variant = (a: AuditAction) =>
  a === 'DELETE'
    ? 'destructive'
    : a === 'PUBLISH'
      ? 'success'
      : a === 'UNPUBLISH'
        ? 'warning'
        : a === 'CREATE'
          ? 'default'
          : 'secondary'
</script>

<template>
  <div>
    <PageHeader title="Audit Log" description="Riwayat aktivitas penting administrator." />
    <Card class="gap-0 py-0">
      <div class="grid gap-3 border-b p-4 md:grid-cols-[1fr_150px_150px_140px_140px]">
        <div class="relative">
          <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input v-model="filters.search" placeholder="Cari user, resource…" class="pl-9" />
        </div>
        <NativeSelect v-model="filters.action" aria-label="Aksi">
          <option value="">Semua aksi</option>
          <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
        </NativeSelect>
        <NativeSelect v-model="filters.module" aria-label="Modul">
          <option value="">Semua modul</option>
          <option v-for="m in modules" :key="m" :value="m">{{ m }}</option>
        </NativeSelect>
        <Input v-model="filters.from" type="date" aria-label="Dari tanggal" />
        <Input v-model="filters.to" type="date" aria-label="Sampai tanggal" />
      </div>
      <DataTable :columns="columns" :rows="items" :loading="loading" :row-key="(l) => l.id">
        <template #cell-createdAt="{ row: l }">{{ formatDateTime(l.createdAt) }}</template>
        <template #cell-user="{ row: l }">{{ l.user?.name ?? 'Sistem' }}</template>
        <template #cell-action="{ row: l }"
          ><Badge :variant="variant(l.action)">{{ l.action }}</Badge></template
        >
        <template #cell-resource="{ row: l }">
          <span class="font-medium">{{ l.resourceType }}</span>
          <span v-if="l.resourceId" class="text-muted-foreground"> #{{ l.resourceId }}</span>
          <p class="text-muted-foreground text-xs">{{ l.module }}</p>
        </template>
        <template #cell-ipAddress="{ row: l }">{{ l.ipAddress }}</template>
        <template #cell-actions="{ row: l }">
          <Button variant="ghost" size="icon-sm" aria-label="Detail" @click="selected = l"
            ><Eye
          /></Button>
        </template>
      </DataTable>
      <EmptyState v-if="!loading && !items.length" title="Belum ada aktivitas" />
      <div class="border-t px-4">
        <DataPagination
          v-model="page"
          v-model:page-size="perPage"
          :meta="meta"
          :page-size-options="[10, 20, 50, 100]"
        />
      </div>
    </Card>

    <Dialog
      :open="!!selected"
      title="Detail Aktivitas"
      class="sm:max-w-3xl"
      @update:open="!$event && (selected = null)"
    >
      <div v-if="selected" class="grid gap-4 text-sm">
        <dl class="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1">
          <dt class="text-muted-foreground">Waktu</dt>
          <dd>{{ formatDateTime(selected.createdAt) }}</dd>
          <dt class="text-muted-foreground">User</dt>
          <dd>
            {{ selected.user?.name ?? 'Sistem' }}
            <span class="text-muted-foreground">{{ selected.user?.email }}</span>
          </dd>
          <dt class="text-muted-foreground">Aksi</dt>
          <dd>{{ selected.action }} · {{ selected.module }}</dd>
          <dt class="text-muted-foreground">Resource</dt>
          <dd>
            {{ selected.resourceType }} {{ selected.resourceId ? `#${selected.resourceId}` : '' }}
          </dd>
          <dt class="text-muted-foreground">IP Address</dt>
          <dd class="font-mono">{{ selected.ipAddress ?? '—' }}</dd>
          <dt class="text-muted-foreground">User Agent</dt>
          <dd class="text-xs break-all">{{ selected.userAgent ?? '—' }}</dd>
        </dl>
        <div v-if="selected.oldData || selected.newData">
          <p class="mb-2 font-medium">Perubahan</p>
          <div class="max-h-80 overflow-auto rounded-md border">
            <table class="w-full text-xs">
              <thead class="bg-muted/50 sticky top-0">
                <tr>
                  <th class="p-2 text-left">Field</th>
                  <th class="p-2 text-left">Sebelum</th>
                  <th class="p-2 text-left">Sesudah</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="d in diffObjects(selected.oldData, selected.newData)"
                  :key="d.path"
                  class="border-t align-top"
                >
                  <td class="p-2 font-mono">{{ d.path }}</td>
                  <td class="bg-destructive/5 p-2 font-mono break-all">{{ d.before }}</td>
                  <td class="bg-success/5 p-2 font-mono break-all">{{ d.after }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>
