<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="bg-navy-950 text-slate-100 min-h-screen">
    <!-- Header Banner -->
    <section class="relative bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-950 py-16 sm:py-24 border-b border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 class="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight mb-4">
          Not Found
        </h1>
        <nav class="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-slate-400">
          <RouterLink to="/" class="hover:text-gold-400 transition-colors">Home</RouterLink>
          <span>/</span>
          <span class="text-slate-400">Pages</span>
          <span>/</span>
          <span class="text-gold-400 font-semibold">404</span>
        </nav>
      </div>
      <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
    </section>

    <!-- 404 Content Block -->
    <section class="py-20 sm:py-28">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Triangle Warning Icon -->
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-5xl mb-6 shadow-xl shadow-gold-500/5">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div class="text-8xl sm:text-9xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-amber-200 to-gold-500 tracking-tighter leading-none mb-4">
          404
        </div>
        <h2 class="text-2xl sm:text-4xl font-serif font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p class="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-10">
          We’re sorry, the page you have looked for does not exist in our academy catalogue! Maybe return to our home page or explore our conservatory courses?
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink
            to="/"
            class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 text-navy-950 font-bold text-sm tracking-wide shadow-lg shadow-gold-500/20 hover:scale-105 transition-all"
          >
            Go Back To Home
          </RouterLink>
          <RouterLink
            to="/courses"
            class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-navy-900 border border-slate-700 text-white font-semibold text-sm hover:border-gold-500/50 hover:bg-navy-800 transition-all"
          >
            Explore Courses
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
