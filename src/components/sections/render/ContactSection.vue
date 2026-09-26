<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { Mail, MapPin, Phone } from 'lucide-vue-next'
import SectionShell from '@/components/public/SectionShell.vue'
import { useSiteStore } from '@/stores/site'

defineProps<SectionContentProps>()
const site = useSiteStore()
</script>

<template>
  <SectionShell :title="content.title" :description="content.description">
    <div class="grid gap-6 md:grid-cols-3">
      <a
        v-if="site.settings?.email"
        :href="`mailto:${site.settings.email}`"
        class="bg-card flex flex-col items-center gap-2 rounded-xl border p-6 text-center hover:shadow-md"
      >
        <Mail class="text-brand size-6" />
        <span class="font-medium">Email</span>
        <span class="text-muted-foreground text-sm">{{ site.settings.email }}</span>
      </a>
      <a
        v-if="site.settings?.phone"
        :href="`tel:${site.settings.phone.replace(/[^\d+]/g, '')}`"
        class="bg-card flex flex-col items-center gap-2 rounded-xl border p-6 text-center hover:shadow-md"
      >
        <Phone class="text-brand size-6" />
        <span class="font-medium">Telepon</span>
        <span class="text-muted-foreground text-sm">{{ site.settings.phone }}</span>
      </a>
      <a
        v-if="site.settings?.address"
        :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.settings.address)}`"
        target="_blank"
        rel="noopener noreferrer"
        class="bg-card flex flex-col items-center gap-2 rounded-xl border p-6 text-center hover:shadow-md"
      >
        <MapPin class="text-brand size-6" />
        <span class="font-medium">Alamat</span>
        <span class="text-muted-foreground text-sm">{{ site.settings.address }}</span>
      </a>
    </div>
  </SectionShell>
</template>
