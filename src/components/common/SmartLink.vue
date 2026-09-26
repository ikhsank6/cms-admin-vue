<script setup lang="ts">
import { computed } from 'vue'
import { isExternalUrl, safeUrl } from '@/utils/url'

const props = defineProps<{ to?: string | null; target?: '_self' | '_blank' }>()
const href = computed(() => safeUrl(props.to))
const external = computed(() => isExternalUrl(href.value))
const isBlank = computed(() => props.target === '_blank')
</script>

<template>
  <a
    v-if="external || isBlank"
    :href="href"
    :target="target ?? (external ? '_blank' : undefined)"
    :rel="external || isBlank ? 'noopener noreferrer' : undefined"
  >
    <slot />
  </a>
  <RouterLink v-else :to="href"><slot /></RouterLink>
</template>
