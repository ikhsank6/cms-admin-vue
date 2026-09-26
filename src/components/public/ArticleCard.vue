<script setup lang="ts">
import type { Article } from '@/types'
import { formatDate } from '@/utils/format'
import { safeImageUrl } from '@/utils/url'

defineProps<{ article: Article }>()
</script>

<template>
  <article
    class="group bg-card flex flex-col overflow-hidden rounded-xl border transition hover:shadow-md"
    data-testid="article-card"
  >
    <RouterLink :to="`/news/${article.slug}`" class="bg-muted block aspect-[16/9] overflow-hidden">
      <img
        v-if="article.featuredImage"
        :src="safeImageUrl(article.featuredImage)"
        :alt="article.title"
        loading="lazy"
        decoding="async"
        class="size-full object-cover transition duration-300 group-hover:scale-105"
      />
    </RouterLink>
    <div class="flex flex-1 flex-col gap-2 p-5">
      <div class="text-muted-foreground flex items-center gap-2 text-xs">
        <RouterLink
          v-if="article.category"
          :to="{ path: '/news', query: { category: article.category.slug } }"
          class="text-brand font-medium"
        >
          {{ article.category.name }}
        </RouterLink>
        <span v-if="article.category">·</span>
        <time :datetime="article.publishedAt ?? undefined">{{
          formatDate(article.publishedAt)
        }}</time>
      </div>
      <h3 class="text-lg leading-snug font-semibold">
        <RouterLink :to="`/news/${article.slug}`" class="hover:text-brand">{{
          article.title
        }}</RouterLink>
      </h3>
      <p v-if="article.excerpt" class="text-muted-foreground line-clamp-3 text-sm">
        {{ article.excerpt }}
      </p>
    </div>
  </article>
</template>
