<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { onMounted, ref } from 'vue'
import SectionShell from '@/components/public/SectionShell.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { publicService } from '@/services/public'
import { formatDate } from '@/utils/format'
import { safeImageUrl } from '@/utils/url'
import type { Article } from '@/types'

const props = defineProps<SectionContentProps & { articles?: Article[] }>()
const items = ref<Article[] | null>(null)

onMounted(async () => {
  const limit = Math.max(Number(props.content.limit) || 3, 2)
  if (props.articles && !props.content.category) {
    items.value = props.articles.slice(0, limit)
    return
  }
  try {
    const res = await publicService.articles({
      perPage: limit,
      category: props.content.category || undefined,
    })
    items.value = res.data
  } catch {
    items.value = []
  }
})
</script>

<template>
  <SectionShell :title="content.title" :index="index">
    <template v-if="items === null">
      <div class="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton class="aspect-[16/10] rounded-2xl" />
        <div class="space-y-4">
          <Skeleton v-for="i in 3" :key="i" class="h-20" />
        </div>
      </div>
    </template>
    <template v-else-if="items.length">
      <div class="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <!-- Lead story -->
        <RouterLink
          :to="`/news/${items[0]!.slug}`"
          data-reveal-item
          class="group block"
          data-testid="article-card"
        >
          <div class="bg-muted mb-5 overflow-hidden rounded-2xl">
            <img
              v-if="items[0]!.featuredImage"
              :src="safeImageUrl(items[0]!.featuredImage)"
              :alt="items[0]!.title"
              loading="lazy"
              class="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div class="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
            <span v-if="items[0]!.category" class="text-brand font-medium">{{
              items[0]!.category.name
            }}</span>
            <span v-if="items[0]!.category">·</span>
            <time>{{ formatDate(items[0]!.publishedAt) }}</time>
          </div>
          <h3
            class="font-display group-hover:text-brand text-2xl leading-snug font-medium transition-colors md:text-3xl"
          >
            {{ items[0]!.title }}
          </h3>
          <p v-if="items[0]!.excerpt" class="text-muted-foreground mt-3 line-clamp-2">
            {{ items[0]!.excerpt }}
          </p>
        </RouterLink>

        <!-- Compact list -->
        <div class="divide-border divide-y border-t lg:border-t-0 lg:border-l lg:pl-10">
          <RouterLink
            v-for="a in items.slice(1)"
            :key="a.id"
            :to="`/news/${a.slug}`"
            data-reveal-item
            data-testid="article-card"
            class="group flex gap-4 py-5 first:pt-0"
          >
            <div class="bg-muted size-16 shrink-0 overflow-hidden rounded-lg">
              <img
                v-if="a.featuredImage"
                :src="safeImageUrl(a.featuredImage)"
                :alt="a.title"
                loading="lazy"
                class="size-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div class="min-w-0">
              <time class="text-muted-foreground text-xs">{{ formatDate(a.publishedAt) }}</time>
              <h4
                class="group-hover:text-brand mt-1 line-clamp-2 text-sm leading-snug font-semibold transition-colors"
              >
                {{ a.title }}
              </h4>
            </div>
          </RouterLink>
        </div>
      </div>
      <div class="mt-12">
        <RouterLink to="/news" class="group inline-flex items-center gap-2 text-sm font-medium">
          Lihat semua berita
          <span class="transition-transform group-hover:translate-x-1">→</span>
        </RouterLink>
      </div>
    </template>
  </SectionShell>
</template>
