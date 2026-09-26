<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { ChevronDown } from 'lucide-vue-next'
import SectionShell from '@/components/public/SectionShell.vue'

defineProps<SectionContentProps>()
</script>

<template>
  <SectionShell :title="content.title">
    <div class="mx-auto max-w-3xl divide-y rounded-xl border">
      <details v-for="(item, i) in content.items ?? []" :key="i" class="group p-5">
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-4 font-medium"
        >
          {{ item.question }}
          <ChevronDown class="size-4 shrink-0 transition group-open:rotate-180" />
        </summary>
        <p class="text-muted-foreground mt-3 text-sm whitespace-pre-line">{{ item.answer }}</p>
      </details>
    </div>
  </SectionShell>
</template>
