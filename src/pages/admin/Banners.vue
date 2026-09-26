<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { z } from 'zod'
import { Pencil, Plus, Send, Trash2, Undo2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/select'
import PageHeader from '@/components/common/PageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import ImageField from '@/components/common/ImageField.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { bannerService } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useResourceList } from '@/composables/useResourceList'
import { useConfirm } from '@/composables/useConfirm'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { useAuthStore } from '@/stores/auth'
import { formatDate, fromDateTimeLocal, toDateTimeLocal } from '@/utils/format'
import { contentStatusSchema, optionalUrl } from '@/utils/validation'
import type { Banner, BannerInput } from '@/types'

const auth = useAuthStore()
const { confirm } = useConfirm()
const { items, loading, reload } = useResourceList(
  (p) => bannerService.list({ ...p, perPage: 100 }),
  {},
)
const { errors, submitting, validate, submit } = useFormSubmit()

const open = ref(false)
const editing = ref<Banner | null>(null)
const empty = (): BannerInput => ({
  title: '',
  subtitle: '',
  image: null,
  buttonLabel: '',
  buttonUrl: '',
  startDate: null,
  endDate: null,
  sortOrder: items.value.length + 1,
  status: 'DRAFT',
})
const form = reactive<BannerInput>(empty())
const start = computed({
  get: () => toDateTimeLocal(form.startDate),
  set: (v: string) => (form.startDate = fromDateTimeLocal(v)),
})
const end = computed({
  get: () => toDateTimeLocal(form.endDate),
  set: (v: string) => (form.endDate = fromDateTimeLocal(v)),
})

const schema = z
  .object({
    title: z.string().trim().min(1, 'Judul wajib diisi').max(150),
    buttonUrl: optionalUrl,
    sortOrder: z.number().int().min(0),
    status: contentStatusSchema,
    startDate: z.string().nullish(),
    endDate: z.string().nullish(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['endDate'],
  })

function openForm(b?: Banner) {
  editing.value = b ?? null
  Object.assign(form, b ? { ...b } : empty())
  errors.value = {}
  open.value = true
}

async function save() {
  const payload = { ...form, sortOrder: Number(form.sortOrder) }
  if (!validate(schema, payload)) return
  const ok = await submit(
    () =>
      editing.value
        ? bannerService.update(editing.value.id, payload)
        : bannerService.create(payload),
    'Banner disimpan',
  )
  if (ok) {
    open.value = false
    reload()
  }
}

async function toggle(b: Banner) {
  try {
    await (b.status === 'PUBLISHED' ? bannerService.unpublish(b.id) : bannerService.publish(b.id))
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}

async function remove(b: Banner) {
  if (
    !(await confirm({
      title: `Hapus banner "${b.title}"?`,
      confirmLabel: 'Hapus',
      destructive: true,
    }))
  )
    return
  try {
    await bannerService.remove(b.id)
    toast.success('Banner dihapus')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}

const period = (b: Banner) =>
  b.startDate || b.endDate
    ? `${formatDate(b.startDate)} – ${formatDate(b.endDate)}`
    : 'Tanpa batas waktu'
</script>

<template>
  <div>
    <PageHeader
      title="Banners / Hero"
      description="Atur banner dan hero yang tampil di halaman beranda."
    >
      <template #actions>
        <Button v-if="auth.can('banner.create')" @click="openForm()"><Plus /> Tambah Banner</Button>
      </template>
    </PageHeader>

    <EmptyState v-if="!loading && !items.length" title="Belum ada banner" />
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card v-for="b in items" :key="b.id" class="gap-0 overflow-hidden py-0">
        <div class="relative aspect-[16/7] bg-slate-900">
          <img v-if="b.image" :src="b.image" alt="" class="size-full object-cover opacity-70" />
          <div class="absolute inset-0 flex flex-col justify-end p-4 text-white">
            <p class="font-semibold">{{ b.title }}</p>
            <p v-if="b.subtitle" class="line-clamp-1 text-sm text-white/80">{{ b.subtitle }}</p>
          </div>
          <span class="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white"
            >#{{ b.sortOrder }}</span
          >
        </div>
        <div class="flex items-center gap-2 p-3">
          <StatusBadge :status="b.status" />
          <span class="text-muted-foreground truncate text-xs">{{ period(b) }}</span>
          <div class="ml-auto flex">
            <Button
              v-if="auth.can('banner.publish')"
              variant="ghost"
              size="icon-sm"
              :title="b.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'"
              @click="toggle(b)"
            >
              <Undo2 v-if="b.status === 'PUBLISHED'" /><Send v-else />
            </Button>
            <Button
              v-if="auth.can('banner.update')"
              variant="ghost"
              size="icon-sm"
              title="Edit"
              @click="openForm(b)"
              ><Pencil
            /></Button>
            <Button
              v-if="auth.can('banner.delete')"
              variant="ghost"
              size="icon-sm"
              title="Hapus"
              @click="remove(b)"
              ><Trash2 class="text-destructive"
            /></Button>
          </div>
        </div>
      </Card>
    </div>

    <Dialog
      v-model:open="open"
      :title="editing ? 'Edit Banner' : 'Tambah Banner'"
      class="sm:max-w-2xl"
    >
      <form id="banner-form" class="grid gap-4" @submit.prevent="save">
        <FormField label="Judul" for="b-title" :error="errors.title" required
          ><Input id="b-title" v-model="form.title"
        /></FormField>
        <FormField label="Subjudul" for="b-sub"
          ><Textarea id="b-sub" v-model="form.subtitle" rows="2"
        /></FormField>
        <FormField label="Gambar"><ImageField v-model="form.image" folder="banners" /></FormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField label="Label Tombol" for="b-btn"
            ><Input id="b-btn" v-model="form.buttonLabel"
          /></FormField>
          <FormField label="URL Tombol" for="b-url" :error="errors.buttonUrl"
            ><Input id="b-url" v-model="form.buttonUrl" placeholder="/about"
          /></FormField>
          <FormField label="Mulai Tayang" for="b-start"
            ><Input id="b-start" v-model="start" type="datetime-local"
          /></FormField>
          <FormField label="Selesai Tayang" for="b-end" :error="errors.endDate"
            ><Input id="b-end" v-model="end" type="datetime-local"
          /></FormField>
          <FormField label="Urutan" for="b-order"
            ><Input id="b-order" v-model="form.sortOrder" type="number" min="0"
          /></FormField>
          <FormField label="Status" for="b-status">
            <NativeSelect
              id="b-status"
              v-model="form.status"
              :disabled="!auth.can('banner.publish')"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </NativeSelect>
          </FormField>
        </div>
      </form>
      <template #footer>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button type="submit" form="banner-form" :loading="submitting">Simpan</Button>
      </template>
    </Dialog>
  </div>
</template>
