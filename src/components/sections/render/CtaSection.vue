<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { Button } from '@/components/ui/button'
import SmartLink from '@/components/common/SmartLink.vue'

defineProps<SectionContentProps>()
</script>

<template>
  <section class="py-14 md:py-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div
        class="bg-brand text-brand-foreground flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center"
      >
        <h2 class="text-2xl font-bold md:text-3xl">{{ content.title }}</h2>
        <p v-if="content.description" class="max-w-xl opacity-90">{{ content.description }}</p>
        <Button
          v-if="content.buttonLabel && content.buttonUrl"
          as-child
          size="lg"
          variant="secondary"
        >
          <SmartLink :to="content.buttonUrl">{{ content.buttonLabel }}</SmartLink>
        </Button>
      </div>
    </div>
  </section>
</template>
