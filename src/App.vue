<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GuestLayout from '@/layouts/GuestLayout.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const route = useRoute()
const auth = useAuthStore()

const currentLayout = computed(() => {
  const layout = route.meta.layout
  if (typeof layout === 'function') {
    return layout(auth)
  }
  return layout || GuestLayout
})
</script>

<template>
  <component :is="currentLayout">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </component>

  <ToastContainer />
</template>
