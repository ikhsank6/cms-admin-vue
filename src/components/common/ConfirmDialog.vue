<script setup lang="ts">
import { computed } from 'vue'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/composables/useConfirm'

const { state, settle } = useConfirm()
const open = computed({
  get: () => state.open,
  set: (v) => {
    if (!v) settle(false)
  },
})
</script>

<template>
  <Dialog v-model:open="open" :title="state.title" :description="state.description">
    <template #footer>
      <Button variant="outline" @click="settle(false)">Batal</Button>
      <Button
        :variant="state.destructive ? 'destructive' : 'default'"
        data-testid="confirm-ok"
        @click="settle(true)"
      >
        {{ state.confirmLabel }}
      </Button>
    </template>
  </Dialog>
</template>
