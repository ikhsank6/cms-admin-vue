<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, ChevronDown, Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import EmptyState from '@/components/common/EmptyState.vue'
import SectionFields from './SectionFields.vue'
import { SECTION_DEFINITIONS, SECTION_TYPES, createSection, sectionKey } from './registry'
import { cn } from '@/lib/utils'
import type { PageSection, SectionType } from '@/types'
import { deepClone } from '@/utils/clone'

const sections = defineModel<PageSection[]>({ required: true })
const addOpen = ref(false)
const expanded = ref<string | null>(null)

const ordered = computed(() => sections.value)
const keyOf = (s: PageSection) => (s.key ??= s.id ? `id${s.id}` : sectionKey())

function reindex() {
  sections.value.forEach((s, i) => (s.sortOrder = i + 1))
}

function add(type: SectionType) {
  const section = createSection(type, sections.value.length + 1)
  sections.value.push(section)
  expanded.value = section.key!
  addOpen.value = false
}

function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= sections.value.length) return
  const arr = sections.value
  ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  reindex()
}

function duplicate(i: number) {
  const copy: PageSection = { ...deepClone(sections.value[i]), id: undefined, key: sectionKey() }
  sections.value.splice(i + 1, 0, copy)
  reindex()
}

function remove(i: number) {
  sections.value.splice(i, 1)
  reindex()
}

function summary(s: PageSection) {
  const c = s.content as Record<string, unknown>
  return (c.title as string) || (c.caption as string) || ''
}
</script>

<template>
  <div class="grid gap-3">
    <EmptyState
      v-if="!sections.length"
      title="Belum ada section"
      description="Susun halaman secara modular dengan menambahkan section seperti Hero, Text, Gallery, atau CTA."
    />
    <div
      v-for="(section, i) in ordered"
      :key="keyOf(section)"
      :class="cn('rounded-lg border bg-card', !section.isActive && 'opacity-60')"
      data-testid="section-item"
    >
      <div class="flex items-center gap-2 p-3">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-3 text-left"
          @click="expanded = expanded === keyOf(section) ? null : keyOf(section)"
        >
          <component
            :is="SECTION_DEFINITIONS[section.type]?.icon"
            class="text-muted-foreground size-5 shrink-0"
          />
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{
                SECTION_DEFINITIONS[section.type]?.label ?? section.type
              }}</span>
              <Badge variant="outline" class="font-mono">#{{ i + 1 }}</Badge>
              <Badge v-if="!section.isActive" variant="secondary">Nonaktif</Badge>
            </div>
            <p class="text-muted-foreground truncate text-xs">{{ summary(section) }}</p>
          </div>
          <ChevronDown
            :class="
              cn(
                'ml-auto size-4 shrink-0 transition-transform',
                expanded === keyOf(section) && 'rotate-180',
              )
            "
          />
        </button>
        <div class="flex shrink-0 gap-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Naik"
            :disabled="i === 0"
            @click="move(i, -1)"
            ><ArrowUp
          /></Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Turun"
            :disabled="i === sections.length - 1"
            @click="move(i, 1)"
            ><ArrowDown
          /></Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            :title="section.isActive ? 'Nonaktifkan' : 'Aktifkan'"
            @click="section.isActive = !section.isActive"
          >
            <Eye v-if="section.isActive" /><EyeOff v-else />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Duplikat"
            @click="duplicate(i)"
            ><Copy
          /></Button>
          <Button type="button" size="icon-sm" variant="ghost" title="Hapus" @click="remove(i)"
            ><Trash2 class="text-destructive"
          /></Button>
        </div>
      </div>
      <div v-if="expanded === keyOf(section)" class="border-t p-4">
        <SectionFields
          v-model="section.content"
          :fields="SECTION_DEFINITIONS[section.type]?.fields ?? []"
          :id-prefix="`sec-${keyOf(section)}`"
        />
      </div>
    </div>

    <Button
      type="button"
      variant="outline"
      class="border-dashed"
      data-testid="add-section"
      @click="addOpen = true"
    >
      <Plus /> Tambah Section
    </Button>

    <Dialog
      v-model:open="addOpen"
      title="Tambah Section"
      description="Pilih jenis section"
      class="sm:max-w-2xl"
    >
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="type in SECTION_TYPES"
          :key="type"
          type="button"
          :data-testid="`section-type-${type}`"
          class="hover:border-brand hover:bg-brand/5 flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition"
          @click="add(type)"
        >
          <component :is="SECTION_DEFINITIONS[type].icon" class="text-brand size-5" />
          <span class="text-sm font-medium">{{ SECTION_DEFINITIONS[type].label }}</span>
          <span class="text-muted-foreground text-xs">{{
            SECTION_DEFINITIONS[type].description
          }}</span>
        </button>
      </div>
    </Dialog>
  </div>
</template>
