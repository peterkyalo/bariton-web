<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const resending = ref(false)

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
  <div class="min-h-full flex flex-col bg-ink-950">
    <!-- Unverified Email Alert Banner -->
    <div
      v-if="auth.isAuthenticated && !auth.isVerified"
      class="bg-brass-500/15 border-b border-brass-400/30 px-4 py-2 text-xs text-brass-200 flex flex-wrap items-center justify-between gap-2"
    >
      <div class="flex items-center gap-2">
        <span>⚠</span>
        <span>Please verify your email address to unlock certificates and course submissions.</span>
      </div>
      <button
        type="button"
        class="text-xs font-semibold underline hover:text-white transition disabled:opacity-50"
        :disabled="resending"
        @click="handleResendVerification"
      >
        {{ resending ? 'Sending...' : 'Resend link' }}
      </button>
    </div>

    <!-- Student Navigation Header -->
    <header class="border-b border-white/[0.08] bg-ink-900/80 backdrop-blur-md sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <RouterLink to="/student" class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brass-300 to-brass-600 flex items-center justify-center font-bold text-ink-950">
              ♬
            </div>
            <div>
              <span class="font-display font-bold text-base tracking-tight text-white block leading-none">Bariton</span>
              <span class="text-[10px] tracking-widest text-brass-300 uppercase font-semibold block mt-0.5">Student Portal</span>
            </div>
          </RouterLink>

          <nav class="hidden md:flex items-center gap-1 pl-4 border-l border-white/10 text-xs font-medium">
            <RouterLink to="/student" class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition" active-class="text-gold-400 font-bold bg-gold-500/10">
              Dashboard
            </RouterLink>
            <RouterLink to="/student/courses" class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition" active-class="text-gold-400 font-bold bg-gold-500/10">
              My Courses
            </RouterLink>
            <RouterLink to="/courses" class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition" active-class="text-gold-400 font-bold bg-gold-500/10">
              Catalog
            </RouterLink>
          </nav>
        </div>

        <!-- Right navigation -->
        <div class="flex items-center gap-3">
          <RouterLink
            to="/profile"
            class="text-xs font-medium text-ink-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition flex items-center gap-2"
          >
            <div class="w-6 h-6 rounded-full bg-brass-300/20 text-brass-200 flex items-center justify-center text-xs font-bold">
              {{ auth.user?.name?.charAt(0) || 'S' }}
            </div>
            <span class="hidden sm:inline">{{ auth.user?.name }}</span>
          </RouterLink>

          <button
            type="button"
            class="btn-ghost text-xs !py-1.5 !px-3"
            @click="handleLogout"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <slot></slot>
    </main>
  </div>
</template>
