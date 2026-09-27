<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowLeft, Search } from 'lucide-vue-next'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import DataPagination from '@/components/common/DataPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MediaUploader from './MediaUploader.vue'
import MediaThumb from './MediaThumb.vue'
import { mediaService } from '@/services/media'
import { useResourceList } from '@/composables/useResourceList'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import type { Media } from '@/types'

const props = defineProps<{ type?: 'image' | 'pdf' | 'document'; folder?: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ select: [Media] }>()
const auth = useAuthStore()

const selected = ref<Media | null>(null)
const { items, loading, page, meta, filters, reload } = useResourceList(
  (p) => mediaService.list(p),
  { search: '', type: props.type ?? '' } as { search: string; type: string },
  { perPage: 12, immediate: false },
)

watch(open, (v) => {
  if (v) {
    selected.value = null
    reload()
  }
})

function onUploaded(media: Media) {
  items.value = [media, ...items.value]
  selected.value = media
}

function pick(m: Media) {
  selected.value = m
  confirm()
}

function confirm() {
  if (!selected.value) return
  emit('select', selected.value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" title="Pilih Media" class="sm:max-w-4xl">
    <div class="grid gap-4">
      <MediaUploader
        v-if="auth.can('media.upload')"
        compact
        :folder="folder"
        @uploaded="onUploaded"
      />
      <div class="relative">
        <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input v-model="filters.search" placeholder="Cari media…" class="pl-9" />
      </div>
      <div v-if="loading" class="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Skeleton v-for="i in 12" :key="i" class="aspect-square" />
      </div>
      <EmptyState v-else-if="!items.length" title="Media tidak ditemukan" />
      <div v-else class="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <button
          v-for="m in items"
          :key="m.id"
          type="button"
          :title="m.originalName"
          data-testid="media-picker-item"
          :class="
            cn(
              'overflow-hidden rounded-md border-2 transition',
              selected?.id === m.id
                ? 'border-brand ring-brand/30 ring-2'
                : 'border-transparent hover:border-border',
            )
          "
          @click="selected = m"
          @dblclick="pick(m)"
        >
          <MediaThumb :media="m" />
        </button>
      </div>
      <DataPagination v-model="page" :meta="meta" />
    </div>
    <template #footer>
      <Button variant="outline" @click="open = false"><ArrowLeft /> Batal</Button>
      <Button :disabled="!selected" data-testid="media-picker-confirm" @click="confirm"
        >Pilih</Button
      >
    </template>
  </Dialog>
</template>
