<script setup lang="ts">
import { Label } from '@/components/ui/label'

defineProps<{
  label?: string
  for?: string
  error?: string | string[]
  hint?: string
  required?: boolean
}>()
</script>

<template>
  <div class="grid gap-2">
    <Label v-if="label" :for="$props.for">
      {{ label }}<span v-if="required" class="text-destructive">*</span>
    </Label>
    <slot />
    <p v-if="error" class="text-destructive text-xs">
      {{ Array.isArray(error) ? error[0] : error }}
    </p>
    <p v-else-if="hint" class="text-muted-foreground text-xs">{{ hint }}</p>
  </div>
</template>
