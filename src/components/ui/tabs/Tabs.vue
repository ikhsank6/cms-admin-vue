<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; defaultValue?: string }>()
const model = defineModel<string>()
</script>

<template>
  <TabsRoot
    v-model="model"
    :default-value="defaultValue"
    :class="cn('flex flex-col gap-2', props.class)"
  >
    <slot />
  </TabsRoot>
</template>
