<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { Button } from '@/components/ui/button'
import SmartLink from '@/components/common/SmartLink.vue'
import { safeImageUrl } from '@/utils/url'

defineProps<SectionContentProps>()
</script>

<template>
  <section
    class="relative isolate flex min-h-[60vh] items-center overflow-hidden bg-slate-900 text-white"
  >
    <img
      v-if="content.image"
      :src="safeImageUrl(content.image)"
      alt=""
      fetchpriority="high"
      class="absolute inset-0 -z-10 size-full object-cover opacity-60"
    />
    <div class="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/80 to-slate-950/20" />
    <div class="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <h1 class="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">{{ content.title }}</h1>
      <p v-if="content.description" class="mt-5 max-w-2xl text-lg text-white/85">
        {{ content.description }}
      </p>
      <Button
        v-if="content.buttonLabel && content.buttonUrl"
        as-child
        size="lg"
        variant="brand"
        class="mt-8"
      >
        <SmartLink :to="content.buttonUrl">{{ content.buttonLabel }}</SmartLink>
      </Button>
    </div>
  </section>
</template>
