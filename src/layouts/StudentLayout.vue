<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const resending = ref(false)
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)

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

function isActive(name) {
  return route.name === name
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 font-sans">
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

    <!-- ============================================== -->
    <!-- ADMINLTE 4: TOP NAVBAR (layout-top-nav)        -->
    <!-- ============================================== -->
    <header class="border-b border-slate-800 bg-[#0b1120] sticky top-0 z-30 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <!-- Brand & Nav Links -->
        <div class="flex items-center gap-6">
          <RouterLink to="/student" class="flex items-center gap-2.5">
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

          <!-- Desktop Navigation -->
          <nav class="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-800 text-xs font-medium">
            <RouterLink
              to="/student"
              class="px-3 py-1.5 rounded-lg transition"
              :class="isActive('dashboard.student') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'"
            >
              Dashboard
            </RouterLink>
            <RouterLink
              to="/student/courses"
              class="px-3 py-1.5 rounded-lg transition"
              :class="isActive('student.courses') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'"
            >
              My Courses
            </RouterLink>
            <RouterLink
              to="/student/tutoring"
              class="px-3 py-1.5 rounded-lg transition"
              :class="isActive('student-tutoring') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'"
            >
              1-on-1 Tutoring
            </RouterLink>
            <RouterLink
              to="/student/events"
              class="px-3 py-1.5 rounded-lg transition"
              :class="isActive('student-event-bookings') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'"
            >
              Bootcamps
            </RouterLink>
            <RouterLink
              to="/student/certificates"
              class="px-3 py-1.5 rounded-lg transition"
              :class="isActive('student.certificates') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'"
            >
              Certificates
            </RouterLink>
            <RouterLink
              to="/student/orders"
              class="px-3 py-1.5 rounded-lg transition"
              :class="isActive('student.orders') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'"
            >
              Orders & Receipts
            </RouterLink>
            <RouterLink
              to="/courses"
              class="px-3 py-1.5 rounded-lg text-brass-300 hover:text-white hover:bg-slate-800 transition"
            >
              Catalog ↗
            </RouterLink>
          </nav>
        </div>

        <!-- Right Side: Profile & Mobile Toggle -->
        <div class="flex items-center gap-3">
          <!-- User Dropdown Menu -->
          <div class="relative">
            <button
              type="button"
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition text-xs"
            >
              <div class="w-7 h-7 rounded-full bg-brass-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                {{ auth.user?.name?.charAt(0) || 'S' }}
              </div>
              <span class="hidden sm:inline font-semibold text-white">{{ auth.user?.name }}</span>
              <svg class="w-3.5 h-3.5 text-slate-400 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                Profile Settings
              </RouterLink>
              <RouterLink to="/student/orders" class="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition">
                Payment History
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

          <!-- Mobile Hamburger -->
          <button
            type="button"
            class="lg:hidden p-1.5 text-slate-300 hover:text-white"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div v-if="mobileMenuOpen" class="lg:hidden border-t border-slate-800 bg-[#0f172a] px-4 py-3 space-y-1 text-xs">
        <RouterLink
          to="/student"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          to="/student/courses"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          My Courses
        </RouterLink>
        <RouterLink
          to="/student/tutoring"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          1-on-1 Tutoring
        </RouterLink>
        <RouterLink
          to="/student/events"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Bootcamps & Workshops
        </RouterLink>
        <RouterLink
          to="/student/certificates"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Certificates
        </RouterLink>
        <RouterLink
          to="/student/orders"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Orders & Receipts
        </RouterLink>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <slot></slot>
    </main>
  </div>
</template>
