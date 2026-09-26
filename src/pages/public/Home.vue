<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Skeleton } from '@/components/ui/skeleton'
import SmartLink from '@/components/common/SmartLink.vue'
import SectionRenderer from '@/components/sections/SectionRenderer.vue'
import HeroSection from '@/components/sections/render/HeroSection.vue'
import ArticleCard from '@/components/public/ArticleCard.vue'
import SectionShell from '@/components/public/SectionShell.vue'
import SectionIndexNav from '@/components/public/SectionIndexNav.vue'
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
const extraBanners = computed(() => banners.value.slice(hasHero.value ? 0 : 1))

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
    <Skeleton class="h-[70vh] w-full rounded-none" />
  </div>
  <template v-else>
    <SectionIndexNav v-if="page" :sections="page.sections" />

    <!-- Banner Management fills the hero when no HERO section has been authored on the page. -->
    <HeroSection
      v-if="banners.length && !hasHero"
      id="banner-hero"
      next-id="section-0"
      :content="{
        title: banners[0]!.title,
        description: banners[0]!.subtitle,
        image: banners[0]!.image,
        buttonLabel: banners[0]!.buttonLabel,
        buttonUrl: banners[0]!.buttonUrl,
      }"
    />

    <SectionRenderer v-if="page" :sections="page.sections" :articles="data?.latestArticles" />

    <!-- Fallback when no home page has been published -->
    <SectionShell v-else title="Berita Terbaru" :index="1">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ArticleCard v-for="a in data?.latestArticles ?? []" :key="a.id" :article="a" />
      </div>
    </SectionShell>

    <section v-if="extraBanners.length" class="border-border border-t py-20 md:py-28">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="grid gap-6 md:grid-cols-2">
          <div
            v-for="b in extraBanners"
            :key="b.id"
            class="border-border group relative overflow-hidden rounded-2xl border p-8"
          >
            <img
              v-if="b.image"
              :src="safeImageUrl(b.image)"
              alt=""
              loading="lazy"
              class="absolute inset-0 -z-10 size-full object-cover opacity-15 transition-opacity group-hover:opacity-25"
            />
            <h2 class="font-display text-2xl font-medium tracking-tight">{{ b.title }}</h2>
            <p v-if="b.subtitle" class="text-muted-foreground mt-2">{{ b.subtitle }}</p>
            <SmartLink
              v-if="b.buttonLabel && b.buttonUrl"
              :to="b.buttonUrl"
              class="mt-4 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
              >{{ b.buttonLabel }} →</SmartLink
            >
          </div>
        </div>
      </div>
    </section>
  </template>
</template>
