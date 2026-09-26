<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import ArticleCard from '@/components/public/ArticleCard.vue'
import DataPagination from '@/components/common/DataPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { publicService } from '@/services/public'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSeo } from '@/composables/useSeo'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

const route = useRoute()
const router = useRouter()
const categories = ref<Category[]>([])
const search = ref(String(route.query.q ?? ''))

const category = computed(() => (route.query.category as string) || undefined)
const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (p) => router.push({ query: { ...route.query, page: p > 1 ? p : undefined } }),
})

const { data, loading } = useAsyncData(
  () => route.fullPath,
  () =>
    publicService.articles({
      page: page.value,
      perPage: 9,
      category: category.value,
      search: (route.query.q as string) || undefined,
    }),
)

onMounted(async () => {
  categories.value = await publicService.categories().catch(() => [])
})

const activeCategory = computed(() => categories.value.find((c) => c.slug === category.value))

function applySearch() {
  router.push({ query: { ...route.query, q: search.value || undefined, page: undefined } })
}

useSeo(() => ({
  title: activeCategory.value ? `Berita: ${activeCategory.value.name}` : 'Berita',
  description: 'Berita, pengumuman, dan informasi terbaru.',
  path: route.fullPath,
}))
</script>

<template>
  <div>
    <header class="bg-muted/40 border-b">
      <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h1 class="text-3xl font-bold tracking-tight md:text-5xl">
          {{ activeCategory?.name ?? 'Berita' }}
        </h1>
        <p class="text-muted-foreground mt-3">Berita, pengumuman, dan informasi terbaru.</p>
      </div>
    </header>
    <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-2">
          <RouterLink
            :to="{ query: { q: route.query.q } }"
            :class="
              cn(
                'rounded-full border px-4 py-1.5 text-sm',
                !category ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              )
            "
          >
            Semua
          </RouterLink>
          <RouterLink
            v-for="c in categories"
            :key="c.id"
            :to="{ query: { category: c.slug, q: route.query.q } }"
            :class="
              cn(
                'rounded-full border px-4 py-1.5 text-sm',
                category === c.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              )
            "
          >
            {{ c.name }}
          </RouterLink>
        </div>
        <form class="relative" role="search" @submit.prevent="applySearch">
          <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            v-model="search"
            type="search"
            placeholder="Cari berita…"
            class="h-10 w-full rounded-md border pr-3 pl-9 text-sm md:w-64"
          />
        </form>
      </div>

      <div v-if="loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="i in 6" :key="i" class="h-80 rounded-xl" />
      </div>
      <EmptyState
        v-else-if="!data?.data.length"
        title="Belum ada berita"
        description="Coba kategori atau kata kunci lain."
      />
      <template v-else>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="a in data.data" :key="a.id" :article="a" />
        </div>
        <DataPagination
          v-if="data.meta.totalPages > 1"
          v-model="page"
          :meta="data.meta"
          class="mt-8"
        />
      </template>
    </div>
  </div>
</template>
