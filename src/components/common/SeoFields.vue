<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/select'
import FormField from './FormField.vue'
import ImageField from './ImageField.vue'
import type { SeoMetadata } from '@/types'

const props = defineProps<{ fallbackTitle?: string; fallbackDescription?: string; path?: string }>()
const seo = defineModel<SeoMetadata>({ required: true })

const previewTitle = computed(() => seo.value.title || props.fallbackTitle || 'Judul halaman')
const previewDesc = computed(
  () => seo.value.description || props.fallbackDescription || 'Deskripsi meta akan tampil di sini.',
)
</script>

<template>
  <div class="grid gap-4">
    <div class="bg-muted/40 rounded-lg border p-4">
      <p class="text-muted-foreground mb-1 text-xs">Pratinjau hasil pencarian</p>
      <p class="truncate text-sm text-emerald-700 dark:text-emerald-400">{{ path ?? '/' }}</p>
      <p class="truncate text-lg text-blue-700 dark:text-blue-400">{{ previewTitle }}</p>
      <p class="text-muted-foreground line-clamp-2 text-sm">{{ previewDesc }}</p>
    </div>
    <FormField label="SEO Title" for="seo-title" :hint="`${(seo.title ?? '').length}/60 karakter`">
      <Input id="seo-title" v-model="seo.title" maxlength="70" />
    </FormField>
    <FormField
      label="Meta Description"
      for="seo-desc"
      :hint="`${(seo.description ?? '').length}/160 karakter`"
    >
      <Textarea id="seo-desc" v-model="seo.description" rows="3" maxlength="200" />
    </FormField>
    <div class="grid gap-4 md:grid-cols-2">
      <FormField label="Meta Keywords" for="seo-keywords" hint="Pisahkan dengan koma">
        <Input id="seo-keywords" v-model="seo.keywords" />
      </FormField>
      <FormField label="Robots" for="seo-robots">
        <NativeSelect id="seo-robots" v-model="seo.robots">
          <option :value="null">index, follow (default)</option>
          <option value="noindex, follow">noindex, follow</option>
          <option value="index, nofollow">index, nofollow</option>
          <option value="noindex, nofollow">noindex, nofollow</option>
        </NativeSelect>
      </FormField>
    </div>
    <FormField label="Canonical URL" for="seo-canonical">
      <Input id="seo-canonical" v-model="seo.canonicalUrl" type="url" placeholder="https://" />
    </FormField>
    <div class="grid gap-4 md:grid-cols-2">
      <FormField label="OG Title" for="seo-og-title">
        <Input id="seo-og-title" v-model="seo.ogTitle" />
      </FormField>
      <FormField label="OG Description" for="seo-og-desc">
        <Input id="seo-og-desc" v-model="seo.ogDescription" />
      </FormField>
    </div>
    <FormField label="OG Image">
      <ImageField v-model="seo.ogImage" folder="seo" />
    </FormField>
  </div>
</template>
