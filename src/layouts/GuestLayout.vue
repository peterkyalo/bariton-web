<script setup>
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
</script>

<template>
  <div class="min-h-screen w-full flex flex-col bg-[#fdfcf8] text-slate-900 font-serif antialiased selection:bg-amber-500 selection:text-white">
    <PublicHeader />
    <main class="flex-1 w-full">
      <slot></slot>
    </main>
    <PublicFooter />
  </div>
</template>
