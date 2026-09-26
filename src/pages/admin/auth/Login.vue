<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FormField from '@/components/common/FormField.vue'
import { useAuthStore } from '@/stores/auth'
import { toApiError } from '@/services/api'

// Statically replaced by Vite so the demo hint is dropped from production bundles.
const isMockApi = import.meta.env.VITE_API_MOCK === 'true'
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errors = ref<Record<string, string>>({})
const serverError = ref(
  route.query.expired ? 'Sesi Anda telah berakhir. Silakan login kembali.' : '',
)
const loading = ref(false)

const schema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

async function onSubmit() {
  const parsed = schema.safeParse(form)
  errors.value = parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))
  if (!parsed.success) return
  loading.value = true
  serverError.value = ''
  try {
    await auth.login(form.email, form.password)
    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin')
        ? route.query.redirect
        : '/admin'
    router.replace(redirect)
  } catch (e) {
    serverError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-xl">Masuk ke CMS</CardTitle>
      <CardDescription>Gunakan akun administrator Anda.</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="grid gap-4" novalidate @submit.prevent="onSubmit">
        <p
          v-if="serverError"
          role="alert"
          class="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
          data-testid="login-error"
        >
          {{ serverError }}
        </p>
        <FormField label="Email" for="email" :error="errors.email">
          <Input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="username"
            placeholder="admin@example.com"
          />
        </FormField>
        <FormField label="Password" for="password" :error="errors.password">
          <Input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
          />
        </FormField>
        <div class="flex justify-end">
          <RouterLink
            to="/admin/forgot-password"
            class="text-muted-foreground hover:text-foreground text-sm"
            >Lupa password?</RouterLink
          >
        </div>
        <Button type="submit" class="w-full" :loading="loading">Login</Button>
        <p v-if="isMockApi" class="text-muted-foreground bg-muted rounded-md p-3 text-xs">
          Mode demo (mock API): <b>superadmin@cms.local</b>, <b>editor@cms.local</b>, atau
          <b>viewer@cms.local</b> dengan password <b>Password123!</b>
        </p>
      </form>
    </CardContent>
  </Card>
</template>
