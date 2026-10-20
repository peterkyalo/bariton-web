<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="space-y-6">
    <div class="glass p-6 sm:p-8 border-brass-400/20">
      <span class="badge-brass mb-2">Instructor Hub</span>
      <h1 class="text-2xl font-bold tracking-tight text-white">Welcome, {{ auth.user?.name }}</h1>
      <p class="text-xs text-ink-300 mt-1">Manage assigned academy courses, grading queues, rubrics, and 1-on-1 tutoring availability.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Pending Submissions</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Awaiting rubric grading</span>
      </div>
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Assigned Courses</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Course builder unlocks in Phase 2</span>
      </div>
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Tutoring Sessions</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Slots in Africa/Nairobi timezone</span>
      </div>
    </div>

    <div class="glass p-10 text-center max-w-md mx-auto">
      <div class="text-3xl mb-3">🎻</div>
      <h3 class="text-sm font-semibold text-white mb-1">Grading Queue Empty</h3>
      <p class="text-xs text-ink-400 leading-relaxed">
        Student video and audio submissions will appear here for grading once courses and assignments are published.
      </p>
    </div>
  </div>
</template>
