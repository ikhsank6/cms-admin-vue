<script setup lang="ts">
import { ArrowDown, ArrowUp, CornerDownRight, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { MenuItem } from '@/types'

defineOptions({ name: 'MenuTree' })
const props = defineProps<{
  depth: number
  maxDepth: number
  pages: { title: string; slug: string }[]
  articles: { title: string; slug: string }[]
}>()
const items = defineModel<MenuItem[]>({ required: true })

let seq = 0

function newItem(): MenuItem {
  return {
    key: `n${Date.now()}${seq++}`,
    title: '',
    url: '',
    linkType: 'URL',
    sortOrder: 0,
    target: '_self',
    isActive: true,
    children: [],
  }
}
function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= items.value.length) return
  const arr = items.value
  ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
}
function addChild(item: MenuItem) {
  item.children = [...(item.children ?? []), newItem()]
}
function onLinkPick(item: MenuItem, value: string) {
  if (!value) return
  item.url = value
  if (!item.title) {
    const list = item.linkType === 'PAGE' ? props.pages : props.articles
    item.title =
      list.find((x) => (item.linkType === 'PAGE' ? `/${x.slug}` : `/news/${x.slug}`) === value)
        ?.title ?? ''
  }
}
const pageUrl = (slug: string) => (slug === 'home' ? '/' : `/${slug}`)
</script>

<template>
  <ul class="grid gap-2">
    <li v-for="(item, i) in items" :key="item.id ?? item.key" class="grid gap-2">
      <div class="bg-card rounded-lg border p-3" data-testid="menu-item">
        <div class="grid gap-2 md:grid-cols-[1fr_120px_1.4fr_100px]">
          <Input v-model="item.title" placeholder="Judul" aria-label="Judul" />
          <NativeSelect v-model="item.linkType" aria-label="Jenis tautan">
            <option value="URL">URL</option>
            <option value="PAGE">Page</option>
            <option value="ARTICLE">Artikel</option>
          </NativeSelect>
          <NativeSelect
            v-if="item.linkType === 'PAGE'"
            :model-value="item.url"
            aria-label="Page"
            @update:model-value="onLinkPick(item, String($event))"
          >
            <option value="">— Pilih page —</option>
            <option v-for="p in pages" :key="p.slug" :value="pageUrl(p.slug)">{{ p.title }}</option>
          </NativeSelect>
          <NativeSelect
            v-else-if="item.linkType === 'ARTICLE'"
            :model-value="item.url"
            aria-label="Artikel"
            @update:model-value="onLinkPick(item, String($event))"
          >
            <option value="">— Pilih artikel —</option>
            <option v-for="a in articles" :key="a.slug" :value="`/news/${a.slug}`">
              {{ a.title }}
            </option>
          </NativeSelect>
          <Input v-else v-model="item.url" placeholder="/path atau https://…" aria-label="URL" />
          <NativeSelect v-model="item.target" aria-label="Target">
            <option value="_self">_self</option>
            <option value="_blank">_blank</option>
          </NativeSelect>
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-1">
          <label class="text-muted-foreground mr-auto flex items-center gap-2 text-xs"
            ><Switch v-model="item.isActive" /> Aktif</label
          >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Naik"
            :disabled="i === 0"
            @click="move(i, -1)"
            ><ArrowUp
          /></Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Turun"
            :disabled="i === items.length - 1"
            @click="move(i, 1)"
            ><ArrowDown
          /></Button>
          <Button
            v-if="depth < maxDepth"
            type="button"
            variant="ghost"
            size="sm"
            @click="addChild(item)"
            ><CornerDownRight /> Sub-menu</Button
          >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Hapus"
            @click="items.splice(i, 1)"
            ><Trash2 class="text-destructive"
          /></Button>
        </div>
      </div>
      <div v-if="item.children?.length" class="border-l-2 pl-4 md:ml-4">
        <MenuTree
          v-model="item.children"
          :depth="depth + 1"
          :max-depth="maxDepth"
          :pages="pages"
          :articles="articles"
        />
      </div>
    </li>
    <li v-if="depth === 1">
      <Button
        type="button"
        variant="outline"
        class="w-full border-dashed"
        data-testid="add-menu-item"
        @click="items.push(newItem())"
        ><Plus /> Tambah Item</Button
      >
    </li>
  </ul>
</template>
