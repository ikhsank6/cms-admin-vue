<script setup lang="ts">
import type { SectionContentProps } from '../types'
import SectionShell from '@/components/public/SectionShell.vue'

defineProps<SectionContentProps>()
</script>

<template>
  <SectionShell :title="content.title" muted>
    <dl class="grid grid-cols-2 gap-6 md:grid-cols-4">
      <div
        v-for="(item, i) in content.items ?? []"
        :key="i"
        class="bg-background rounded-xl border p-6 text-center"
      >
        <dt class="text-muted-foreground text-sm">{{ item.label }}</dt>
        <dd class="text-brand mt-2 text-3xl font-bold md:text-4xl">{{ item.value }}</dd>
      </div>
    </dl>
  </SectionShell>
</template>
