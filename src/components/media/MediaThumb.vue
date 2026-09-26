<script setup lang="ts">
import { computed } from 'vue'
import { File, FileSpreadsheet, FileText } from 'lucide-vue-next'
import type { Media } from '@/types'
import { mediaKind } from '@/utils/file-validation'

const props = defineProps<{ media: Media }>()
const kind = computed(() => mediaKind(props.media.mimeType))
const icon = computed(() =>
  kind.value === 'pdf'
    ? FileText
    : /sheet|excel/.test(props.media.mimeType)
      ? FileSpreadsheet
      : File,
)
</script>

<template>
  <div class="bg-muted flex aspect-square items-center justify-center overflow-hidden">
    <img
      v-if="kind === 'image'"
      :src="media.url"
      :alt="media.alt ?? media.originalName"
      loading="lazy"
      class="size-full object-cover"
    />
    <div v-else class="text-muted-foreground flex flex-col items-center gap-1 p-2">
      <component :is="icon" class="size-10" />
      <span class="text-[10px] font-semibold uppercase">{{
        media.originalName.split('.').pop()
      }}</span>
    </div>
  </div>
</template>
