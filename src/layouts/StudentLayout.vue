<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const resending = ref(false)
const userMenuOpen = ref(false)

const menu = [
  {
    title: 'Learning',
    items: [
      { label: 'Dashboard', to: '/student', exact: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { label: 'My Courses', to: '/student/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
      { label: '1-on-1 Tutoring', to: '/student/tutoring', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
      { label: 'Bootcamps', to: '/student/events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { label: 'Certificates', to: '/student/certificates', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Orders & Receipts', to: '/student/orders', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
      { label: 'Profile Settings', to: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ],
  },
  {
    title: 'Explore',
    items: [
      { label: 'Course Catalog', to: '/courses', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    ],
  },
]

// Active when path matches exactly, or is a nested child (e.g. /student/courses/:uuid/player)
const activePath = computed(() => route.path)
function isActive(item) {
  if (item.exact) return activePath.value === item.to
  return activePath.value === item.to || activePath.value.startsWith(item.to + '/')
}

async function handleLogout() {
  await auth.logout()
  ui.toast('Logged out successfully.', 'info')
  router.push({ name: 'login' })
}

async function handleResendVerification() {
  resending.value = true
  try {
    await auth.resendVerification()
    ui.toast('Verification link sent to your email address.', 'success')
  } catch (error) {
    ui.toast('Failed to resend email verification.', 'error')
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-[#060913] via-[#091022] to-[#0c152c] text-slate-100 font-serif">
    <!-- Mobile Drawer Overlay -->
    <div
      v-if="ui.sidebarOpen"
      class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
      @click="ui.toggleSidebar(false)"
    ></div>

    <!-- Left Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1022]/95 backdrop-blur-xl border-r border-amber-500/15 flex flex-col transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shadow-2xl"
      :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-[#070b18] to-[#0d152b] shrink-0">
        <RouterLink to="/student" class="flex items-center gap-3 group" @click="ui.toggleSidebar(false)">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            ♬
          </div>
          <div>
            <span class="font-bold text-base tracking-wider text-white uppercase block leading-none">Bariton</span>
            <span class="text-[10px] font-semibold tracking-widest uppercase text-amber-400 block mt-0.5">Conservatory</span>
          </div>
        </RouterLink>
        <button
          type="button"
          class="lg:hidden p-1.5 text-slate-400 hover:text-white"
          aria-label="Close menu"
          @click="ui.toggleSidebar(false)"
        >
          ✕
        </button>
      </div>

      <!-- User panel -->
      <div class="p-3.5 border-b border-slate-800/80 bg-[#0c1428]/90 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-amber-400/25 shrink-0">
            {{ auth.user?.name?.charAt(0) || 'S' }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-bold text-white truncate">{{ auth.user?.name }}</div>
            <div class="text-[11px] text-amber-300/80 truncate">{{ auth.user?.email }}</div>
          </div>
        </div>
      </div>

      <!-- Menu -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Student menu">
        <div v-for="section in menu" :key="section.title" class="space-y-1">
          <div class="px-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-400/70 mb-1.5">
            {{ section.title }}
          </div>
          <RouterLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group border"
            :class="isActive(item)
              ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-400/35 text-amber-200 font-bold shadow-sm'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'"
            @click="ui.toggleSidebar(false)"
          >
            <svg
              class="w-4 h-4 shrink-0 transition-colors"
              :class="isActive(item) ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <!-- Footer -->
      <div class="p-3 border-t border-slate-800/80 bg-[#070b18] shrink-0">
        <button
          type="button"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 transition"
          @click="handleLogout"
        >
          <span>Sign Out</span>
          <span>⏻</span>
        </button>
      </div>
    </aside>

    <!-- Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Slim top bar -->
      <header class="h-16 border-b border-slate-800/80 bg-[#080d1d]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <button
          type="button"
          class="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          aria-label="Toggle menu"
          @click="ui.toggleSidebar(!ui.sidebarOpen)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div class="hidden lg:flex items-center gap-2 text-sm text-slate-300">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span class="font-semibold tracking-wide text-amber-200/90">Bariton Conservatory Student Portal</span>
        </div>

        <div class="relative">
          <button
            type="button"
            @click="userMenuOpen = !userMenuOpen"
            class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-amber-500/30 hover:bg-slate-800/80 transition text-xs"
          >
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
              {{ auth.user?.name?.charAt(0) || 'S' }}
            </div>
            <span class="hidden sm:inline font-semibold text-white text-sm">{{ auth.user?.name }}</span>
            <svg class="w-3.5 h-3.5 text-slate-400 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="userMenuOpen"
            @click="userMenuOpen = false"
            class="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs"
          >
            <div class="px-3 py-2 border-b border-slate-800">
              <p class="font-semibold text-white">{{ auth.user?.name }}</p>
              <p class="text-[10px] text-slate-400 truncate">{{ auth.user?.email }}</p>
            </div>
            <RouterLink to="/profile" class="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition">
              Profile Settings
            </RouterLink>
            <div class="border-t border-slate-800 my-1"></div>
            <button
              @click="handleLogout"
              class="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition flex items-center justify-between"
            >
              <span>Sign Out</span>
              <span>⏻</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Unverified Email Alert Banner -->
      <div
        v-if="auth.isAuthenticated && !auth.isVerified"
        class="bg-amber-500/15 border-b border-amber-400/30 px-4 py-2 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <span>⚠</span>
          <span>Please verify your email address to unlock official certificate downloads and exam submissions.</span>
        </div>
        <button
          type="button"
          class="text-xs font-semibold underline hover:text-white transition disabled:opacity-50"
          :disabled="resending"
          @click="handleResendVerification"
        >
          {{ resending ? 'Sending...' : 'Resend verification link' }}
        </button>
      </div>

      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <slot></slot>
      </main>
    </div>
  </div>
</template>
