<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ name?: string; src?: string | null; class?: HTMLAttributes['class'] }>()
const initials = computed(() =>
  (props.name ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join(''),
)
</script>

<template>
  <span
    :class="
      cn(
        'relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold',
        props.class,
      )
    "
  >
    <img v-if="src" :src="src" :alt="name" class="aspect-square size-full object-cover" />
    <span v-else>{{ initials }}</span>
  </span>
</template>
