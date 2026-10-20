<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  ui.toast('Logged out successfully.', 'info')
  router.push({ name: 'login' })
}

function isActive(to) {
  if (to.name && route.name === to.name) return true
  return false
}
</script>

<template>
  <div class="min-h-full flex flex-col lg:flex-row bg-ink-950">
    <!-- Mobile Drawer Overlay -->
    <div
      v-if="ui.sidebarOpen"
      class="fixed inset-0 z-40 bg-ink-950/80 backdrop-blur-sm lg:hidden"
      @click="ui.toggleSidebar(false)"
    ></div>

    <!-- Responsive Sidebar Navigation -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-ink-900 border-r border-white/[0.08] flex flex-col transition-transform duration-300 lg:static lg:translate-x-0"
      :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Academy Branding -->
      <div class="h-16 px-6 border-b border-white/[0.07] flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-brass-300 to-brass-600 flex items-center justify-center font-bold text-ink-950 shadow-md">
            ♬
          </div>
          <div>
            <span class="font-display font-bold text-base tracking-tight text-white block leading-none">Bariton</span>
            <span class="text-[9px] tracking-widest text-brass-300 uppercase font-semibold block mt-0.5">Staff Console</span>
          </div>
        </RouterLink>

        <button
          type="button"
          class="lg:hidden p-1.5 text-ink-400 hover:text-white"
          @click="ui.toggleSidebar(false)"
        >
          ✕
        </button>
      </div>

      <!-- Navigation Menu Groups (Strictly Permission-Driven) -->
      <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div v-for="section in auth.menu" :key="section.title" class="space-y-1">
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-2">
            {{ section.title }}
          </div>

          <RouterLink
            v-for="item in section.items"
            :key="item.label"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition"
            :class="isActive(item.to)
              ? 'bg-brass-400/15 text-brass-200 border border-brass-400/30'
              : 'text-ink-300 hover:text-white hover:bg-white/[0.04]'"
            @click="ui.toggleSidebar(false)"
          >
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <!-- Sidebar Footer User Profile & Logout -->
      <div class="p-4 border-t border-white/[0.07] bg-ink-950/40">
        <div class="flex items-center justify-between">
          <RouterLink to="/profile" class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-full bg-brass-400/20 text-brass-200 font-bold flex items-center justify-center text-xs shrink-0">
              {{ auth.user?.name?.charAt(0) || 'U' }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-white truncate">{{ auth.user?.name }}</p>
              <p class="text-[10px] text-ink-400 truncate">{{ auth.roles?.join(', ') || 'Staff' }}</p>
            </div>
          </RouterLink>

          <button
            type="button"
            class="p-1.5 text-ink-400 hover:text-danger-400 transition"
            title="Log out"
            @click="handleLogout"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>

    <!-- Main View Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Mobile Topbar Header -->
      <header class="lg:hidden h-14 border-b border-white/[0.08] bg-ink-900/90 px-4 flex items-center justify-between sticky top-0 z-30">
        <button
          type="button"
          class="p-2 text-ink-200 hover:text-white"
          @click="ui.toggleSidebar(true)"
        >
          ☰
        </button>
        <span class="font-display font-semibold text-sm text-white">Bariton Academy</span>
        <RouterLink to="/profile" class="w-7 h-7 rounded-full bg-brass-300/20 text-brass-200 flex items-center justify-center text-xs font-bold">
          {{ auth.user?.name?.charAt(0) || 'U' }}
        </RouterLink>
      </header>

      <!-- Mandatory 2FA Setup Reminder Banner for Staff -->
      <div
        v-if="auth.needsTwoFactorSetup"
        class="bg-danger-500/15 border-b border-danger-500/30 px-4 py-2.5 text-xs text-danger-300 flex flex-wrap items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <span>🔒</span>
          <span>Security Notice: Two-Factor Authentication (TOTP) is required for staff roles. Most operations remain locked until configured.</span>
        </div>
        <RouterLink to="/profile" class="btn-primary text-xs !py-1 !px-2.5">
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
