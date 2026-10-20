<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const sidebarFilter = ref('')
const userMenuOpen = ref(false)

async function handleLogout() {
  await auth.logout()
  ui.toast('Logged out successfully.', 'info')
  router.push({ name: 'login' })
}

function isActive(to) {
  if (to.name && route.name === to.name) return true
  return false
}

// Icon mapper for AdminLTE sidebar
function getMenuIcon(iconName) {
  switch (iconName) {
    case 'home':
      return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    case 'music':
      return 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
    case 'calendar':
      return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    case 'receipt':
      return 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z'
    case 'shield':
      return 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    case 'layers':
      return 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
    case 'wallet':
    case 'cash':
      return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    case 'users':
      return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    case 'sliders':
      return 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
    case 'bell':
      return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
    case 'list':
    default:
      return 'M4 6h16M4 10h16M4 14h16M4 18h16'
  }
}

// Filtered navigation menu
const filteredMenu = computed(() => {
  if (!sidebarFilter.value.trim()) return auth.menu
  const q = sidebarFilter.value.toLowerCase()
  return auth.menu
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.label.toLowerCase().includes(q))
    }))
    .filter(section => section.items.length > 0)
})
</script>

<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-[#080d1a] text-slate-100 font-sans">
    <!-- Mobile Drawer Overlay -->
    <div
      v-if="ui.sidebarOpen"
      class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
      @click="ui.toggleSidebar(false)"
    ></div>

    <!-- ============================================== -->
    <!-- ADMINLTE 4: MAIN SIDEBAR (sidebar-dark)        -->
    <!-- ============================================== -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0"
      :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Brand Logo Header -->
      <div class="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1120]">
        <RouterLink to="/" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brass-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-md">
            ♬
          </div>
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-sm tracking-tight text-white uppercase">Bariton</span>
            <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white tracking-wider">
              LTE 4
            </span>
          </div>
        </RouterLink>

        <button
          type="button"
          class="lg:hidden p-1.5 text-slate-400 hover:text-white"
          @click="ui.toggleSidebar(false)"
        >
          ✕
        </button>
      </div>

      <!-- User Panel (AdminLTE 4) -->
      <div class="p-3 border-b border-slate-800/80 bg-[#0d1527]">
        <div class="flex items-center gap-3">
          <div class="relative shrink-0">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-brass-500 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-xs shadow">
              {{ auth.user?.name?.charAt(0) || 'U' }}
            </div>
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online"></span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-semibold text-white truncate">{{ auth.user?.name }}</div>
            <div class="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Online · {{ auth.roles?.[0] || 'Staff' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Search In Sidebar -->
      <div class="p-2.5 border-b border-slate-800/60">
        <div class="relative">
          <input
            v-model="sidebarFilter"
            type="text"
            placeholder="Search menu..."
            class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          <span class="absolute right-2.5 top-2 text-slate-500 text-xs">🔍</span>
        </div>
      </div>

      <!-- AdminLTE 4 Sidebar Navigation Menu -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div v-for="section in filteredMenu" :key="section.title" class="space-y-1">
          <!-- Section Header -->
          <div class="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            {{ section.title }}
          </div>

          <!-- Menu Items -->
          <RouterLink
            v-for="item in section.items"
            :key="item.label"
            :to="item.to"
            class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition group"
            :class="isActive(item.to)
              ? 'bg-blue-600 text-white font-semibold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'"
            @click="ui.toggleSidebar(false)"
          >
            <svg
              class="w-4 h-4 shrink-0"
              :class="isActive(item.to) ? 'text-white' : 'text-slate-400 group-hover:text-white'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getMenuIcon(item.icon)" />
            </svg>
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <!-- Sidebar Footer (System Version & Logout) -->
      <div class="p-3 border-t border-slate-800 bg-[#0b1120] flex items-center justify-between text-xs">
        <RouterLink to="/profile" class="text-slate-400 hover:text-white transition flex items-center gap-1.5">
          <span>⚙</span>
          <span>Preferences</span>
        </RouterLink>
        <button
          type="button"
          class="text-rose-400 hover:text-rose-300 transition flex items-center gap-1 font-semibold"
          title="Sign Out"
          @click="handleLogout"
        >
          <span>Sign Out</span>
          <span>⏻</span>
        </button>
      </div>
    </aside>

    <!-- ============================================== -->
    <!-- CONTENT WRAPPER WITH TOP NAVBAR                -->
    <!-- ============================================== -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- AdminLTE 4 Top Navbar (app-header) -->
      <header class="h-14 border-b border-slate-800 bg-[#0b1120] px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <!-- Left: Toggle & Quick Links -->
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            @click="ui.toggleSidebar(!ui.sidebarOpen)"
            title="Toggle Sidebar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <nav class="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-400">
            <RouterLink to="/" class="hover:text-white transition">Public Site</RouterLink>
            <span class="text-slate-700">|</span>
            <RouterLink to="/courses" class="hover:text-white transition">Catalog</RouterLink>
            <span class="text-slate-700">|</span>
            <RouterLink to="/events" class="hover:text-white transition">Events</RouterLink>
          </nav>
        </div>

        <!-- Right: Notifications, Quick Search, User Menu -->
        <div class="flex items-center gap-3">
          <!-- Notification Bell Mockup -->
          <RouterLink
            to="/admin/notifications"
            class="relative p-1.5 text-slate-400 hover:text-white transition"
            title="Notifications"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
          </RouterLink>

          <!-- User Profile Dropdown -->
          <div class="relative">
            <button
              type="button"
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <div class="w-7 h-7 rounded-full bg-brass-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                {{ auth.user?.name?.charAt(0) || 'U' }}
              </div>
              <span class="hidden md:inline text-xs font-semibold text-white">{{ auth.user?.name }}</span>
              <svg class="w-3.5 h-3.5 text-slate-400 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
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
                Profile & 2FA Security
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
        </div>
      </header>

      <!-- Mandatory 2FA Reminder Banner -->
      <div
        v-if="auth.needsTwoFactorSetup"
        class="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 text-xs text-rose-300 flex flex-wrap items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <span>🔒</span>
          <span>Security Alert: Two-Factor Authentication (TOTP) is required for staff roles. Most operations remain locked until configured.</span>
        </div>
        <RouterLink to="/profile" class="px-3 py-1 rounded bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 transition">
          Configure 2FA
        </RouterLink>
      </div>

      <!-- Main Layout Body -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <slot></slot>
      </main>
    </div>
  </div>
</template>
