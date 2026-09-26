<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import EmptyState from '@/components/common/EmptyState.vue'
import { articleService, categoryService } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useResourceList } from '@/composables/useResourceList'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/format'
import type { Article, Category } from '@/types'

const auth = useAuthStore()
const { confirm } = useConfirm()
const categories = ref<Category[]>([])
const { items, loading, page, meta, filters, reload } = useResourceList(
  (p) => articleService.list(p),
  {
    search: '',
    status: '',
    categoryId: '',
  },
)

onMounted(async () => {
  if (auth.can('category.view'))
    categories.value = (
      await categoryService.list({ perPage: 100 }).catch(() => ({ data: [] }))
    ).data
})

async function togglePublish(a: Article) {
  try {
    if (a.status === 'PUBLISHED') await articleService.unpublish(a.id)
    else await articleService.publish(a.id)
    toast.success(a.status === 'PUBLISHED' ? 'Artikel di-unpublish' : 'Artikel dipublikasikan')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}

async function remove(a: Article) {
  const ok = await confirm({
    title: `Hapus artikel "${a.title}"?`,
    description: 'Tindakan ini tidak dapat dibatalkan.',
    confirmLabel: 'Hapus',
    destructive: true,
  })
  if (!ok) return
  try {
    await articleService.remove(a.id)
    toast.success('Artikel dihapus')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <PageHeader title="Articles" description="Kelola artikel, berita, dan pengumuman.">
      <template #actions>
        <Button v-if="auth.can('article.create')" as-child>
          <RouterLink to="/admin/articles/new"><Plus /> Tulis Artikel</RouterLink>
        </Button>
      </template>
    </PageHeader>
    <Card class="gap-0 py-0">
      <div class="flex flex-col gap-3 border-b p-4 sm:flex-row">
        <div class="relative flex-1">
          <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input v-model="filters.search" placeholder="Cari artikel…" class="pl-9" />
        </div>
        <NativeSelect v-model="filters.categoryId" class="sm:w-44">
          <option value="">Semua kategori</option>
          <option v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
        </NativeSelect>
        <NativeSelect v-model="filters.status" class="sm:w-40">
          <option value="">Semua status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </NativeSelect>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Judul</TableHead>
            <TableHead class="hidden md:table-cell">Kategori</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="hidden lg:table-cell">Penulis</TableHead>
            <TableHead class="hidden md:table-cell">Publikasi</TableHead>
            <TableHead class="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading && !items.length">
            <TableRow v-for="i in 5" :key="i"
              ><TableCell colspan="6"><Skeleton class="h-6" /></TableCell
            ></TableRow>
          </template>
          <TableRow v-for="a in items" :key="a.id">
            <TableCell class="max-w-md">
              <div class="flex items-center gap-3">
                <img
                  v-if="a.featuredImage"
                  :src="a.featuredImage"
                  alt=""
                  class="hidden size-10 shrink-0 rounded object-cover sm:block"
                />
                <div class="min-w-0">
                  <RouterLink
                    :to="`/admin/articles/${a.id}`"
                    class="line-clamp-1 font-medium hover:underline"
                    >{{ a.title }}</RouterLink
                  >
                  <p class="text-muted-foreground truncate font-mono text-xs">/news/{{ a.slug }}</p>
                </div>
              </div>
            </TableCell>
            <TableCell class="hidden md:table-cell">{{ a.category?.name ?? '—' }}</TableCell>
            <TableCell><StatusBadge :status="a.status" /></TableCell>
            <TableCell class="hidden lg:table-cell">{{ a.author?.name ?? '—' }}</TableCell>
            <TableCell class="text-muted-foreground hidden text-sm md:table-cell">{{
              formatDate(a.publishedAt)
            }}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon-sm" aria-label="Aksi"
                    ><MoreHorizontal
                  /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem @select="$router.push(`/admin/articles/${a.id}`)"
                    ><Pencil /> Edit</DropdownMenuItem
                  >
                  <DropdownMenuItem v-if="a.status === 'PUBLISHED'" as-child>
                    <a :href="`/news/${a.slug}`" target="_blank" rel="noopener"
                      ><ExternalLink /> Lihat</a
                    >
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="auth.can('article.publish')" @select="togglePublish(a)">
                    <template v-if="a.status === 'PUBLISHED'"><Undo2 /> Unpublish</template>
                    <template v-else><Send /> Publish</template>
                  </DropdownMenuItem>
                  <template v-if="auth.can('article.delete')">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" @select="remove(a)"
                      ><Trash2 /> Hapus</DropdownMenuItem
                    >
                  </template>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <EmptyState v-if="!loading && !items.length" title="Belum ada artikel" />
      <div class="border-t px-4"><DataPagination v-model="page" :meta="meta" /></div>
    </Card>
  </div>
</template>
