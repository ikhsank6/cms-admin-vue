import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useHead } from '@unhead/vue'
import type { SeoMetadata } from '@/types'
import { config } from '@/config/env'
import { useSiteStore } from '@/stores/site'

interface SeoInput {
  title?: string | null
  description?: string | null
  image?: string | null
  path?: string
  type?: 'website' | 'article'
  seo?: SeoMetadata | null
  publishedAt?: string | null
}

/** Generates <title>, meta description, canonical, Open Graph and Twitter tags (PRD §18). */
export function useSeo(input: MaybeRefOrGetter<SeoInput>) {
  const site = useSiteStore()
  const data = computed(() => {
    const i = toValue(input)
    const seo = i.seo ?? {}
    const title = seo.title || i.title || ''
    const description = seo.description || i.description || site.settings?.tagline || ''
    const image = seo.ogImage || i.image || site.settings?.logo || undefined
    const canonical =
      seo.canonicalUrl || (i.path !== undefined ? `${config.siteUrl}${i.path}` : undefined)
    return { i, seo, title, description, image, canonical }
  })

  useHead({
    title: () => (data.value.title ? `${data.value.title} | ${site.siteName}` : site.siteName),
    link: () => (data.value.canonical ? [{ rel: 'canonical', href: data.value.canonical }] : []),
    meta: () => {
      const { seo, title, description, image, canonical, i } = data.value
      const tags = [
        { name: 'description', content: description },
        { name: 'robots', content: seo.robots || 'index, follow' },
        { property: 'og:site_name', content: site.siteName },
        { property: 'og:type', content: i.type ?? 'website' },
        { property: 'og:title', content: seo.ogTitle || title || site.siteName },
        { property: 'og:description', content: seo.ogDescription || description },
        { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
      ]
      if (seo.keywords) tags.push({ name: 'keywords', content: seo.keywords })
      if (canonical) tags.push({ property: 'og:url', content: canonical })
      if (image) tags.push({ property: 'og:image', content: image })
      if (i.publishedAt) tags.push({ property: 'article:published_time', content: i.publishedAt })
      return tags
    },
  })
}
