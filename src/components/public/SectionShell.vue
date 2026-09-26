<script setup lang="ts">
defineProps<{
  title?: string | null
  description?: string | null
  muted?: boolean
  center?: boolean
}>()
</script>

<template>
  <section :class="['py-14 md:py-20', muted && 'bg-muted/40']">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div v-if="title || description" :class="['mb-10', center !== false && 'text-center']">
        <h2 v-if="title" class="text-2xl font-bold tracking-tight md:text-3xl">{{ title }}</h2>
        <p v-if="description" class="text-muted-foreground mx-auto mt-3 max-w-2xl">
          {{ description }}
        </p>
      </div>
      <slot />
    </div>
  </section>
</template>
