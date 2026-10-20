<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-full flex flex-col">
    <!-- Guest Topbar -->
    <header class="border-b border-white/[0.07] bg-ink-950/70 backdrop-blur-md sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2.5 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brass-300 to-brass-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
            <span class="text-ink-950 font-bold text-lg leading-none">♬</span>
          </div>
          <div>
            <span class="font-display font-bold text-base tracking-tight text-white block leading-none">Bariton</span>
            <span class="text-[10px] tracking-widest text-brass-300 uppercase font-semibold block mt-0.5">Music Academy</span>
          </div>
        </RouterLink>

        <div class="flex items-center gap-3">
          <RouterLink to="/login" class="text-xs font-semibold text-ink-300 hover:text-white px-3 py-1.5 transition">
            Log in
          </RouterLink>
          <RouterLink to="/register" class="btn-primary text-xs !py-1.5 !px-3.5">
            Register
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div class="w-full max-w-md">
        <slot></slot>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/[0.06] py-6 text-center text-xs text-ink-500">
      <div class="max-w-6xl mx-auto px-4">
        &copy; 2026 Bariton Music Academy. Compliant with the Kenya Data Protection Act 2019.
      </div>
    </footer>
  </div>
</template>
