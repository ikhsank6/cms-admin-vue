<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import SectionRenderer from '@/components/sections/SectionRenderer.vue'
import NotFound from '@/pages/NotFound.vue'
import { publicService } from '@/services/public'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSeo } from '@/composables/useSeo'
import { renderMarkdown } from '@/utils/markdown'
import { safeImageUrl } from '@/utils/url'

const props = defineProps<{ slug?: string }>()
const route = useRoute()
const slug = computed(() => props.slug ?? String(route.params.slug))
const { data: page, loading, notFound } = useAsyncData(slug, () => publicService.page(slug.value))
const body = computed(() => renderMarkdown(page.value?.content))
const hasHero = computed(() => page.value?.sections[0]?.type === 'HERO')

useSeo(() => ({
  title: page.value?.title,
  seo: page.value?.seo,
  image: page.value?.featuredImage,
  path: `/${slug.value}`,
}))
</script>

<template>
  <div v-if="loading" class="mx-auto max-w-6xl space-y-4 px-4 py-16">
    <Skeleton class="h-10 w-1/2" />
    <Skeleton class="h-64 w-full" />
  </div>
  <NotFound v-else-if="notFound || !page" />
  <article v-else :data-page="page.slug">
    <header v-if="!hasHero" class="bg-muted/40 border-b">
      <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h1
          class="font-display text-3xl font-medium tracking-tight md:text-5xl"
          data-testid="page-title"
        >
          {{ page.title }}
        </h1>
      </div>
    </header>
    <img
      v-if="page.featuredImage && !page.sections.length"
      :src="safeImageUrl(page.featuredImage)"
      :alt="page.title"
      class="mx-auto mt-10 max-w-4xl rounded-xl"
    />
    <div v-if="page.content" class="prose-content mx-auto max-w-3xl px-4 py-10" v-html="body" />
    <SectionRenderer :sections="page.sections" />
  </article>
</template>
