import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { onAuthEvent } from './lib/http'
import { useAuthStore } from './stores/auth'
import { useUiStore } from './stores/ui'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore()
const ui = useUiStore()

onAuthEvent('unauthorized', () => {
  auth.clear()
  if (router.currentRoute.value.meta?.auth) {
    ui.toast('Your session has expired. Please sign in again.', 'info')
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
  }
})

onAuthEvent('twoFactorRequired', () => {
  ui.toast('Two-factor authentication is required. Please complete setup in your profile.', 'error')
  router.push({ name: 'profile' })
})

app.mount('#app')
