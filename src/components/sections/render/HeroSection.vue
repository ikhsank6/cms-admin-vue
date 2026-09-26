<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { Button } from '@/components/ui/button'
import SmartLink from '@/components/common/SmartLink.vue'
import { safeImageUrl } from '@/utils/url'

const props = withDefaults(defineProps<SectionContentProps & { nextId?: string }>(), {
  nextId: 'section-1',
})
</script>

<template>
  <section class="border-border relative overflow-hidden border-b">
    <!-- Faint corner grid — a quiet geometric mark instead of a gradient blob. -->
    <svg
      class="text-foreground/[0.05] pointer-events-none absolute -top-10 -right-10 hidden size-[420px] md:block"
      viewBox="0 0 420 420"
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 60H420M0 150H420M0 240H420M0 330H420" stroke="currentColor" />
      <path d="M60 0V420M150 0V420M240 0V420M330 0V420" stroke="currentColor" />
    </svg>

    <div
      class="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16"
    >
      <div>
        <div
          class="text-muted-foreground mb-6 flex items-center gap-3 font-mono text-xs tracking-[0.2em] uppercase"
        >
          <span class="bg-brand size-1.5 rounded-full" />
          Portal Resmi
        </div>
        <h1
          class="font-display max-w-xl text-[2.75rem] leading-[1.05] font-medium tracking-tight sm:text-6xl lg:text-[4rem]"
        >
          {{ content.title }}
        </h1>
        <p v-if="content.description" class="text-muted-foreground mt-6 max-w-md text-lg">
          {{ content.description }}
        </p>
        <div class="mt-9 flex flex-wrap items-center gap-5">
          <Button
            v-if="content.buttonLabel && content.buttonUrl"
            as-child
            size="lg"
            class="rounded-full px-7"
          >
            <SmartLink :to="content.buttonUrl">{{ content.buttonLabel }}</SmartLink>
          </Button>
          <a
            :href="`#${props.nextId}`"
            class="text-muted-foreground hover:text-foreground group hidden items-center gap-2 text-sm font-medium sm:inline-flex"
          >
            Jelajahi
            <span class="bg-border group-hover:bg-foreground h-px w-8 transition-colors" />
          </a>
        </div>
      </div>

      <div v-if="content.image" class="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
        <div class="border-border bg-muted overflow-hidden rounded-2xl border shadow-sm">
          <img
            :src="safeImageUrl(content.image)"
            alt=""
            fetchpriority="high"
            class="aspect-[4/5] w-full object-cover lg:aspect-[3/4]"
          />
        </div>
        <!-- Offset accent frame — the editorial "stacked card" treatment. -->
        <div
          class="border-brand/40 absolute -top-4 -right-4 -z-10 hidden size-full rounded-2xl border-2 md:block"
          aria-hidden="true"
        />
      </div>
    </div>
  </section>
</template>
