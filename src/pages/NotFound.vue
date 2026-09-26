<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { Button } from '@/components/ui/button'

defineProps<{ message?: string }>()
useHead({ title: 'Halaman tidak ditemukan', meta: [{ name: 'robots', content: 'noindex' }] })
</script>

<template>
  <div
    class="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-20 text-center"
    data-testid="not-found"
  >
    <p class="text-brand text-6xl font-bold">404</p>
    <h1 class="text-2xl font-semibold">Halaman tidak ditemukan</h1>
    <p class="text-muted-foreground max-w-md">
      {{ message ?? 'Halaman yang Anda cari tidak tersedia atau telah dipindahkan.' }}
    </p>
    <Button as-child
      ><RouterLink :to="$route.path.startsWith('/admin') ? '/admin' : '/'"
        >Kembali ke beranda</RouterLink
      ></Button
    >
  </div>
</template>
