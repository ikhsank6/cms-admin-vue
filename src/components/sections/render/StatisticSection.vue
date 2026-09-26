<script setup lang="ts">
import type { SectionContentProps } from '../types'
import SectionShell from '@/components/public/SectionShell.vue'

defineProps<SectionContentProps>()
</script>

<template>
  <SectionShell :title="content.title" :index="index">
    <dl
      class="divide-border border-border grid grid-cols-2 divide-x divide-y border md:grid-cols-4 md:divide-y-0"
    >
      <div
        v-for="(item, i) in content.items ?? []"
        :key="i"
        data-reveal-item
        class="flex flex-col justify-between gap-6 p-6 md:p-8"
        :style="{ transitionDelay: `${Number(i) * 80}ms` }"
      >
        <dt class="text-muted-foreground text-sm">{{ item.label }}</dt>
        <dd class="font-display text-4xl font-medium tracking-tight md:text-5xl">
          {{ item.value }}
        </dd>
      </div>
    </dl>
  </SectionShell>
</template>
