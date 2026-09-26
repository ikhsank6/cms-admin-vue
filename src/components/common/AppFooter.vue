<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="text-muted-foreground flex items-center justify-between px-6 py-3 text-xs">
    <span
      >&copy; {{ year }} <span class="text-foreground font-medium">CMS Portal</span>. Seluruh hak
      cipta dilindungi.</span
    >
    <span>v1.0.0</span>
  </footer>
</template>
