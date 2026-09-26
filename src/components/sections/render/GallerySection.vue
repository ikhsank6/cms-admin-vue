<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import SectionShell from '@/components/public/SectionShell.vue'
import { safeImageUrl } from '@/utils/url'

defineProps<SectionContentProps>()
const active = ref<string | null>(null)

// Varied spans give the grid a bento feel instead of a uniform photo wall.
const spanClass = (i: number) => (i % 5 === 0 ? 'sm:col-span-2 sm:row-span-2' : '')
</script>

<template>
  <SectionShell :title="content.title" :index="index">
    <div
      class="grid auto-rows-[140px] grid-cols-2 gap-3 sm:auto-rows-[160px] sm:grid-cols-3 md:auto-rows-[180px]"
    >
      <button
        v-for="(src, i) in content.images ?? []"
        :key="i"
        type="button"
        data-reveal-item
        :style="{ transitionDelay: `${Number(i) * 60}ms` }"
        :class="['bg-muted overflow-hidden rounded-xl', spanClass(Number(i))]"
        @click="active = src"
      >
        <img
          :src="safeImageUrl(src)"
          :alt="`${content.title ?? 'Galeri'} ${Number(i) + 1}`"
          loading="lazy"
          class="size-full object-cover transition duration-300 hover:scale-105"
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
