<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
</script>

<template>
  <RouterView />
  <Toaster />
  <ConfirmDialog />
</template>
