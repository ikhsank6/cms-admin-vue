<script setup lang="ts">
import { useRoute } from 'vue-router'
import { isItemActive, type NavSection } from '@/config/navigation'
import { cn } from '@/lib/utils'

withDefaults(defineProps<{ section: NavSection; labelClass?: string }>(), { labelClass: '' })
const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
</script>

<template>
  <p
    :class="
      cn(
        'text-muted-foreground px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.08em] uppercase',
        labelClass,
      )
    "
  >
    {{ section.label }}
  </p>
  <ul class="flex flex-col gap-0.5">
    <li v-for="item in section.items" :key="item.to">
      <RouterLink
        :to="item.to"
        :class="
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isItemActive(route.path, item)
              ? 'bg-active-surface text-active-surface-foreground font-semibold'
              : 'text-foreground/70 hover:bg-muted hover:text-foreground',
          )
        "
        @click="emit('navigate')"
      >
        <component :is="item.icon" class="size-[18px] shrink-0" />
        <span class="flex-1 truncate">{{ item.label }}</span>
      </RouterLink>
    </li>
  </ul>
</template>
