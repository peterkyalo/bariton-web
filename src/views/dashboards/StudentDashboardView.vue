<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Banner -->
    <div class="glass p-6 sm:p-8 bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 border-brass-400/20">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span class="badge-brass mb-2">Student Portal</span>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {{ auth.user?.name }}!
          </h1>
          <p class="text-xs text-ink-300 mt-1 max-w-xl leading-relaxed">
            Your personalized musical learning space. Enrolled courses, upcoming lessons, rubric grades, and certificates will appear here as you progress.
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards (Empty State Placeholder for Phase 1) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Active Courses</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Course catalog unlocks in Phase 2</span>
      </div>

      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Assignments Passed</span>
        <div class="text-2xl font-bold text-white mt-1">0 / 0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Graded via instructor rubrics</span>
      </div>

      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Exam Readiness</span>
        <div class="text-2xl font-bold text-brass-300 mt-1">0%</div>
        <span class="text-[10px] text-ink-500 mt-1 block">70% passing threshold</span>
      </div>

      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Certificates Earned</span>
        <div class="text-2xl font-bold text-aria-400 mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">QR-verifiable credentials</span>
      </div>
    </div>

    <!-- Empty State -->
    <div class="glass p-8 sm:p-12 text-center max-w-lg mx-auto">
      <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-4">
        🎼
      </div>
      <h3 class="text-lg font-semibold text-white mb-2">No Active Enrollments Yet</h3>
      <p class="text-xs text-ink-400 mb-6 leading-relaxed">
        Your student foundation is verified and active. The course catalog with module bundles, video/audio lessons, and M-Pesa payments will be unlocked in upcoming phases.
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brass-300/10 border border-brass-300/30 text-xs text-brass-200">
        <span>✓</span>
        <span>Account Verified & Ready</span>
      </div>
    </div>
  </div>
</template>
