import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import { router } from './router'
import { setSessionExpiredHandler } from './services/api'
import { useAuthStore } from './stores/auth'
import { vCan } from './directives/can'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(createHead())
app.directive('can', vCan)

setSessionExpiredHandler(() => {
  const auth = useAuthStore(pinia)
  if (!auth.isAuthenticated) return
  auth.clearSession()
  const current = router.currentRoute.value
  if (current.path.startsWith('/admin')) {
    router.replace({ name: 'login', query: { redirect: current.fullPath, expired: '1' } })
  }
})

app.mount('#app')
