<script setup lang="ts">
import { ShieldX } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-24 text-center">
    <ShieldX class="text-destructive size-12" />
    <h1 class="text-2xl font-semibold">Akses ditolak</h1>
    <p class="text-muted-foreground max-w-md">
      Anda tidak memiliki izin untuk membuka halaman ini. Hubungi Super Admin bila memerlukan akses.
    </p>
    <Button as-child variant="outline"
      ><RouterLink to="/admin">Kembali ke Dashboard</RouterLink></Button
    >
  </div>
</template>
