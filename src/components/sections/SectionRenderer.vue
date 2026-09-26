<script setup lang="ts">
import type { Component } from 'vue'
import type { Article, PageSection, SectionType } from '@/types'
import HeroSection from './render/HeroSection.vue'
import TextSection from './render/TextSection.vue'
import ImageSection from './render/ImageSection.vue'
import ImageTextSection from './render/ImageTextSection.vue'
import StatisticSection from './render/StatisticSection.vue'
import CardSection from './render/CardSection.vue'
import ServicesSection from './render/ServicesSection.vue'
import NewsSection from './render/NewsSection.vue'
import GallerySection from './render/GallerySection.vue'
import CtaSection from './render/CtaSection.vue'
import FaqSection from './render/FaqSection.vue'
import ContactSection from './render/ContactSection.vue'

defineProps<{ sections: PageSection[]; articles?: Article[] }>()

const components: Record<SectionType, Component> = {
  HERO: HeroSection,
  TEXT: TextSection,
  IMAGE: ImageSection,
  IMAGE_TEXT: ImageTextSection,
  STATISTIC: StatisticSection,
  CARD: CardSection,
  SERVICES: ServicesSection,
  NEWS: NewsSection,
  GALLERY: GallerySection,
  CTA: CtaSection,
  FAQ: FaqSection,
  CONTACT: ContactSection,
}
</script>

<template>
  <template v-for="(section, i) in sections" :key="section.id ?? i">
    <component
      :is="components[section.type]"
      v-if="section.isActive !== false && components[section.type]"
      :content="section.content"
      :data-section="section.type"
      v-bind="section.type === 'NEWS' ? { articles } : {}"
    />
  </template>
</template>
