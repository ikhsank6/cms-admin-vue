<script setup lang="ts">
import type { SectionContentProps } from '../types'
import { onMounted, ref } from 'vue'
import SectionShell from '@/components/public/SectionShell.vue'
import ArticleCard from '@/components/public/ArticleCard.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { publicService } from '@/services/public'
import type { Article } from '@/types'

const props = defineProps<SectionContentProps & { articles?: Article[] }>()
const items = ref<Article[] | null>(null)

onMounted(async () => {
  const limit = Number(props.content.limit) || 3
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
  <SectionShell :title="content.title" muted>
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <template v-if="items === null">
        <Skeleton v-for="i in Number(content.limit) || 3" :key="i" class="h-72 rounded-xl" />
      </template>
      <ArticleCard v-for="a in items ?? []" :key="a.id" :article="a" />
    </div>
    <div class="mt-8 text-center">
      <RouterLink to="/news" class="text-brand text-sm font-medium"
        >Lihat semua berita →</RouterLink
      >
    </div>
  </SectionShell>
</template>
