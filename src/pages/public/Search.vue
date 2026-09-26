<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FileText, Newspaper, Search } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/common/EmptyState.vue'
import { publicService } from '@/services/public'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSeo } from '@/composables/useSeo'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const q = computed(() => String(route.query.q ?? ''))
const input = ref(q.value)
watch(q, (v) => (input.value = v))

const { data: results, loading } = useAsyncData(q, () =>
  q.value.length >= 2 ? publicService.search(q.value) : Promise.resolve([]),
)

useSeo(() => ({
  title: q.value ? `Pencarian: ${q.value}` : 'Pencarian',
  seo: { robots: 'noindex, follow' },
}))
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <h1 class="font-display text-3xl font-medium">
      Pencarian/h1>
      <form
        class="relative mt-6"
        role="search"
        @submit.prevent="router.push({ query: { q: input } })"
      >
        <Search class="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2" />
        <input
          v-model="input"
          type="search"
          autofocus
          placeholder="Ketik minimal 2 karakter…"
          class="h-12 w-full rounded-lg border pr-4 pl-12 outline-none focus:ring-2 focus:ring-ring/50"
        />
      </form>
      <div class="mt-8">
        <div v-if="loading" class="space-y-3">
          <Skeleton v-for="i in 3" :key="i" class="h-20" />
        </div>
        <EmptyState
          v-else-if="q && !results?.length"
          title="Tidak ada hasil"
          :description="`Tidak ditemukan konten untuk “${q}”.`"
        />
        <ul v-else class="divide-y">
          <li v-for="r in results ?? []" :key="r.url" class="py-4">
            <RouterLink :to="r.url" class="group flex gap-3">
              <component
                :is="r.type === 'article' ? Newspaper : FileText"
                class="text-muted-foreground mt-1 size-5 shrink-0"
              />
              <div>
                <p class="group-hover:text-brand font-medium">{{ r.title }}</p>
                <p v-if="r.excerpt" class="text-muted-foreground line-clamp-2 text-sm">
                  {{ r.excerpt }}
                </p>
                <p class="text-muted-foreground mt-1 text-xs">
                  {{ r.type === 'article' ? 'Berita' : 'Halaman' }} ·
                  {{ formatDate(r.publishedAt) }}
                </p>
              </div>
            </RouterLink>
          </li>
        </ul>
      </div>
    </h1>
  </div>
</template>
