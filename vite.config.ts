/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: env.VITE_API_PROXY_TARGET
        ? { '/api': { target: env.VITE_API_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (/[\\/](vue|vue-router|pinia|@vue)[\\/]/.test(id)) return 'vendor-vue'
              if (/[\\/](marked|dompurify)[\\/]/.test(id)) return 'vendor-content'
            }
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.ts'],
      setupFiles: ['src/test/setup.ts'],
    },
  }
})
