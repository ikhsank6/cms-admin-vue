<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MediaPicker from '@/components/media/MediaPicker.vue'

defineProps<{ folder?: string; id?: string }>()
const model = defineModel<string | null | undefined>()
const pickerOpen = ref(false)
</script>

<template>
  <div class="flex items-start gap-3">
    <div
      class="bg-muted relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border"
    >
      <img v-if="model" :src="model" alt="" class="size-full object-cover" />
      <ImagePlus v-else class="text-muted-foreground size-6" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <Input
        :id="id"
        v-model="model"
        placeholder="URL gambar atau pilih dari Media Library"
        class="text-xs"
      />
      <div class="flex gap-2">
        <Button type="button" variant="outline" size="sm" @click="pickerOpen = true">
          <ImagePlus /> Pilih Media
        </Button>
        <Button v-if="model" type="button" variant="ghost" size="sm" @click="model = null"
          ><X /> Hapus</Button
        >
      </div>
    </div>
    <MediaPicker
      v-model:open="pickerOpen"
      type="image"
      :folder="folder"
      @select="model = $event.url"
    />
  </div>
</template>
