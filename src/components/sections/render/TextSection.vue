<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { computed } from 'vue'
import SectionShell from '@/components/public/SectionShell.vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<SectionContentProps>()
const html = computed(() => renderMarkdown(props.content.body))
</script>

<template>
  <SectionShell :title="content.title">
    <div
      :class="['prose-content mx-auto max-w-3xl', content.align === 'center' && 'text-center']"
      v-html="html"
    />
  </SectionShell>
</template>
