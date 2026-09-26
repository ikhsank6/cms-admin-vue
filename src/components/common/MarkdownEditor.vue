<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bold, Heading2, Italic, Link, List, Quote } from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'
import { renderMarkdown } from '@/utils/markdown'
import { cn } from '@/lib/utils'

const props = defineProps<{ id?: string; rows?: number; placeholder?: string }>()
const model = defineModel<string>({ default: '' })
const mode = ref<'write' | 'preview'>('write')
const textarea = ref<InstanceType<typeof Textarea> | null>(null)
const preview = computed(() => renderMarkdown(model.value))

function wrap(before: string, after = before, placeholder = 'teks') {
  const el = (textarea.value?.$el ?? null) as HTMLTextAreaElement | null
  const value = model.value ?? ''
  const start = el?.selectionStart ?? value.length
  const end = el?.selectionEnd ?? value.length
  const selected = value.slice(start, end) || placeholder
  model.value = value.slice(0, start) + before + selected + after + value.slice(end)
}

const tools = [
  { icon: Heading2, label: 'Heading', run: () => wrap('\n## ', '\n', 'Judul') },
  { icon: Bold, label: 'Bold', run: () => wrap('**') },
  { icon: Italic, label: 'Italic', run: () => wrap('_') },
  { icon: Link, label: 'Link', run: () => wrap('[', '](https://)', 'tautan') },
  { icon: List, label: 'List', run: () => wrap('\n- ', '\n', 'item') },
  { icon: Quote, label: 'Quote', run: () => wrap('\n> ', '\n', 'kutipan') },
]
</script>

<template>
  <div class="rounded-md border">
    <div class="flex items-center justify-between border-b px-2 py-1">
      <div class="flex gap-0.5">
        <button
          v-for="t in tools"
          :key="t.label"
          type="button"
          :title="t.label"
          :disabled="mode === 'preview'"
          class="hover:bg-accent rounded p-1.5 disabled:opacity-40"
          @click="t.run"
        >
          <component :is="t.icon" class="size-4" />
        </button>
      </div>
      <div class="flex gap-1 text-xs">
        <button
          v-for="m in ['write', 'preview'] as const"
          :key="m"
          type="button"
          :class="
            cn(
              'rounded px-2 py-1 capitalize',
              mode === m ? 'bg-muted font-medium' : 'text-muted-foreground',
            )
          "
          @click="mode = m"
        >
          {{ m === 'write' ? 'Tulis' : 'Pratinjau' }}
        </button>
      </div>
    </div>
    <Textarea
      v-show="mode === 'write'"
      :id="props.id"
      ref="textarea"
      v-model="model"
      :rows="rows ?? 12"
      :placeholder="placeholder ?? 'Tulis konten menggunakan Markdown…'"
      class="rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0"
    />
    <div v-if="mode === 'preview'" class="prose-content min-h-40 px-4 py-2" v-html="preview" />
  </div>
</template>
