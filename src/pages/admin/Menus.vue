<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { z } from 'zod'
import { Pencil, Plus, Save, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/common/PageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MenuTree from '@/components/admin/MenuTree.vue'
import { articleService, menuService, pageService } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { safeUrl } from '@/utils/url'
import type { Menu, MenuItem } from '@/types'
import { deepClone } from '@/utils/clone'

const auth = useAuthStore()
const { confirm } = useConfirm()
const { errors, submitting, validate, submit } = useFormSubmit()

const menus = ref<Menu[]>([])
const activeId = ref<number | null>(null)
const items = ref<MenuItem[]>([])
const loading = ref(true)
const pages = ref<{ title: string; slug: string }[]>([])
const articles = ref<{ title: string; slug: string }[]>([])

const active = computed(() => menus.value.find((m) => m.id === activeId.value) ?? null)
const canUpdate = computed(() => auth.can('menu.update'))

async function load() {
  loading.value = true
  try {
    menus.value = (await menuService.list({ perPage: 100 })).data
    if (!active.value && menus.value.length) select(menus.value[0]!)
    else if (active.value) select(active.value)
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    loading.value = false
  }
}

function select(m: Menu) {
  activeId.value = m.id
  items.value = deepClone(m.items)
}

onMounted(async () => {
  load()
  const [p, a] = await Promise.all([
    auth.can('page.view') ? pageService.list({ perPage: 100 }).catch(() => null) : null,
    auth.can('article.view')
      ? articleService.list({ perPage: 100, status: 'PUBLISHED' }).catch(() => null)
      : null,
  ])
  pages.value = p?.data.map((x) => ({ title: x.title, slug: x.slug })) ?? []
  articles.value = a?.data.map((x) => ({ title: x.title, slug: x.slug })) ?? []
})

function collectErrors(list: MenuItem[]): string | null {
  for (const i of list) {
    if (!i.title.trim()) return 'Setiap item wajib memiliki judul'
    if (!i.url.trim() || safeUrl(i.url, '') === '') return `URL item "${i.title}" tidak valid`
    const nested = collectErrors(i.children ?? [])
    if (nested) return nested
  }
  return null
}

async function saveItems() {
  if (!active.value) return
  const err = collectErrors(items.value)
  if (err) return toast.error(err)
  const saved = await submit(
    () => menuService.saveItems(active.value!.id, items.value),
    'Menu disimpan',
  )
  if (saved) {
    menus.value = menus.value.map((m) => (m.id === saved.id ? saved : m))
    select(saved)
  }
}

// ----- menu create/edit
const dialogOpen = ref(false)
const editing = ref<Menu | null>(null)
const form = reactive({ name: '', location: '' })
const schema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  location: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Gunakan huruf kecil/angka/tanda hubung, mis. header'),
})
function openForm(m?: Menu) {
  editing.value = m ?? null
  Object.assign(form, { name: m?.name ?? '', location: m?.location ?? '' })
  errors.value = {}
  dialogOpen.value = true
}
async function saveMenu() {
  if (!validate(schema, form)) return
  const saved = await submit(
    () => (editing.value ? menuService.update(editing.value.id, form) : menuService.create(form)),
    'Menu disimpan',
  )
  if (!saved) return
  dialogOpen.value = false
  activeId.value = saved.id
  load()
}
async function removeMenu(m: Menu) {
  if (
    !(await confirm({ title: `Hapus menu "${m.name}"?`, confirmLabel: 'Hapus', destructive: true }))
  )
    return
  try {
    await menuService.remove(m.id)
    activeId.value = null
    load()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Menu Management"
      description="Atur navigasi bertingkat untuk header dan footer website."
    >
      <template #actions>
        <Button v-if="auth.can('menu.create')" variant="outline" @click="openForm()"
          ><Plus /> Menu Baru</Button
        >
      </template>
    </PageHeader>
    <div v-if="loading && !menus.length" class="grid gap-4 md:grid-cols-[240px_1fr]">
      <Skeleton class="h-40" /><Skeleton class="h-80" />
    </div>
    <EmptyState v-else-if="!menus.length" title="Belum ada menu" />
    <div v-else class="grid gap-6 md:grid-cols-[240px_1fr]">
      <Card class="h-fit gap-0 py-2">
        <button
          v-for="m in menus"
          :key="m.id"
          type="button"
          :class="
            cn(
              'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm',
              m.id === activeId ? 'bg-accent font-medium' : 'hover:bg-accent/50',
            )
          "
          @click="select(m)"
        >
          <span>{{ m.name }}</span>
          <span class="text-muted-foreground font-mono text-xs">{{ m.location }}</span>
        </button>
      </Card>
      <Card v-if="active" class="gap-4">
        <CardHeader class="flex flex-row items-center justify-between gap-2">
          <CardTitle
            >{{ active.name }}
            <span class="text-muted-foreground font-mono text-sm font-normal"
              >({{ active.location }})</span
            ></CardTitle
          >
          <div class="flex gap-1">
            <Button
              v-if="canUpdate"
              variant="ghost"
              size="icon-sm"
              title="Edit menu"
              @click="openForm(active)"
              ><Pencil
            /></Button>
            <Button
              v-if="auth.can('menu.delete')"
              variant="ghost"
              size="icon-sm"
              title="Hapus menu"
              @click="removeMenu(active)"
              ><Trash2 class="text-destructive"
            /></Button>
          </div>
        </CardHeader>
        <CardContent class="grid gap-4">
          <fieldset :disabled="!canUpdate" class="contents">
            <MenuTree
              v-model="items"
              :depth="1"
              :max-depth="3"
              :pages="pages"
              :articles="articles"
            />
          </fieldset>
          <div v-if="canUpdate" class="flex justify-end">
            <Button :loading="submitting" @click="saveItems"><Save /> Simpan Menu</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="dialogOpen" :title="editing ? 'Edit Menu' : 'Menu Baru'">
      <form id="menu-form" class="grid gap-4" @submit.prevent="saveMenu">
        <FormField label="Nama" for="m-name" :error="errors.name" required
          ><Input id="m-name" v-model="form.name"
        /></FormField>
        <FormField
          label="Lokasi"
          for="m-loc"
          :error="errors.location"
          hint="Mis. header, footer"
          required
          ><Input id="m-loc" v-model="form.location" class="font-mono"
        /></FormField>
      </form>
      <template #footer>
        <Button variant="outline" @click="dialogOpen = false">Batal</Button>
        <Button type="submit" form="menu-form" :loading="submitting">Simpan</Button>
      </template>
    </Dialog>
  </div>
</template>
