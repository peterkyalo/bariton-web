<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-full flex items-center justify-center p-6 text-center">
    <div class="glass p-8 sm:p-12 max-w-md w-full">
      <div class="w-16 h-16 rounded-2xl bg-white/5 text-brass-300 text-3xl flex items-center justify-center mx-auto mb-4">
        🔍
      </div>
      <h1 class="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p class="text-xs text-ink-300 mb-6 leading-relaxed">
        The requested academy resource or screen could not be located.
      </p>
      <RouterLink to="/" class="btn-primary inline-flex !py-2.5 !px-5 text-xs">
        Return Home
      </RouterLink>
    </div>
  </div>
</template>
