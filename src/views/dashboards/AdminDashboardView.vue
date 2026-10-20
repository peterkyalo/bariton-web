<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="space-y-6">
    <div class="glass p-6 sm:p-8 border-brass-400/20">
      <span class="badge-brass mb-2">Executive Administration</span>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">System Administrator: {{ auth.user?.name }}</h1>
      <p class="text-xs text-ink-300 mt-1 max-w-xl">
        Oversee system users, RBAC permissions, defaults settings, security policy snapshots, and platform audit logs.
      </p>
    </div>

    <!-- Quick Navigation Links -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <RouterLink to="/admin/users" class="glass p-5 glass-hover block">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white">Users & Roles</span>
          <span class="text-brass-300">👥</span>
        </div>
        <p class="text-[11px] text-ink-400 mt-2">Manage student accounts, instructors, finance staff, and permission assignments.</p>
      </RouterLink>

      <RouterLink to="/admin/settings" class="glass p-5 glass-hover block">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white">System Settings</span>
          <span class="text-brass-300">⚙</span>
        </div>
        <p class="text-[11px] text-ink-400 mt-2">Configure upload limits, exam thresholds, pass marks, VAT, and USD exchange rates.</p>
      </RouterLink>

      <RouterLink to="/admin/activity" class="glass p-5 glass-hover block">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white">Activity Log</span>
          <span class="text-brass-300">📋</span>
        </div>
        <p class="text-[11px] text-ink-400 mt-2">Review administrative audit trails, role changes, and system modifications.</p>
      </RouterLink>

      <RouterLink to="/admin/notifications" class="glass p-5 glass-hover block">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white">Notification Delivery</span>
          <span class="text-brass-300">🔔</span>
        </div>
        <p class="text-[11px] text-ink-400 mt-2">Monitor mail and Africa's Talking SMS delivery logs or test SMS dispatches.</p>
      </RouterLink>
    </div>

    <!-- System Status Overview -->
    <div class="glass p-6">
      <h2 class="text-sm font-semibold text-white mb-4">Phase 1 Infrastructure Status</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
          <span class="text-ink-400">Sanctum SPA Auth</span>
          <p class="font-semibold text-success-400">Cookie Stateful + PAT</p>
          <p class="text-[10px] text-ink-500">app.bmas.com ↔ api.bmas.com</p>
        </div>

        <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
          <span class="text-ink-400">Spatie Permissions</span>
          <p class="font-semibold text-brass-300">6 Roles Seeded</p>
          <p class="text-[10px] text-ink-500">Guarded on web & personal tokens</p>
        </div>

        <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
          <span class="text-ink-400">SMS Gateway</span>
          <p class="font-semibold text-aria-300">Africa's Talking Sandbox</p>
          <p class="text-[10px] text-ink-500">Queued jobs with delivery log</p>
        </div>
      </div>
    </div>
  </div>
</template>
