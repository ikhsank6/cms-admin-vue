<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Download, Search, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/common/PageHeader.vue'
import DataPagination from '@/components/common/DataPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormField from '@/components/common/FormField.vue'
import MediaUploader from '@/components/media/MediaUploader.vue'
import MediaThumb from '@/components/media/MediaThumb.vue'
import { mediaService } from '@/services/media'
import { errorMessage } from '@/services/api'
import { useResourceList } from '@/composables/useResourceList'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import { formatBytes, formatDateTime } from '@/utils/format'
import { isImage } from '@/utils/file-validation'
import type { Media } from '@/types'

const auth = useAuthStore()
const { confirm } = useConfirm()
const { items, loading, page, meta, filters, reload } = useResourceList(
  (p) => mediaService.list(p),
  { search: '', type: '', from: '', to: '' },
  { perPage: 24 },
)
const selected = ref<Media | null>(null)
const alt = ref('')

function open(m: Media) {
  selected.value = m
  alt.value = m.alt ?? ''
}

async function copyUrl(m: Media) {
  const url = new URL(m.url, window.location.origin).href
  try {
    await navigator.clipboard.writeText(url)
    toast.success('URL disalin')
  } catch {
    toast.error('Gagal menyalin URL')
  }
}

async function saveAlt() {
  if (!selected.value) return
  try {
    selected.value = await mediaService.update(selected.value.id, { alt: alt.value })
    toast.success('Alt text disimpan')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}

async function remove(m: Media) {
  const ok = await confirm({
    title: `Hapus ${m.originalName}?`,
    description:
      'File akan dihapus dari storage. Konten yang memakai file ini akan kehilangan gambarnya.',
    confirmLabel: 'Hapus',
    destructive: true,
  })
  if (!ok) return
  try {
    await mediaService.remove(m.id)
    selected.value = null
    toast.success('Media dihapus')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <PageHeader title="Media Library" description="Kelola gambar, PDF, dan dokumen." />
    <MediaUploader v-if="auth.can('media.upload')" class="mb-6" @uploaded="reload" />

    <Card class="gap-0 py-0">
      <div class="grid gap-3 border-b p-4 md:grid-cols-[1fr_160px_150px_150px]">
        <div class="relative">
          <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input v-model="filters.search" placeholder="Cari nama file…" class="pl-9" />
        </div>
        <NativeSelect v-model="filters.type" aria-label="Tipe">
          <option value="">Semua tipe</option>
          <option value="image">Gambar</option>
          <option value="pdf">PDF</option>
          <option value="document">Dokumen</option>
        </NativeSelect>
        <Input v-model="filters.from" type="date" aria-label="Dari tanggal" />
        <Input v-model="filters.to" type="date" aria-label="Sampai tanggal" />
      </div>
      <div class="p-4">
        <div
          v-if="loading && !items.length"
          class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6"
        >
          <Skeleton v-for="i in 12" :key="i" class="aspect-square" />
        </div>
        <EmptyState v-else-if="!items.length" title="Belum ada media" />
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <button
            v-for="m in items"
            :key="m.id"
            type="button"
            class="group overflow-hidden rounded-lg border text-left transition hover:shadow-md"
            data-testid="media-item"
            @click="open(m)"
          >
            <MediaThumb :media="m" />
            <div class="p-2">
              <p class="truncate text-xs font-medium">{{ m.originalName }}</p>
              <p class="text-muted-foreground text-[10px]">{{ formatBytes(m.size) }}</p>
            </div>
          </button>
        </div>
      </div>
      <div class="border-t px-4"><DataPagination v-model="page" :meta="meta" /></div>
    </Card>

    <Dialog
      :open="!!selected"
      :title="selected?.originalName ?? ''"
      class="sm:max-w-3xl"
      @update:open="!$event && (selected = null)"
    >
      <div v-if="selected" class="grid gap-6 md:grid-cols-[1fr_260px]">
        <div class="bg-muted flex min-h-60 items-center justify-center overflow-hidden rounded-lg">
          <img
            v-if="isImage(selected.mimeType)"
            :src="selected.url"
            :alt="selected.alt ?? ''"
            class="max-h-[60vh] object-contain"
          />
          <iframe
            v-else-if="selected.mimeType === 'application/pdf'"
            :src="selected.url"
            class="h-[60vh] w-full"
            title="PDF preview"
            sandbox=""
          />
          <MediaThumb v-else :media="selected" class="w-40" />
        </div>
        <div class="grid content-start gap-3 text-sm">
          <dl class="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
            <dt class="text-muted-foreground">Tipe</dt>
            <dd class="break-all">{{ selected.mimeType }}</dd>
            <dt class="text-muted-foreground">Ukuran</dt>
            <dd>{{ formatBytes(selected.size) }}</dd>
            <template v-if="selected.width"
              ><dt class="text-muted-foreground">Dimensi</dt>
              <dd>{{ selected.width }}×{{ selected.height }}</dd></template
            >
            <dt class="text-muted-foreground">Disk</dt>
            <dd class="uppercase">{{ selected.disk }}</dd>
            <dt class="text-muted-foreground">Key</dt>
            <dd class="font-mono text-xs break-all">{{ selected.storageKey }}</dd>
            <dt class="text-muted-foreground">Diunggah</dt>
            <dd>{{ formatDateTime(selected.createdAt) }}</dd>
          </dl>
          <FormField v-if="isImage(selected.mimeType)" label="Alt text" for="media-alt">
            <div class="flex gap-2">
              <Input id="media-alt" v-model="alt" :disabled="!auth.can('media.upload')" />
              <Button v-if="auth.can('media.upload')" size="sm" variant="outline" @click="saveAlt"
                >Simpan</Button
              >
            </div>
          </FormField>
          <div class="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" @click="copyUrl(selected)"
              ><Copy /> Salin URL</Button
            >
            <Button size="sm" variant="outline" as-child
              ><a
                :href="selected.url"
                :download="selected.originalName"
                target="_blank"
                rel="noopener"
                ><Download /> Unduh</a
              ></Button
            >
            <Button
              v-if="auth.can('media.delete')"
              size="sm"
              variant="destructive"
              @click="remove(selected)"
              ><Trash2 /> Hapus</Button
            >
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>
