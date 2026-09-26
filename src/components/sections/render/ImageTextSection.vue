<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import SmartLink from '@/components/common/SmartLink.vue'
import SectionShell from '@/components/public/SectionShell.vue'
import { renderMarkdown } from '@/utils/markdown'
import { safeImageUrl } from '@/utils/url'

const props = defineProps<SectionContentProps>()
const html = computed(() => renderMarkdown(props.content.body))
</script>

<template>
  <SectionShell>
    <div class="grid items-center gap-10 md:grid-cols-2">
      <img
        v-if="content.image"
        :src="safeImageUrl(content.image)"
        :alt="content.title || ''"
        loading="lazy"
        :class="[
          'aspect-[4/3] w-full rounded-xl object-cover',
          content.imagePosition === 'left' ? 'md:order-first' : 'md:order-last',
        ]"
      />
      <div>
        <h2 v-if="content.title" class="mb-4 text-2xl font-bold tracking-tight md:text-3xl">
          {{ content.title }}
        </h2>
        <div class="prose-content" v-html="html" />
        <Button
          v-if="content.buttonLabel && content.buttonUrl"
          as-child
          class="mt-6"
          variant="brand"
        >
          <SmartLink :to="content.buttonUrl">{{ content.buttonLabel }}</SmartLink>
        </Button>
      </div>
    </div>
  </SectionShell>
</template>
