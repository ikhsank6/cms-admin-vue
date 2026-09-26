<script setup lang="ts">
import { ref } from 'vue'
import { useRevealOnScroll } from '@/composables/useRevealOnScroll'

const props = defineProps<{
  title?: string | null
  description?: string | null
  muted?: boolean
  center?: boolean
  /** 1-based section position, shown as an "01" editorial kicker before the title. */
  index?: number
}>()

const root = ref<HTMLElement | null>(null)
useRevealOnScroll(root)

const kicker = props.index ? String(props.index).padStart(2, '0') : null
</script>

<template>
  <section ref="root" :class="['py-20 md:py-28', muted && 'bg-muted/40']">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div
        v-if="title || description"
        :class="['mb-12 md:mb-16', center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl']"
      >
        <div
          v-if="kicker"
          :class="[
            'text-muted-foreground/70 mb-4 flex items-center gap-3 font-mono text-xs tracking-[0.2em]',
            center && 'justify-center',
          ]"
        >
          <span>{{ kicker }}</span>
          <span class="bg-border h-px w-10" />
        </div>
        <h2
          v-if="title"
          class="font-display text-3xl leading-[1.1] font-medium tracking-tight md:text-4xl lg:text-[2.75rem]"
        >
          {{ title }}
        </h2>
        <p v-if="description" class="text-muted-foreground mt-4 text-base md:text-lg">
          {{ description }}
        </p>
      </div>
      <slot />
    </div>
  </section>
</template>
