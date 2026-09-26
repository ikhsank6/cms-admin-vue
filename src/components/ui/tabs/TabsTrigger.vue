<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ value: string; class?: HTMLAttributes['class'] }>()
</script>

<template>
  <TabsTrigger
    :value="value"
    :class="
      cn(
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50',
        props.class,
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>
