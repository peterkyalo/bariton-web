<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="min-h-full flex items-center justify-center p-6 text-center">
    <div class="glass p-8 sm:p-12 max-w-md w-full">
      <div class="w-16 h-16 rounded-2xl bg-danger-500/20 text-danger-300 text-3xl flex items-center justify-center mx-auto mb-4">
        ⛔
      </div>
      <h1 class="text-2xl font-bold text-white mb-2">Access Restricted</h1>
      <p class="text-xs text-ink-300 mb-6 leading-relaxed">
        You do not possess the required RBAC permissions to access this screen.
      </p>
      <RouterLink :to="auth.homeRoute" class="btn-primary inline-flex !py-2.5 !px-5 text-xs">
        Return to My Portal
      </RouterLink>
    </div>
  </div>
</template>
