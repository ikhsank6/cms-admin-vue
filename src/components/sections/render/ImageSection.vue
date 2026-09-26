<script setup lang="ts">
import type { SectionContentProps } from '../types'
import SectionShell from '@/components/public/SectionShell.vue'
import { safeImageUrl } from '@/utils/url'

defineProps<SectionContentProps>()
</script>

<template>
  <SectionShell>
    <figure v-if="content.image" class="mx-auto max-w-4xl">
      <img
        :src="safeImageUrl(content.image)"
        :alt="content.alt || content.caption || ''"
        loading="lazy"
        class="w-full rounded-xl"
      />
      <figcaption v-if="content.caption" class="text-muted-foreground mt-3 text-center text-sm">
        {{ content.caption }}
      </figcaption>
    </figure>
  </SectionShell>
</template>
