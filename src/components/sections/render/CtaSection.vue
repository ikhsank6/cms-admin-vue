<script setup lang="ts">
import { ref } from 'vue'
import type { SectionContentProps } from '../types'
import { Button } from '@/components/ui/button'
import SmartLink from '@/components/common/SmartLink.vue'
import { useRevealOnScroll } from '@/composables/useRevealOnScroll'

defineProps<SectionContentProps>()
const root = ref<HTMLElement | null>(null)
useRevealOnScroll(root)
</script>

<template>
  <section
    ref="root"
    data-reveal
    class="bg-foreground text-background relative overflow-hidden py-24 md:py-32"
  >
    <span
      class="font-display pointer-events-none absolute -top-10 left-4 text-[14rem] leading-none font-medium text-white/[0.06] select-none sm:left-10"
      aria-hidden="true"
    >
      “
    </span>
    <div class="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
      <h2 class="font-display text-3xl leading-[1.15] font-medium tracking-tight md:text-5xl">
        {{ content.title }}
      </h2>
      <p v-if="content.description" class="mt-6 text-lg text-white/70">{{ content.description }}</p>
      <Button
        v-if="content.buttonLabel && content.buttonUrl"
        as-child
        size="lg"
        variant="secondary"
        class="mt-9 rounded-full px-7"
      >
        <SmartLink :to="content.buttonUrl">{{ content.buttonLabel }}</SmartLink>
      </Button>
    </div>
  </section>
</template>
