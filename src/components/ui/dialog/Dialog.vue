<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  title: string
  description?: string
  class?: HTMLAttributes['class']
}>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
      />
      <DialogContent
        :class="
          cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid max-h-[90vh] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] grid-rows-[auto_auto_1fr_auto] gap-0 overflow-hidden rounded-lg border p-0 shadow-lg duration-200 sm:max-w-lg',
            props.class,
          )
        "
      >
        <div class="flex flex-col gap-2 px-6 pt-6 pb-4 text-left">
          <DialogTitle class="text-xl leading-none font-bold">{{ title }}</DialogTitle>
          <span class="bg-primary block h-1 w-10 rounded-full" aria-hidden="true" />
          <DialogDescription v-if="description" class="text-muted-foreground text-sm">
            {{ description }}
          </DialogDescription>
          <DialogDescription v-else class="sr-only">{{ title }}</DialogDescription>
        </div>
        <div class="border-t" />
        <div class="overflow-y-auto px-6 py-4">
          <slot />
        </div>
        <template v-if="$slots.footer">
          <div class="border-t" />
          <div class="flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end">
            <slot name="footer" />
          </div>
        </template>
        <DialogClose
          class="ring-offset-background focus:ring-ring absolute top-6 right-6 cursor-pointer rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
        >
          <X class="size-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
