<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { z } from 'zod'
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import PageHeader from '@/components/common/PageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import DataPagination from '@/components/common/DataPagination.vue'
import DataTable, { type DataTableColumn } from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { roleService, userService, type UserInput } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useResourceList } from '@/composables/useResourceList'
import { useConfirm } from '@/composables/useConfirm'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/format'
import { passwordSchema } from '@/utils/validation'
import type { Role, User } from '@/types'

const auth = useAuthStore()
const { confirm } = useConfirm()
const roles = ref<Role[]>([])
const { items, loading, page, meta, filters, reload } = useResourceList(
  (p) => userService.list(p),
  { search: '', role: '' },
)
const { errors, submitting, validate, submit } = useFormSubmit()

onMounted(async () => {
  roles.value = (
    await roleService.list({ perPage: 100 }).catch(() => ({ data: [] as Role[] }))
  ).data
})

const columns: DataTableColumn[] = [
  { key: 'user', label: 'User' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'lastLoginAt', label: 'Login Terakhir', hideBelow: 'md' },
  { key: 'actions', class: 'w-24 text-right' },
]

const open = ref(false)
const editing = ref<User | null>(null)
const form = reactive<UserInput>({ name: '', email: '', password: '', isActive: true, roleIds: [] })

const schema = computed(() =>
  z.object({
    name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
    email: z.email('Email tidak valid'),
    password: editing.value ? passwordSchema.or(z.literal('')) : passwordSchema,
    roleIds: z.array(z.number()).min(1, 'Pilih minimal satu role'),
  }),
)

function openForm(u?: User) {
  editing.value = u ?? null
  Object.assign(form, {
    name: u?.name ?? '',
    email: u?.email ?? '',
    password: '',
    isActive: u?.isActive ?? true,
    roleIds: u?.roles.map((r) => r.id) ?? [],
  })
  errors.value = {}
  open.value = true
}

async function save() {
  if (!validate(schema.value, form)) return
  const payload = { ...form, password: form.password || undefined }
  const ok = await submit(
    () =>
      editing.value ? userService.update(editing.value.id, payload) : userService.create(payload),
    'User disimpan',
  )
  if (ok) {
    open.value = false
    reload()
  }
}

async function remove(u: User) {
  if (
    !(await confirm({ title: `Hapus user ${u.name}?`, confirmLabel: 'Hapus', destructive: true }))
  )
    return
  try {
    await userService.remove(u.id)
    toast.success('User dihapus')
    reload()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <PageHeader title="Users" description="Kelola akun administrator dan editor.">
      <template #actions>
        <Button v-if="auth.can('user.create')" @click="openForm()"><Plus /> Tambah User</Button>
      </template>
    </PageHeader>
    <Card class="gap-0 py-0">
      <div class="flex flex-col gap-3 border-b p-4 sm:flex-row">
        <div class="relative flex-1">
          <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input v-model="filters.search" placeholder="Cari nama atau email…" class="pl-9" />
        </div>
        <NativeSelect v-model="filters.role" class="sm:w-48">
          <option value="">Semua role</option>
          <option v-for="r in roles" :key="r.id" :value="String(r.id)">{{ r.name }}</option>
        </NativeSelect>
      </div>
      <DataTable :columns="columns" :rows="items" :loading="loading" :row-key="(u) => u.id">
        <template #cell-user="{ row: u }">
          <div class="flex items-center gap-3">
            <Avatar :name="u.name" :src="u.avatar" />
            <div>
              <p class="font-medium">{{ u.name }}</p>
              <p class="text-muted-foreground text-xs">{{ u.email }}</p>
            </div>
          </div>
        </template>
        <template #cell-role="{ row: u }">
          <div class="flex flex-wrap gap-1">
            <Badge v-for="r in u.roles" :key="r.id" variant="outline">{{ r.name }}</Badge>
          </div>
        </template>
        <template #cell-status="{ row: u }">
          <Badge :variant="u.isActive ? 'success' : 'secondary'">{{
            u.isActive ? 'Aktif' : 'Nonaktif'
          }}</Badge>
        </template>
        <template #cell-lastLoginAt="{ row: u }">
          <span class="text-muted-foreground text-sm">{{ formatDateTime(u.lastLoginAt) }}</span>
        </template>
        <template #cell-actions="{ row: u }">
          <Button
            v-if="auth.can('user.update')"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit"
            @click="openForm(u)"
            ><Pencil
          /></Button>
          <Button
            v-if="auth.can('user.delete') && u.id !== auth.user?.id"
            variant="ghost"
            size="icon-sm"
            aria-label="Hapus"
            @click="remove(u)"
            ><Trash2 class="text-destructive"
          /></Button>
        </template>
      </DataTable>
      <EmptyState v-if="!loading && !items.length" title="User tidak ditemukan" />
      <div class="border-t px-4"><DataPagination v-model="page" :meta="meta" /></div>
    </Card>

    <Dialog v-model:open="open" :title="editing ? 'Edit User' : 'Tambah User'">
      <form id="user-form" class="grid gap-4" autocomplete="off" @submit.prevent="save">
        <FormField label="Nama" for="u-name" :error="errors.name" required
          ><Input id="u-name" v-model="form.name"
        /></FormField>
        <FormField label="Email" for="u-email" :error="errors.email" required
          ><Input id="u-email" v-model="form.email" type="email"
        /></FormField>
        <FormField
          label="Password"
          for="u-pass"
          :error="errors.password"
          :hint="
            editing
              ? 'Kosongkan jika tidak ingin mengubah password'
              : 'Minimal 8 karakter, huruf dan angka'
          "
          :required="!editing"
        >
          <Input id="u-pass" v-model="form.password" type="password" autocomplete="new-password" />
        </FormField>
        <FormField label="Role" :error="errors.roleIds" required>
          <div class="grid gap-2">
            <label v-for="r in roles" :key="r.id" class="flex items-center gap-2 text-sm">
              <Checkbox v-model="form.roleIds" :value="r.id" /> {{ r.name }}
              <span class="text-muted-foreground text-xs">— {{ r.description }}</span>
            </label>
          </div>
        </FormField>
        <label class="flex items-center gap-2 text-sm"
          ><Switch v-model="form.isActive" /> Akun aktif</label
        >
      </form>
      <template #footer>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button type="submit" form="user-form" :loading="submitting">Simpan</Button>
      </template>
    </Dialog>
  </div>
</template>
