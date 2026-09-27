<script setup lang="ts">
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Undo2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataPagination from '@/components/common/DataPagination.vue'
import DataTable, { type DataTableColumn } from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { pageService } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useResourceList } from '@/composables/useResourceList'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/format'
import type { Page } from '@/types'

const auth = useAuthStore()
const { confirm } = useConfirm()
const { items, loading, page, perPage, meta, filters, reload } = useResourceList(
  (p) => pageService.list(p),
  {
    search: '',
    status: '',
  },
)

const publicPath = (p: Page) => (p.slug === 'home' ? '/' : `/${p.slug}`)

const columns: DataTableColumn[] = [
  { key: 'title', label: 'Judul' },
  { key: 'status', label: 'Status' },
  { key: 'sections', label: 'Sections', hideBelow: 'md' },
  { key: 'updatedAt', label: 'Diperbarui', hideBelow: 'md' },
  { key: 'actions', class: 'w-12' },
]

async function togglePublish(p: Page) {
  try {
    if (p.status === 'PUBLISHED') await pageService.unpublish(p.id)
    else await pageService.publish(p.id)
    toast.success(p.status === 'PUBLISHED' ? 'Page di-unpublish' : 'Page dipublikasikan')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}

async function remove(p: Page) {
  const ok = await confirm({
    title: `Hapus page "${p.title}"?`,
    description: 'Page beserta seluruh section akan dihapus permanen.',
    confirmLabel: 'Hapus',
    destructive: true,
  })
  if (!ok) return
  try {
    await pageService.remove(p.id)
    toast.success('Page dihapus')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <PageHeader title="Pages" description="Kelola halaman website yang disusun dari section/block.">
      <template #actions>
        <Button v-if="auth.can('page.create')" as-child data-testid="create-page">
          <RouterLink to="/admin/pages/new"><Plus /> Buat Page</RouterLink>
        </Button>
      </template>
    </PageHeader>
    <Card class="gap-0 py-0">
      <div class="flex flex-col gap-3 border-b p-4 sm:flex-row">
        <div class="relative flex-1">
          <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input v-model="filters.search" placeholder="Cari judul atau slug…" class="pl-9" />
        </div>
        <NativeSelect v-model="filters.status" class="sm:w-44">
          <option value="">Semua status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </NativeSelect>
      </div>
      <DataTable
        :columns="columns"
        :rows="items"
        :loading="loading"
        test-id="page-row"
        :row-key="(p) => p.id"
      >
        <template #cell-title="{ row: p }">
          <RouterLink :to="`/admin/pages/${p.id}`" class="font-medium hover:underline">{{
            p.title
          }}</RouterLink>
          <p class="text-muted-foreground font-mono text-xs">{{ publicPath(p) }}</p>
        </template>
        <template #cell-status="{ row: p }"><StatusBadge :status="p.status" /></template>
        <template #cell-sections="{ row: p }">{{ p.sections.length }}</template>
        <template #cell-updatedAt="{ row: p }">
          <span class="text-muted-foreground text-sm">{{ formatDateTime(p.updatedAt) }}</span>
        </template>
        <template #cell-actions="{ row: p }">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon-sm" aria-label="Aksi"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @select="$router.push(`/admin/pages/${p.id}`)"
                ><Pencil /> Edit</DropdownMenuItem
              >
              <DropdownMenuItem v-if="p.status === 'PUBLISHED'" as-child>
                <a :href="publicPath(p)" target="_blank" rel="noopener"><ExternalLink /> Lihat</a>
              </DropdownMenuItem>
              <DropdownMenuItem v-if="auth.can('page.publish')" @select="togglePublish(p)">
                <template v-if="p.status === 'PUBLISHED'"><Undo2 /> Unpublish</template>
                <template v-else><Send /> Publish</template>
              </DropdownMenuItem>
              <template v-if="auth.can('page.delete')">
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @select="remove(p)"
                  ><Trash2 /> Hapus</DropdownMenuItem
                >
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
      </DataTable>
      <EmptyState v-if="!loading && !items.length" title="Belum ada page" />
      <div class="border-t px-4">
        <DataPagination
          v-model="page"
          v-model:page-size="perPage"
          :meta="meta"
          :page-size-options="[10, 20, 50, 100]"
        />
      </div>
    </Card>
  </div>
</template>
