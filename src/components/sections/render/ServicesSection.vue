<script setup lang="ts">
import type { SectionContentProps } from '../types'
import {
  Briefcase,
  Database,
  FileCheck,
  Globe,
  Heart,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-vue-next'
import SectionShell from '@/components/public/SectionShell.vue'
import SmartLink from '@/components/common/SmartLink.vue'

defineProps<SectionContentProps>()
const icons = {
  'file-check': FileCheck,
  'message-square': MessageSquare,
  database: Database,
  shield: Shield,
  users: Users,
  globe: Globe,
  briefcase: Briefcase,
  heart: Heart,
} as const
</script>

<template>
  <SectionShell :title="content.title" :description="content.description">
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="(item, i) in content.items ?? []" :key="i" class="bg-card rounded-xl border p-6">
        <div
          class="bg-brand/10 text-brand mb-4 inline-flex size-11 items-center justify-center rounded-lg"
        >
          <component :is="icons[item.icon as keyof typeof icons] ?? Briefcase" class="size-5" />
        </div>
        <h3 class="font-semibold">{{ item.title }}</h3>
        <p v-if="item.description" class="text-muted-foreground mt-2 text-sm">
          {{ item.description }}
        </p>
        <SmartLink
          v-if="item.url"
          :to="item.url"
          class="text-brand mt-3 inline-block text-sm font-medium"
          >Selengkapnya →</SmartLink
        >
      </div>
    </div>
  </SectionShell>
</template>
