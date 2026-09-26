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
  <SectionShell :title="content.title" :description="content.description" muted :index="index">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <component
        :is="item.url ? SmartLink : 'div'"
        v-for="(item, i) in content.items ?? []"
        :key="i"
        :to="item.url || undefined"
        data-reveal-item
        :style="{ transitionDelay: `${Number(i) * 80}ms` }"
        :class="[
          'group border-border bg-background relative overflow-hidden rounded-2xl border p-7 transition-colors hover:border-foreground/30',
          i === 0 && 'sm:col-span-2 sm:row-span-1 lg:col-span-2 lg:row-span-2',
        ]"
      >
        <span
          class="font-display text-foreground/[0.06] pointer-events-none absolute -top-3 -right-1 text-8xl leading-none font-medium select-none"
          aria-hidden="true"
        >
          {{ String(Number(i) + 1).padStart(2, '0') }}
        </span>
        <div class="relative">
          <div
            class="bg-brand/10 text-brand mb-5 inline-flex size-11 items-center justify-center rounded-xl"
          >
            <component :is="icons[item.icon as keyof typeof icons] ?? Briefcase" class="size-5" />
          </div>
          <h3 class="text-lg font-semibold">{{ item.title }}</h3>
          <p v-if="item.description" class="text-muted-foreground mt-2 text-sm">
            {{ item.description }}
          </p>
          <span
            v-if="item.url"
            class="text-brand mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
          >
            Selengkapnya
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
      </component>
    </div>
  </SectionShell>
</template>
