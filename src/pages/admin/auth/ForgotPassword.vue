<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FormField from '@/components/common/FormField.vue'
import { authService } from '@/services/auth'
import { useFormSubmit } from '@/composables/useFormSubmit'

const email = ref('')
const sent = ref(false)
const { submitting, submit, errors } = useFormSubmit()

async function onSubmit() {
  const ok = await submit(async () => {
    await authService.forgotPassword(email.value)
    return true
  })
  if (ok) sent.value = true
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-xl">Lupa Password</CardTitle>
      <CardDescription>Kami akan mengirim tautan reset password ke email Anda.</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="sent" class="grid gap-4 text-sm">
        <p>
          Jika email terdaftar, tautan reset password telah dikirim. Silakan periksa kotak masuk
          Anda.
        </p>
        <Button as-child variant="outline"
          ><RouterLink to="/admin/login">Kembali ke login</RouterLink></Button
        >
      </div>
      <form v-else class="grid gap-4" @submit.prevent="onSubmit">
        <FormField label="Email" for="email" :error="errors.email">
          <Input id="email" v-model="email" type="email" required />
        </FormField>
        <Button type="submit" :loading="submitting">Kirim tautan reset</Button>
        <RouterLink to="/admin/login" class="text-muted-foreground text-center text-sm"
          >Kembali ke login</RouterLink
        >
      </form>
    </CardContent>
  </Card>
</template>
