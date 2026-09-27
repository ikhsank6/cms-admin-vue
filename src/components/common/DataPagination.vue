<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/select'
import { paginationRange } from '@/utils/pagination'
import { cn } from '@/lib/utils'
import type { PaginationMeta } from '@/types'

const props = withDefaults(
  defineProps<{
    meta: PaginationMeta
    /** Page sizes offered in the dropdown. Omit to hide the per-page selector entirely. */
    pageSizeOptions?: number[]
    /** Hide the "Ke halaman" jump-to-page input (e.g. in a tight popup). */
    hideJump?: boolean
  }>(),
  { hideJump: false },
)

const page = defineModel<number>({ required: true })
const pageSize = defineModel<number>('pageSize')

const range = computed(() => {
  const { page: p, perPage, total } = props.meta
  if (!total) return '0 data'
  return `${(p - 1) * perPage + 1}–${Math.min(p * perPage, total)} dari ${total}`
})

const pages = computed(() => paginationRange(props.meta.page, props.meta.totalPages))

const jumpValue = ref('')
function jump() {
  const n = Math.trunc(Number(jumpValue.value))
  if (n >= 1 && n <= props.meta.totalPages) page.value = n
  jumpValue.value = ''
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm">
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-muted-foreground">{{ range }}</span>
      <label v-if="pageSizeOptions?.length" class="text-muted-foreground flex items-center gap-1.5">
        <span class="hidden sm:inline">Baris per halaman</span>
        <NativeSelect
          :model-value="pageSize"
          class="w-[4.5rem]"
          aria-label="Baris per halaman"
          @update:model-value="pageSize = Number($event)"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </NativeSelect>
      </label>
    </div>

    <div class="flex flex-wrap items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        :disabled="page <= 1"
        aria-label="Sebelumnya"
        @click="page--"
      >
        <ChevronLeft />
      </Button>

      <template v-for="(item, i) in pages" :key="i">
        <span v-if="item === 'ellipsis'" class="text-muted-foreground px-1.5">…</span>
        <Button
          v-else
          :variant="item === meta.page ? 'default' : 'outline'"
          size="icon-sm"
          :aria-current="item === meta.page ? 'page' : undefined"
          :aria-label="`Halaman ${item}`"
          @click="page = item"
        >
          {{ item }}
        </Button>
      </template>

      <Button
        variant="outline"
        size="icon-sm"
        :disabled="page >= meta.totalPages"
        aria-label="Berikutnya"
        @click="page++"
      >
        <ChevronRight />
      </Button>

      <form
        v-if="!hideJump && meta.totalPages > 1"
        class="ml-2 flex items-center gap-1.5"
        @submit.prevent="jump"
      >
        <label class="text-muted-foreground hidden items-center gap-1.5 sm:flex">
          Ke halaman
          <input
            v-model="jumpValue"
            type="number"
            min="1"
            :max="meta.totalPages"
            placeholder="#"
            :class="
              cn(
                'border-input h-8 w-16 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              )
            "
          />
        </label>
        <Button type="submit" variant="outline" size="sm" :disabled="!jumpValue">Ke</Button>
      </form>
    </div>
  </div>
</template>
