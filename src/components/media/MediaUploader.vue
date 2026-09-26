<script setup lang="ts">
import { ref } from 'vue'
import { UploadCloud } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { mediaService } from '@/services/media'
import { errorMessage } from '@/services/api'
import { ACCEPT_ATTRIBUTE } from '@/utils/file-validation'
import { formatBytes } from '@/utils/format'
import { config } from '@/config/env'
import { cn } from '@/lib/utils'
import type { Media } from '@/types'

const props = defineProps<{ folder?: string; accept?: string; compact?: boolean }>()
const emit = defineEmits<{ uploaded: [Media] }>()

const dragging = ref(false)
const queue = ref<{ name: string; progress: number; error?: string }[]>([])
const input = ref<HTMLInputElement | null>(null)

async function handleFiles(files: FileList | File[] | null) {
  if (!files) return
  for (const file of Array.from(files)) {
    const entry = { name: file.name, progress: 0 } as {
      name: string
      progress: number
      error?: string
    }
    queue.value.push(entry)
    const item = queue.value[queue.value.length - 1]!
    try {
      const media = await mediaService.upload(file, {
        folder: props.folder,
        onProgress: (p) => (item.progress = p),
      })
      item.progress = 100
      emit('uploaded', media)
      toast.success(`${file.name} berhasil diunggah`)
    } catch (e) {
      item.error = e instanceof Error && !('status' in e) ? e.message : errorMessage(e)
      toast.error(`${file.name}: ${item.error}`)
    }
  }
  setTimeout(() => (queue.value = queue.value.filter((q) => q.error)), 1500)
  if (input.value) input.value.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  handleFiles(e.dataTransfer?.files ?? null)
}
</script>

<template>
  <div>
    <label
      :class="
        cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors',
          compact ? 'p-4' : 'p-8',
          dragging ? 'border-brand bg-brand/5' : 'hover:bg-muted/50',
        )
      "
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <UploadCloud class="text-muted-foreground size-8" />
      <span class="text-sm font-medium">Tarik & lepas file, atau klik untuk memilih</span>
      <span class="text-muted-foreground text-xs">
        Gambar, PDF, dokumen · maks {{ formatBytes(config.uploadMaxBytes, 0) }}
      </span>
      <input
        ref="input"
        type="file"
        multiple
        class="sr-only"
        data-testid="media-upload-input"
        :accept="accept ?? ACCEPT_ATTRIBUTE"
        @change="handleFiles(($event.target as HTMLInputElement).files)"
      />
    </label>
    <ul v-if="queue.length" class="mt-3 space-y-2">
      <li v-for="(q, i) in queue" :key="i" class="text-sm">
        <div class="flex justify-between">
          <span class="truncate">{{ q.name }}</span>
          <span :class="q.error ? 'text-destructive' : 'text-muted-foreground'">
            {{ q.error ?? `${q.progress}%` }}
          </span>
        </div>
        <div v-if="!q.error" class="bg-muted mt-1 h-1 overflow-hidden rounded">
          <div class="bg-brand h-full transition-all" :style="{ width: `${q.progress}%` }" />
        </div>
      </li>
    </ul>
  </div>
</template>
