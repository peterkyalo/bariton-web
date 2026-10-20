<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="space-y-6">
    <div class="glass p-6 sm:p-8 border-brass-400/20">
      <span class="badge-brass mb-2">Events & Workshops</span>
      <h1 class="text-2xl font-bold tracking-tight text-white">Coordinator Portal: {{ auth.user?.name }}</h1>
      <p class="text-xs text-ink-300 mt-1">Manage physical bootcamps, workshops, seat quotas, accommodation allocations, and check-ins.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Upcoming Bootcamps</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Physical event scheduling</span>
      </div>
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Seats on Hold</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">15m online / 48h cash holds</span>
      </div>
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Waitlist Registrations</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Automatic queue promotion</span>
      </div>
    </div>

    <div class="glass p-10 text-center max-w-md mx-auto">
      <div class="text-3xl mb-3">🎪</div>
      <h3 class="text-sm font-semibold text-white mb-1">No Events Scheduled</h3>
      <p class="text-xs text-ink-400 leading-relaxed">
        Event capacity management and seat reservation locking with database transactions arrive in Phase 6.
      </p>
    </div>
  </div>
</template>
