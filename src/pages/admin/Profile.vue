<script setup lang="ts">
import { reactive } from 'vue'
import { z } from 'zod'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/common/PageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import ImageField from '@/components/common/ImageField.vue'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { passwordSchema } from '@/utils/validation'

const auth = useAuthStore()
const profile = reactive({
  name: auth.user?.name ?? '',
  email: auth.user?.email ?? '',
  avatar: auth.user?.avatar ?? null,
})
const pwd = reactive({ currentPassword: '', newPassword: '', confirm: '' })
const profileForm = useFormSubmit()
const passwordForm = useFormSubmit()

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.email('Email tidak valid'),
})
const passwordSchemaFull = z
  .object({
    currentPassword: z.string().min(1, 'Wajib diisi'),
    newPassword: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirm'],
  })

async function saveProfile() {
  if (!profileForm.validate(profileSchema, profile)) return
  const user = await profileForm.submit(
    () => authService.updateProfile(profile),
    'Profil diperbarui',
  )
  if (user) auth.setUser(user)
}

async function savePassword() {
  if (!passwordForm.validate(passwordSchemaFull, pwd)) return
  const ok = await passwordForm.submit(async () => {
    await authService.changePassword({
      currentPassword: pwd.currentPassword,
      newPassword: pwd.newPassword,
    })
    return true
  }, 'Password berhasil diubah')
  if (ok) Object.assign(pwd, { currentPassword: '', newPassword: '', confirm: '' })
}
</script>

<template>
  <div>
    <PageHeader title="Profil" description="Kelola informasi akun dan keamanan." />
    <div class="grid gap-6 lg:grid-cols-2">
      <Card class="gap-4">
        <CardHeader class="flex flex-row items-center gap-4">
          <Avatar :name="auth.user?.name" :src="profile.avatar" class="size-14 text-base" />
          <div>
            <CardTitle>{{ auth.user?.name }}</CardTitle>
            <div class="mt-1 flex gap-1">
              <Badge v-for="r in auth.user?.roles" :key="r.id" variant="outline">{{
                r.name
              }}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form class="grid gap-4" @submit.prevent="saveProfile">
            <FormField label="Nama" for="p-name" :error="profileForm.errors.value.name"
              ><Input id="p-name" v-model="profile.name"
            /></FormField>
            <FormField label="Email" for="p-email" :error="profileForm.errors.value.email"
              ><Input id="p-email" v-model="profile.email" type="email"
            /></FormField>
            <FormField label="Foto Profil"
              ><ImageField v-model="profile.avatar" folder="avatars"
            /></FormField>
            <Button type="submit" class="w-fit" :loading="profileForm.submitting.value"
              >Simpan Profil</Button
            >
          </form>
        </CardContent>
      </Card>
      <Card class="h-fit gap-4">
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
          <CardDescription
            >Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.</CardDescription
          >
        </CardHeader>
        <CardContent>
          <form class="grid gap-4" @submit.prevent="savePassword">
            <FormField
              label="Password Saat Ini"
              for="c-pass"
              :error="passwordForm.errors.value.currentPassword"
            >
              <Input
                id="c-pass"
                v-model="pwd.currentPassword"
                type="password"
                autocomplete="current-password"
              />
            </FormField>
            <FormField
              label="Password Baru"
              for="n-pass"
              :error="passwordForm.errors.value.newPassword"
            >
              <Input
                id="n-pass"
                v-model="pwd.newPassword"
                type="password"
                autocomplete="new-password"
              />
            </FormField>
            <FormField
              label="Konfirmasi Password Baru"
              for="cf-pass"
              :error="passwordForm.errors.value.confirm"
            >
              <Input
                id="cf-pass"
                v-model="pwd.confirm"
                type="password"
                autocomplete="new-password"
              />
            </FormField>
            <Button type="submit" class="w-fit" :loading="passwordForm.submitting.value"
              >Ubah Password</Button
            >
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
