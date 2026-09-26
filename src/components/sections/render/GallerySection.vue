<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import SectionShell from '@/components/public/SectionShell.vue'
import { safeImageUrl } from '@/utils/url'

defineProps<SectionContentProps>()
const active = ref<string | null>(null)
</script>

<template>
  <SectionShell :title="content.title">
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
      <button
        v-for="(src, i) in content.images ?? []"
        :key="i"
        type="button"
        class="bg-muted aspect-[4/3] overflow-hidden rounded-lg"
        @click="active = src"
      >
        <img
          :src="safeImageUrl(src)"
          :alt="`${content.title ?? 'Galeri'} ${Number(i) + 1}`"
          loading="lazy"
          class="size-full object-cover transition hover:scale-105"
        />
      </button>
    </div>
    <Teleport to="body">
      <div
        v-if="active"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        @click="active = null"
      >
        <button type="button" class="absolute top-4 right-4 text-white" aria-label="Tutup">
          <X class="size-6" />
        </button>
        <img :src="safeImageUrl(active)" alt="" class="max-h-full max-w-full rounded-lg" />
      </div>
    </Teleport>
  </SectionShell>
</template>
