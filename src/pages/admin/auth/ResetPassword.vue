<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FormField from '@/components/common/FormField.vue'
import { authService } from '@/services/auth'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { passwordSchema } from '@/utils/validation'

const route = useRoute()
const router = useRouter()
const form = reactive({ password: '', confirm: '' })
const { submitting, submit, errors, validate } = useFormSubmit()
const token = String(route.query.token ?? '')

const schema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirm'],
  })

async function onSubmit() {
  if (!validate(schema, form)) return
  const ok = await submit(async () => {
    await authService.resetPassword({ token, password: form.password })
    return true
  }, 'Password berhasil direset. Silakan login.')
  if (ok) router.replace('/admin/login')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-xl">Reset Password</CardTitle>
      <CardDescription>Buat password baru untuk akun Anda.</CardDescription>
    </CardHeader>
    <CardContent>
      <p v-if="!token" class="text-destructive text-sm">
        Token reset tidak ditemukan. Gunakan tautan dari email.
      </p>
      <form v-else class="grid gap-4" @submit.prevent="onSubmit">
        <FormField
          label="Password Baru"
          for="password"
          :error="errors.password"
          hint="Minimal 8 karakter, kombinasi huruf dan angka"
        >
          <Input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
          />
        </FormField>
        <FormField label="Konfirmasi Password" for="confirm" :error="errors.confirm">
          <Input id="confirm" v-model="form.confirm" type="password" autocomplete="new-password" />
        </FormField>
        <Button type="submit" :loading="submitting">Simpan Password</Button>
      </form>
    </CardContent>
  </Card>
</template>
