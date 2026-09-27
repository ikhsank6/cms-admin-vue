<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, ChevronsUpDown, X } from 'lucide-vue-next'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import type { ComboboxOption } from '.'

const props = withDefaults(
  defineProps<{
    /** The underlying primitive reserves `''` for "no selection" — never use it as an option value. */
    options: ComboboxOption[]
    placeholder?: string
    emptyText?: string
    disabled?: boolean
    clearable?: boolean
    class?: string
    /** Forwarded to the underlying text input, so a `<label for>` can target it. */
    id?: string
    /** Forwarded to the underlying text input when there is no visible `<label>`. */
    ariaLabel?: string
  }>(),
  {
    placeholder: 'Pilih…',
    emptyText: 'Tidak ditemukan.',
    clearable: true,
  },
)

const modelValue = defineModel<string | number | null | undefined>()

const open = ref(false)
const search = ref('')
// A search left over from the previous open would otherwise silently hide options
// (including the selected one) the next time the list opens.
watch(open, (v) => {
  if (v) search.value = ''
})
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? props.options.filter((o) => o.label.toLowerCase().includes(q)) : props.options
})

// The headless combobox only compares primitives reliably as strings; map back to the
// option's original value (and type — ids are often numbers) on selection.
const internalValue = computed<string | undefined>({
  get: () => (modelValue.value == null ? undefined : String(modelValue.value)),
  set: (v) => {
    modelValue.value =
      v === undefined ? null : (props.options.find((o) => String(o.value) === v)?.value ?? null)
  },
})

const selectedLabel = computed(
  () => props.options.find((o) => String(o.value) === internalValue.value)?.label ?? '',
)

function clear(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  modelValue.value = null
  search.value = ''
}
</script>

<template>
  <ComboboxRoot
    v-model="internalValue"
    v-model:open="open"
    v-model:search-term="search"
    :disabled="disabled"
    ignore-filter
  >
    <ComboboxAnchor
      :class="
        cn(
          'border-input focus-within:border-ring focus-within:ring-ring/50 flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus-within:ring-[3px]',
          disabled && 'pointer-events-none opacity-50',
          props.class,
        )
      "
    >
      <ComboboxInput
        :id="id"
        :aria-label="ariaLabel"
        :display-value="() => selectedLabel"
        :placeholder="selectedLabel ? undefined : (placeholder as string)"
        class="placeholder:text-muted-foreground w-full min-w-0 bg-transparent text-sm outline-none"
        @focus="($event.target as HTMLInputElement).select()"
      />
      <button
        v-if="clearable && modelValue != null"
        type="button"
        aria-label="Hapus pilihan"
        class="text-muted-foreground hover:text-foreground shrink-0"
        @mousedown="clear"
      >
        <X class="size-3.5" />
      </button>
      <ComboboxTrigger class="text-muted-foreground shrink-0" aria-label="Buka daftar pilihan">
        <ChevronsUpDown class="size-4" />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        class="bg-popover text-popover-foreground z-50 min-w-[14rem] overflow-hidden rounded-md border shadow-md"
        :side-offset="4"
      >
        <ComboboxViewport class="max-h-64 overflow-y-auto p-1">
          <ComboboxEmpty
            v-if="!filtered.length"
            class="text-muted-foreground px-3 py-6 text-center text-sm"
          >
            {{ emptyText }}
          </ComboboxEmpty>
          <ComboboxItem
            v-for="opt in filtered"
            :key="opt.value"
            :value="String(opt.value)"
            :disabled="opt.disabled"
            class="data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:opacity-50"
          >
            <ComboboxItemIndicator class="text-brand"
              ><Check class="size-4"
            /></ComboboxItemIndicator>
            <span class="flex-1 truncate">{{ opt.label }}</span>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
