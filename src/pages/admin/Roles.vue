<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { z } from 'zod'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PageHeader from '@/components/common/PageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import { roleService, type RoleInput } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useResourceList } from '@/composables/useResourceList'
import { useConfirm } from '@/composables/useConfirm'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { useAuthStore } from '@/stores/auth'
import {
  MODULE_LABELS,
  PERMISSION_MODULES,
  SUPER_PERMISSION,
  type PermissionModule,
} from '@/config/permissions'
import { slugify } from '@/utils/slug'
import { slugSchema } from '@/utils/validation'
import type { Role } from '@/types'

const auth = useAuthStore()
const { confirm } = useConfirm()
const { items, reload } = useResourceList((p) => roleService.list({ ...p, perPage: 100 }), {})
const { errors, submitting, validate, submit } = useFormSubmit()

const modules = Object.entries(PERMISSION_MODULES) as [PermissionModule, readonly string[]][]
const allActions = [...new Set(modules.flatMap(([, a]) => a))]

const open = ref(false)
const editing = ref<Role | null>(null)
const form = reactive<RoleInput>({ name: '', slug: '', description: '', permissions: [] })
const slugTouched = ref(false)
watch(
  () => form.name,
  (n) => {
    if (!slugTouched.value) form.slug = slugify(n)
  },
)

const schema = z.object({ name: z.string().trim().min(1, 'Nama wajib diisi'), slug: slugSchema })

function openForm(r?: Role) {
  editing.value = r ?? null
  Object.assign(form, {
    name: r?.name ?? '',
    slug: r?.slug ?? '',
    description: r?.description ?? '',
    permissions: [...(r?.permissions ?? [])],
  })
  slugTouched.value = !!r
  errors.value = {}
  open.value = true
}

function toggleModule(module: PermissionModule, checked: boolean) {
  const keys = PERMISSION_MODULES[module].map((a) => `${module}.${a}`)
  form.permissions = checked
    ? [...new Set([...form.permissions, ...keys])]
    : form.permissions.filter((p) => !keys.includes(p))
}
const moduleChecked = (m: PermissionModule) =>
  PERMISSION_MODULES[m].every((a) => form.permissions.includes(`${m}.${a}`))
const permissionCount = computed(() => form.permissions.length)

async function save() {
  if (!validate(schema, form)) return
  const ok = await submit(
    () => (editing.value ? roleService.update(editing.value.id, form) : roleService.create(form)),
    'Role disimpan',
  )
  if (ok) {
    open.value = false
    reload()
  }
}

async function remove(r: Role) {
  if (
    !(await confirm({ title: `Hapus role ${r.name}?`, confirmLabel: 'Hapus', destructive: true }))
  )
    return
  try {
    await roleService.remove(r.id)
    toast.success('Role dihapus')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <PageHeader title="Roles & Permissions" description="Atur hak akses berbasis peran (RBAC).">
      <template #actions>
        <Button v-if="auth.can('role.create')" @click="openForm()"><Plus /> Tambah Role</Button>
      </template>
    </PageHeader>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card v-for="r in items" :key="r.id" class="gap-3">
        <CardHeader>
          <CardTitle class="flex items-center gap-2"
            >{{ r.name }} <Lock v-if="r.isSystem" class="text-muted-foreground size-4"
          /></CardTitle>
          <CardDescription>{{ r.description || '—' }}</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3">
          <div class="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{{ r.usersCount ?? 0 }} user</Badge>
            <Badge variant="outline">{{
              r.permissions.includes(SUPER_PERMISSION)
                ? 'Semua izin'
                : `${r.permissions.length} izin`
            }}</Badge>
          </div>
          <div v-if="!r.isSystem" class="flex gap-1">
            <Button v-if="auth.can('role.update')" variant="outline" size="sm" @click="openForm(r)"
              ><Pencil /> Edit</Button
            >
            <Button v-if="auth.can('role.delete')" variant="ghost" size="sm" @click="remove(r)"
              ><Trash2 class="text-destructive" /> Hapus</Button
            >
          </div>
          <p v-else class="text-muted-foreground text-xs">Role sistem tidak dapat diubah.</p>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="open" :title="editing ? 'Edit Role' : 'Tambah Role'" class="sm:max-w-3xl">
      <form id="role-form" class="grid gap-4" @submit.prevent="save">
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama" for="r-name" :error="errors.name" required
            ><Input id="r-name" v-model="form.name"
          /></FormField>
          <FormField label="Slug" for="r-slug" :error="errors.slug" required
            ><Input id="r-slug" v-model="form.slug" class="font-mono" @input="slugTouched = true"
          /></FormField>
        </div>
        <FormField label="Deskripsi" for="r-desc"
          ><Textarea id="r-desc" v-model="form.description" rows="2"
        /></FormField>
        <div>
          <p class="mb-2 text-sm font-medium">
            Permissions
            <span class="text-muted-foreground font-normal">({{ permissionCount }} dipilih)</span>
          </p>
          <div class="overflow-x-auto rounded-md border">
            <table class="w-full text-sm">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">Modul</th>
                  <th
                    v-for="a in allActions"
                    :key="a"
                    class="px-2 py-2 text-center font-medium capitalize"
                  >
                    {{ a }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="[m, actions] in modules" :key="m" class="border-t">
                  <td class="px-3 py-2">
                    <label class="flex items-center gap-2">
                      <Checkbox
                        :model-value="moduleChecked(m)"
                        @update:model-value="toggleModule(m, !!$event)"
                      />
                      {{ MODULE_LABELS[m] }}
                    </label>
                  </td>
                  <td v-for="a in allActions" :key="a" class="px-2 py-2 text-center">
                    <Checkbox
                      v-if="actions.includes(a)"
                      v-model="form.permissions"
                      :value="`${m}.${a}`"
                      :aria-label="`${m}.${a}`"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </form>
      <template #footer>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button type="submit" form="role-form" :loading="submitting">Simpan</Button>
      </template>
    </Dialog>
  </div>
</template>
