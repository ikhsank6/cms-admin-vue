<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from 'lucide-vue-next'

defineProps<{ title?: string; description?: string; icon?: Component }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
    <component :is="icon ?? Inbox" class="text-muted-foreground size-10" />
    <p class="font-medium">{{ title ?? 'Belum ada data' }}</p>
    <p v-if="description" class="text-muted-foreground max-w-sm text-sm">{{ description }}</p>
    <slot />
  </div>
</template>
