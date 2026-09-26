<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import SmartLink from '@/components/common/SmartLink.vue'
import SectionRenderer from '@/components/sections/SectionRenderer.vue'
import ArticleCard from '@/components/public/ArticleCard.vue'
import SectionShell from '@/components/public/SectionShell.vue'
import { publicService } from '@/services/public'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSeo } from '@/composables/useSeo'
import { useSiteStore } from '@/stores/site'
import { safeImageUrl } from '@/utils/url'

const site = useSiteStore()
const { data, loading } = useAsyncData(
  () => 'home',
  () => publicService.home(),
)
onMounted(() => site.load())

const page = computed(() => data.value?.page ?? null)
const banners = computed(() => data.value?.banners ?? [])
const hasHero = computed(() => page.value?.sections.some((s) => s.type === 'HERO'))

useSeo(() => ({
  title: page.value?.seo?.title ?? null,
  description: page.value?.seo?.description ?? site.settings?.tagline,
  seo: page.value?.seo,
  image: page.value?.featuredImage,
  path: '/',
}))
</script>

<template>
  <div v-if="loading">
    <Skeleton class="h-[60vh] w-full rounded-none" />
  </div>
  <template v-else>
    <!-- Banner / hero slides (Banner Management) -->
    <section
      v-if="banners.length && !hasHero"
      class="relative isolate flex min-h-[60vh] items-center overflow-hidden bg-slate-900 text-white"
    >
      <img
        v-if="banners[0]!.image"
        :src="safeImageUrl(banners[0]!.image)"
        alt=""
        fetchpriority="high"
        class="absolute inset-0 -z-10 size-full object-cover opacity-60"
      />
      <div class="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <h1 class="max-w-3xl text-4xl font-bold md:text-6xl">{{ banners[0]!.title }}</h1>
        <p v-if="banners[0]!.subtitle" class="mt-5 max-w-2xl text-lg text-white/85">
          {{ banners[0]!.subtitle }}
        </p>
        <Button
          v-if="banners[0]!.buttonLabel && banners[0]!.buttonUrl"
          as-child
          size="lg"
          variant="brand"
          class="mt-8"
        >
          <SmartLink :to="banners[0]!.buttonUrl">{{ banners[0]!.buttonLabel }}</SmartLink>
        </Button>
      </div>
    </section>

    <SectionRenderer v-if="page" :sections="page.sections" :articles="data?.latestArticles" />

    <!-- Fallback when no home page has been published -->
    <SectionShell v-else title="Berita Terbaru">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ArticleCard v-for="a in data?.latestArticles ?? []" :key="a.id" :article="a" />
      </div>
    </SectionShell>

    <section v-if="banners.length > (hasHero ? 0 : 1)" class="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div class="grid gap-6 md:grid-cols-2">
        <div
          v-for="b in banners.slice(hasHero ? 0 : 1)"
          :key="b.id"
          class="relative isolate overflow-hidden rounded-2xl bg-slate-900 p-8 text-white"
        >
          <img
            v-if="b.image"
            :src="safeImageUrl(b.image)"
            alt=""
            loading="lazy"
            class="absolute inset-0 -z-10 size-full object-cover opacity-50"
          />
          <h2 class="text-2xl font-bold">{{ b.title }}</h2>
          <p v-if="b.subtitle" class="mt-2 text-white/85">{{ b.subtitle }}</p>
          <SmartLink
            v-if="b.buttonLabel && b.buttonUrl"
            :to="b.buttonUrl"
            class="mt-4 inline-block font-medium underline underline-offset-4"
            >{{ b.buttonLabel }}</SmartLink
          >
        </div>
      </div>
    </section>
  </template>
</template>
