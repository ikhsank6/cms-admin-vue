<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import type { ContentStatus } from '@/types'

const props = defineProps<{ status: ContentStatus }>()
const map = {
  PUBLISHED: { label: 'Published', variant: 'success' },
  DRAFT: { label: 'Draft', variant: 'warning' },
  ARCHIVED: { label: 'Archived', variant: 'secondary' },
} as const
const info = computed(() => map[props.status] ?? map.DRAFT)
</script>

<template>
  <Badge :variant="info.variant">{{ info.label }}</Badge>
</template>
