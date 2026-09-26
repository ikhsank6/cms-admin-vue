<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const model = defineModel<boolean | unknown[]>()
</script>

<template>
  <input
    v-model="model"
    type="checkbox"
    data-slot="checkbox"
    :class="
      cn(
        'border-input accent-primary size-4 shrink-0 cursor-pointer rounded-[4px] border',
        props.class,
      )
    "
  />
</template>
