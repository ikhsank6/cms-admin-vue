<script setup lang="ts">
import type { SectionContentProps } from '../types'
import SectionShell from '@/components/public/SectionShell.vue'
import SmartLink from '@/components/common/SmartLink.vue'
import { safeImageUrl } from '@/utils/url'

defineProps<SectionContentProps>()
</script>

<template>
  <SectionShell :title="content.title">
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <component
        :is="item.url ? SmartLink : 'div'"
        v-for="(item, i) in content.items ?? []"
        :key="i"
        :to="item.url || undefined"
        class="group bg-card block overflow-hidden rounded-xl border transition hover:shadow-md"
      >
        <div v-if="item.image" class="bg-muted aspect-[16/10] overflow-hidden">
          <img
            :src="safeImageUrl(item.image)"
            :alt="item.title"
            loading="lazy"
            class="size-full object-cover transition group-hover:scale-105"
          />
        </div>
        <div class="p-5">
          <h3 class="font-semibold">{{ item.title }}</h3>
          <p v-if="item.description" class="text-muted-foreground mt-2 text-sm">
            {{ item.description }}
          </p>
        </div>
      </component>
    </div>
  </SectionShell>
</template>
