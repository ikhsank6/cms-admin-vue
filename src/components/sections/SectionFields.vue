<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import FormField from '@/components/common/FormField.vue'
import ImageField from '@/components/common/ImageField.vue'
import MarkdownEditor from '@/components/common/MarkdownEditor.vue'
import MediaPicker from '@/components/media/MediaPicker.vue'
import type { FieldDef } from './registry'

defineOptions({ name: 'SectionFields' })
const props = defineProps<{ fields: FieldDef[]; idPrefix: string }>()
const content = defineModel<Record<string, unknown>>({ required: true })

const galleryPickerFor = ref<string | null>(null)

function list(key: string): Record<string, unknown>[] {
  if (!Array.isArray(content.value[key])) content.value[key] = []
  return content.value[key] as Record<string, unknown>[]
}
function images(key: string): string[] {
  if (!Array.isArray(content.value[key])) content.value[key] = []
  return content.value[key] as string[]
}
function addItem(field: FieldDef) {
  list(field.key).push(
    Object.fromEntries(
      (field.itemFields ?? []).map((f) => [f.key, f.type === 'boolean' ? false : '']),
    ),
  )
}
function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
}
const fid = (f: FieldDef) => `${props.idPrefix}-${f.key}`
</script>

<template>
  <div class="grid gap-4">
    <template v-for="field in fields" :key="field.key">
      <FormField
        v-if="field.type !== 'list' && field.type !== 'images'"
        :label="field.label"
        :for="fid(field)"
        :required="field.required"
      >
        <Input
          v-if="field.type === 'text' || field.type === 'url'"
          :id="fid(field)"
          v-model="content[field.key] as string"
          :type="field.type === 'url' ? 'text' : 'text'"
          :placeholder="field.placeholder"
          :data-testid="`field-${field.key}`"
        />
        <Input
          v-else-if="field.type === 'number'"
          :id="fid(field)"
          :model-value="content[field.key] as number"
          type="number"
          min="0"
          @update:model-value="content[field.key] = Number($event)"
        />
        <Textarea
          v-else-if="field.type === 'textarea'"
          :id="fid(field)"
          v-model="content[field.key] as string"
          rows="3"
          :data-testid="`field-${field.key}`"
        />
        <MarkdownEditor
          v-else-if="field.type === 'markdown'"
          :id="fid(field)"
          v-model="content[field.key] as string"
          :rows="8"
        />
        <ImageField
          v-else-if="field.type === 'image'"
          :id="fid(field)"
          v-model="content[field.key] as string"
          folder="pages"
        />
        <NativeSelect
          v-else-if="field.type === 'select'"
          :id="fid(field)"
          v-model="content[field.key] as string"
        >
          <option v-for="o in field.options" :key="o.value" :value="o.value">{{ o.label }}</option>
        </NativeSelect>
        <Switch
          v-else-if="field.type === 'boolean'"
          :id="fid(field)"
          v-model="content[field.key] as boolean"
        />
      </FormField>

      <!-- Image gallery -->
      <div v-else-if="field.type === 'images'" class="grid gap-2">
        <span class="text-sm font-medium">{{ field.label }}</span>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <div
            v-for="(src, i) in images(field.key)"
            :key="i"
            class="group relative aspect-square overflow-hidden rounded-md border"
          >
            <img :src="src" alt="" class="size-full object-cover" />
            <button
              type="button"
              class="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100"
              @click="images(field.key).splice(i, 1)"
            >
              <X class="size-3" />
            </button>
          </div>
          <button
            type="button"
            class="hover:bg-muted flex aspect-square items-center justify-center rounded-md border-2 border-dashed"
            @click="galleryPickerFor = field.key"
          >
            <Plus class="text-muted-foreground size-5" />
          </button>
        </div>
        <MediaPicker
          :open="galleryPickerFor === field.key"
          type="image"
          folder="gallery"
          @update:open="galleryPickerFor = $event ? field.key : null"
          @select="images(field.key).push($event.url)"
        />
      </div>

      <!-- Repeater -->
      <div v-else class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">{{ field.label }}</span>
          <Button type="button" size="sm" variant="outline" @click="addItem(field)">
            <Plus /> Tambah {{ field.itemLabel ?? 'Item' }}
          </Button>
        </div>
        <p v-if="!list(field.key).length" class="text-muted-foreground text-sm">Belum ada item.</p>
        <div
          v-for="(_item, i) in list(field.key)"
          :key="i"
          class="bg-muted/30 rounded-md border p-3"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-muted-foreground text-xs font-medium"
              >{{ field.itemLabel ?? 'Item' }} #{{ i + 1 }}</span
            >
            <div class="flex gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                :disabled="i === 0"
                @click="move(list(field.key), i, -1)"
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                :disabled="i === list(field.key).length - 1"
                @click="move(list(field.key), i, 1)"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                @click="list(field.key).splice(i, 1)"
              >
                <Trash2 class="text-destructive" />
              </Button>
            </div>
          </div>
          <SectionFields
            v-model="list(field.key)[i]!"
            :fields="field.itemFields ?? []"
            :id-prefix="`${idPrefix}-${field.key}-${i}`"
          />
        </div>
      </div>
    </template>
  </div>
</template>
