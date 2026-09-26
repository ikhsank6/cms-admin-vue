<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { PaginationMeta } from '@/types'

const props = defineProps<{ meta: PaginationMeta }>()
const page = defineModel<number>({ required: true })

const range = computed(() => {
  const { page: p, perPage, total } = props.meta
  if (!total) return '0 data'
  return `${(p - 1) * perPage + 1}–${Math.min(p * perPage, total)} dari ${total}`
})
</script>

<template>
  <div class="flex items-center justify-between gap-4 px-1 py-3 text-sm">
    <span class="text-muted-foreground">{{ range }}</span>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        :disabled="page <= 1"
        aria-label="Sebelumnya"
        @click="page--"
      >
        <ChevronLeft />
      </Button>
      <span class="tabular-nums">{{ meta.page }} / {{ meta.totalPages }}</span>
      <Button
        variant="outline"
        size="icon-sm"
        :disabled="page >= meta.totalPages"
        aria-label="Berikutnya"
        @click="page++"
      >
        <ChevronRight />
      </Button>
    </div>
  </div>
</template>
