<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { CalendarDays, Share2, UserRound } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ArticleCard from '@/components/public/ArticleCard.vue'
import NotFound from '@/pages/NotFound.vue'
import { publicService } from '@/services/public'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSeo } from '@/composables/useSeo'
import { renderMarkdown, toPlainText } from '@/utils/markdown'
import { formatDate } from '@/utils/format'
import { safeImageUrl } from '@/utils/url'
import { config } from '@/config/env'
import type { Article } from '@/types'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const {
  data: article,
  loading,
  notFound,
} = useAsyncData(slug, () => publicService.article(slug.value))
const html = computed(() => renderMarkdown(article.value?.content))
const related = ref<Article[]>([])

watch(article, async (a) => {
  related.value = []
  if (!a?.category) return
  const res = await publicService
    .articles({ category: a.category.slug, perPage: 4 })
    .catch(() => null)
  related.value = (res?.data ?? []).filter((r) => r.id !== a.id).slice(0, 3)
})

useSeo(() => ({
  title: article.value?.title,
  description: article.value?.excerpt ?? toPlainText(article.value?.content).slice(0, 160),
  image: article.value?.featuredImage,
  seo: article.value?.seo,
  type: 'article',
  path: `/news/${slug.value}`,
  publishedAt: article.value?.publishedAt,
}))

// Structured data for search engines.
useHead({
  script: () =>
    article.value
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              headline: article.value.title,
              datePublished: article.value.publishedAt,
              dateModified: article.value.updatedAt,
              author: article.value.author
                ? { '@type': 'Person', name: article.value.author.name }
                : undefined,
              image: article.value.featuredImage?.startsWith('http')
                ? [article.value.featuredImage]
                : undefined,
              mainEntityOfPage: `${config.siteUrl}/news/${article.value.slug}`,
            }),
          },
        ]
      : [],
})

async function share() {
  const url = window.location.href
  if (navigator.share) {
    await navigator.share({ title: article.value?.title, url }).catch(() => {})
  } else {
    await navigator.clipboard.writeText(url)
    toast.success('Tautan disalin')
  }
}
</script>

<template>
  <div v-if="loading" class="mx-auto max-w-3xl space-y-4 px-4 py-16">
    <Skeleton class="h-10 w-3/4" />
    <Skeleton class="aspect-video w-full" />
    <Skeleton class="h-40 w-full" />
  </div>
  <NotFound
    v-else-if="notFound || !article"
    message="Artikel tidak ditemukan atau belum dipublikasikan."
  />
  <article v-else class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <nav class="text-muted-foreground mb-6 text-sm" aria-label="Breadcrumb">
      <RouterLink to="/" class="hover:text-foreground">Beranda</RouterLink> /
      <RouterLink to="/news" class="hover:text-foreground">Berita</RouterLink>
      <template v-if="article.category">
        /
        <RouterLink
          :to="{ path: '/news', query: { category: article.category.slug } }"
          class="hover:text-foreground"
          >{{ article.category.name }}</RouterLink
        >
      </template>
    </nav>
    <h1
      class="text-3xl leading-tight font-bold tracking-tight md:text-4xl"
      data-testid="article-title"
    >
      {{ article.title }}
    </h1>
    <div class="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
      <span class="flex items-center gap-1.5"
        ><CalendarDays class="size-4" /><time :datetime="article.publishedAt ?? undefined">{{
          formatDate(article.publishedAt)
        }}</time></span
      >
      <span v-if="article.author" class="flex items-center gap-1.5"
        ><UserRound class="size-4" />{{ article.author.name }}</span
      >
      <button
        type="button"
        class="hover:text-foreground ml-auto flex items-center gap-1.5"
        @click="share"
      >
        <Share2 class="size-4" /> Bagikan
      </button>
    </div>
    <img
      v-if="article.featuredImage"
      :src="safeImageUrl(article.featuredImage)"
      :alt="article.title"
      fetchpriority="high"
      class="mt-8 aspect-video w-full rounded-xl object-cover"
    />
    <p v-if="article.excerpt" class="text-muted-foreground mt-8 text-lg">{{ article.excerpt }}</p>
    <div class="prose-content mt-6" v-html="html" />
    <div v-if="article.tags.length" class="mt-10 flex flex-wrap gap-2">
      <RouterLink
        v-for="t in article.tags"
        :key="t.id"
        :to="{ path: '/news', query: { q: t.name } }"
      >
        <Badge variant="secondary">#{{ t.name }}</Badge>
      </RouterLink>
    </div>
  </article>
  <section v-if="related.length" class="bg-muted/40 border-t py-12">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <h2 class="mb-6 text-xl font-semibold">Berita Terkait</h2>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ArticleCard v-for="a in related" :key="a.id" :article="a" />
      </div>
    </div>
  </section>
</template>
