<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { z } from 'zod'
import { Save } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/common/PageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import ImageField from '@/components/common/ImageField.vue'
import { settingsService } from '@/services/admin'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import type { SiteSettings } from '@/types'
import { deepClone } from '@/utils/clone'

const auth = useAuthStore()
const site = useSiteStore()
const loading = ref(true)
const canUpdate = computed(() => auth.can('setting.update'))
const { errors, submitting, validate, submit } = useFormSubmit()

const form = reactive<SiteSettings>({
  siteName: '',
  tagline: '',
  logo: null,
  favicon: null,
  email: '',
  phone: '',
  address: '',
  footerText: '',
  social: { facebook: '', instagram: '', youtube: '', tiktok: '', linkedin: '', x: '' },
  googleAnalyticsId: '',
  googleTagManagerId: '',
})

const url = z
  .string()
  .trim()
  .refine((v) => !v || /^https:\/\//i.test(v), 'Harus diawali https://')
  .nullish()
const schema = z.object({
  siteName: z.string().trim().min(1, 'Nama situs wajib diisi').max(100),
  email: z.union([z.literal(''), z.email('Email tidak valid')]).nullish(),
  social: z.object({
    facebook: url,
    instagram: url,
    youtube: url,
    tiktok: url,
    linkedin: url,
    x: url,
  }),
  googleAnalyticsId: z
    .string()
    .trim()
    .refine((v) => !v || /^G-[A-Z0-9]+$/i.test(v), 'Format: G-XXXXXXX')
    .nullish(),
  googleTagManagerId: z
    .string()
    .trim()
    .refine((v) => !v || /^GTM-[A-Z0-9]+$/i.test(v), 'Format: GTM-XXXXXX')
    .nullish(),
})

const socials = [
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['youtube', 'YouTube'],
  ['tiktok', 'TikTok'],
  ['linkedin', 'LinkedIn'],
  ['x', 'X (Twitter)'],
] as const

onMounted(async () => {
  try {
    const s = await settingsService.get()
    Object.assign(form, { ...s, social: { ...form.social, ...s.social } })
  } finally {
    loading.value = false
  }
})

async function save() {
  if (!validate(schema, form)) return
  const saved = await submit(() => settingsService.update(deepClone(form)), 'Pengaturan disimpan')
  if (saved) site.load(true)
}
</script>

<template>
  <div>
    <PageHeader
      title="Website Settings"
      description="Identitas, kontak, media sosial, dan integrasi website."
    >
      <template #actions>
        <Button v-if="canUpdate" :loading="submitting" @click="save"><Save /> Simpan</Button>
      </template>
    </PageHeader>
    <Skeleton v-if="loading" class="h-96" />
    <fieldset v-else :disabled="!canUpdate" class="grid gap-6 lg:grid-cols-2">
      <Card class="gap-4">
        <CardHeader><CardTitle>Identitas</CardTitle></CardHeader>
        <CardContent class="grid gap-4">
          <FormField label="Nama Situs" for="s-name" :error="errors.siteName" required
            ><Input id="s-name" v-model="form.siteName"
          /></FormField>
          <FormField label="Tagline" for="s-tag"
            ><Input id="s-tag" v-model="form.tagline"
          /></FormField>
          <FormField label="Logo"><ImageField v-model="form.logo" folder="settings" /></FormField>
          <FormField label="Favicon"
            ><ImageField v-model="form.favicon" folder="settings"
          /></FormField>
          <FormField label="Teks Footer" for="s-footer"
            ><Textarea id="s-footer" v-model="form.footerText" rows="2"
          /></FormField>
        </CardContent>
      </Card>
      <div class="grid content-start gap-6">
        <Card class="gap-4">
          <CardHeader><CardTitle>Kontak</CardTitle></CardHeader>
          <CardContent class="grid gap-4">
            <FormField label="Email" for="s-email" :error="errors.email"
              ><Input id="s-email" v-model="form.email" type="email"
            /></FormField>
            <FormField label="Telepon" for="s-phone"
              ><Input id="s-phone" v-model="form.phone"
            /></FormField>
            <FormField label="Alamat" for="s-address"
              ><Textarea id="s-address" v-model="form.address" rows="2"
            /></FormField>
          </CardContent>
        </Card>
        <Card class="gap-4">
          <CardHeader><CardTitle>Media Sosial</CardTitle></CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <FormField
              v-for="[key, label] in socials"
              :key="key"
              :label="label"
              :for="`s-${key}`"
              :error="errors[`social.${key}`]"
            >
              <Input :id="`s-${key}`" v-model="form.social[key]" placeholder="https://" />
            </FormField>
          </CardContent>
        </Card>
        <Card class="gap-4">
          <CardHeader>
            <CardTitle>Analytics (opsional)</CardTitle>
            <CardDescription>Script hanya dimuat di website publik.</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <FormField label="Google Analytics ID" for="s-ga" :error="errors.googleAnalyticsId"
              ><Input id="s-ga" v-model="form.googleAnalyticsId" placeholder="G-XXXXXXX"
            /></FormField>
            <FormField label="Google Tag Manager ID" for="s-gtm" :error="errors.googleTagManagerId"
              ><Input id="s-gtm" v-model="form.googleTagManagerId" placeholder="GTM-XXXXXX"
            /></FormField>
          </CardContent>
        </Card>
      </div>
    </fieldset>
  </div>
</template>
