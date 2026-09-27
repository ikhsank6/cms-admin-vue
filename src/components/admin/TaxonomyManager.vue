<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { z } from 'zod'
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FormField from '@/components/common/FormField.vue'
import DataPagination from '@/components/common/DataPagination.vue'
import DataTable, { type DataTableColumn } from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useResourceList } from '@/composables/useResourceList'
import { useConfirm } from '@/composables/useConfirm'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { slugify } from '@/utils/slug'
import { slugSchema } from '@/utils/validation'
import type { ID, ListParams, Paginated } from '@/types'

interface Item {
  id: ID
  name: string
  slug: string
  description?: string | null
  articlesCount?: number
}
interface Service {
  list(p: ListParams): Promise<Paginated<Item>>
  create(i: Partial<Item>): Promise<Item>
  update(id: ID, i: Partial<Item>): Promise<Item>
  remove(id: ID): Promise<void>
}

const props = defineProps<{
  service: Service
  permission: 'category' | 'tag'
  label: string
  withDescription?: boolean
}>()
const auth = useAuthStore()
const { confirm } = useConfirm()
const { items, loading, page, meta, filters, reload } = useResourceList(
  (p) => props.service.list(p),
  { search: '' },
)
const { errors, submitting, validate, submit } = useFormSubmit()

const columns = computed<DataTableColumn[]>(() => [
  { key: 'name', label: 'Nama', class: 'font-medium' },
  { key: 'slug', label: 'Slug', class: 'text-muted-foreground font-mono text-xs' },
  ...(props.withDescription
    ? [
        {
          key: 'description',
          label: 'Deskripsi',
          hideBelow: 'md' as const,
          class: 'text-muted-foreground max-w-xs truncate',
        },
      ]
    : []),
  { key: 'articlesCount', label: 'Artikel', class: 'text-right tabular-nums' },
  { key: 'actions', class: 'w-24 text-right' },
])

const open = ref(false)
const editing = ref<Item | null>(null)
const form = reactive({ name: '', slug: '', description: '' })
const slugTouched = ref(false)
watch(
  () => form.name,
  (n) => {
    if (!slugTouched.value) form.slug = slugify(n)
  },
)

const schema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
  slug: slugSchema,
})

function openForm(item?: Item) {
  editing.value = item ?? null
  Object.assign(form, {
    name: item?.name ?? '',
    slug: item?.slug ?? '',
    description: item?.description ?? '',
  })
  slugTouched.value = !!item
  errors.value = {}
  open.value = true
}

async function save() {
  if (!validate(schema, form)) return
  const payload = { ...form, description: props.withDescription ? form.description : undefined }
  const ok = await submit(
    () =>
      editing.value
        ? props.service.update(editing.value.id, payload)
        : props.service.create(payload),
    `${props.label} disimpan`,
  )
  if (ok) {
    open.value = false
    reload()
  }
}

async function remove(item: Item) {
  const ok = await confirm({
    title: `Hapus ${props.label.toLowerCase()} "${item.name}"?`,
    description: item.articlesCount
      ? `${item.articlesCount} artikel akan kehilangan ${props.label.toLowerCase()} ini.`
      : undefined,
    confirmLabel: 'Hapus',
    destructive: true,
  })
  if (!ok) return
  try {
    await props.service.remove(item.id)
    toast.success(`${props.label} dihapus`)
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <Card class="gap-0 py-0">
    <div class="flex flex-col gap-3 border-b p-4 sm:flex-row">
      <div class="relative flex-1">
        <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          v-model="filters.search"
          :placeholder="`Cari ${label.toLowerCase()}…`"
          class="pl-9"
        />
      </div>
      <Button v-if="auth.can(`${permission}.create`)" @click="openForm()"
        ><Plus /> Tambah {{ label }}</Button
      >
    </div>
    <DataTable :columns="columns" :rows="items" :loading="loading" :row-key="(item) => item.id">
      <template #cell-articlesCount="{ row: item }">{{ item.articlesCount ?? 0 }}</template>
      <template #cell-actions="{ row: item }">
        <Button
          v-if="auth.can(`${permission}.update`)"
          variant="ghost"
          size="icon-sm"
          aria-label="Edit"
          @click="openForm(item)"
          ><Pencil
        /></Button>
        <Button
          v-if="auth.can(`${permission}.delete`)"
          variant="ghost"
          size="icon-sm"
          aria-label="Hapus"
          @click="remove(item)"
          ><Trash2 class="text-destructive"
        /></Button>
      </template>
    </DataTable>
    <EmptyState v-if="!loading && !items.length" :title="`Belum ada ${label.toLowerCase()}`" />
    <div class="border-t px-4"><DataPagination v-model="page" :meta="meta" /></div>

    <Dialog v-model:open="open" :title="editing ? `Edit ${label}` : `Tambah ${label}`">
      <form id="taxonomy-form" class="grid gap-4" @submit.prevent="save">
        <FormField label="Nama" for="tx-name" :error="errors.name" required>
          <Input id="tx-name" v-model="form.name" />
        </FormField>
        <FormField label="Slug" for="tx-slug" :error="errors.slug" required>
          <Input id="tx-slug" v-model="form.slug" class="font-mono" @input="slugTouched = true" />
        </FormField>
        <FormField v-if="withDescription" label="Deskripsi" for="tx-desc">
          <Textarea id="tx-desc" v-model="form.description" rows="3" />
        </FormField>
      </form>
      <template #footer>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button type="submit" form="taxonomy-form" :loading="submitting">Simpan</Button>
      </template>
    </Dialog>
  </Card>
</template>
