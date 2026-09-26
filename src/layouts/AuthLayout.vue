<script setup lang="ts">
import { LayoutTemplate } from 'lucide-vue-next'
</script>

<template>
  <div class="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6">
    <RouterLink to="/" class="flex items-center gap-2 font-semibold">
      <span
        class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md"
      >
        <LayoutTemplate class="size-4" />
      </span>
      CMS Portal
    </RouterLink>
    <div class="w-full max-w-sm">
      <RouterView />
    </div>
  </div>
</template>
