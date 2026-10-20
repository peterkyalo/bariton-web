<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const auth = useAuthStore()
const dashboardStore = useDashboardStore()

onMounted(async () => {
  await dashboardStore.fetchInstructorMetrics()
})

function formatDatetime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  }) + ' (EAT)'
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Hero Banner -->
    <div class="glass p-6 sm:p-8 border-brass-400/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Academic Faculty & Teaching Studio
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Instructor Studio: {{ auth.user?.name }}
        </h1>
        <p class="text-xs text-ink-300 mt-1 max-w-xl">
          Review pending student assignment submissions, evaluate comprehensive final exams using rubrics, and manage your private 1-on-1 tutoring sessions.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <RouterLink
          to="/instructor/tutoring"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-2"
        >
          <span>Tutoring Schedule</span>
          <span class="text-amber-400">📅</span>
        </RouterLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="dashboardStore.loading" class="py-16 text-center text-ink-400">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400 mx-auto mb-3"></div>
      Loading instructor grading queues and student sessions...
    </div>

    <div v-else-if="dashboardStore.instructorMetrics" class="space-y-8">
      <!-- 3 Key Teaching Studio KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <!-- Assignment Submissions Queue -->
        <div class="glass p-6 rounded-2xl border-amber-500/30 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Assignment Queue</span>
              <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300">
                {{ dashboardStore.instructorMetrics.pending_assignments_count }} pending
              </span>
            </div>
            <p class="text-3xl font-extrabold text-white my-2">
              {{ dashboardStore.instructorMetrics.pending_assignments_count }}
            </p>
            <p class="text-xs text-ink-400">
              Student video & audio performance submissions awaiting rubric scoring.
            </p>
          </div>
          <RouterLink
            to="/instructor/grading"
            class="mt-6 w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs text-center transition-colors block"
          >
            Open Assignment Grading Studio
          </RouterLink>
        </div>

        <!-- Exam Grading Queue -->
        <div class="glass p-6 rounded-2xl border-blue-500/30 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-bold text-blue-400 uppercase tracking-wider">Exam Evaluations</span>
              <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300">
                {{ dashboardStore.instructorMetrics.pending_exams_count }} pending
              </span>
            </div>
            <p class="text-3xl font-extrabold text-white my-2">
              {{ dashboardStore.instructorMetrics.pending_exams_count }}
            </p>
            <p class="text-xs text-ink-400">
              Final exams and skills validation assessments submitted for review.
            </p>
          </div>
          <RouterLink
            to="/instructor/exam-grading"
            class="mt-6 w-full py-2.5 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs text-center transition-colors block"
          >
            Open Exam Evaluation Queue
          </RouterLink>
        </div>

        <!-- Upcoming 1-on-1 Tutoring -->
        <div class="glass p-6 rounded-2xl border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">1-on-1 Sessions</span>
              <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300">
                {{ dashboardStore.instructorMetrics.upcoming_sessions_count }} upcoming
              </span>
            </div>
            <p class="text-3xl font-extrabold text-white my-2">
              {{ dashboardStore.instructorMetrics.upcoming_sessions_count }}
            </p>
            <p class="text-xs text-ink-400">
              Private student lessons booked across Zoom, Google Meet, and Nairobi Studio.
            </p>
          </div>
          <RouterLink
            to="/instructor/tutoring"
            class="mt-6 w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs text-center transition-colors block"
          >
            Manage Teaching Schedule & Roster
          </RouterLink>
        </div>
      </div>

      <!-- Upcoming Tutoring Lessons Roster Card -->
      <div class="glass p-6 rounded-2xl space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Next 1-on-1 Student Lessons</h3>
          <RouterLink to="/instructor/tutoring" class="text-xs text-amber-400 hover:underline">Full Tutoring Roster</RouterLink>
        </div>

        <div v-if="dashboardStore.instructorMetrics.upcoming_sessions.length === 0" class="py-8 text-center text-xs text-ink-500">
          No student lessons currently scheduled on your calendar.
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="s in dashboardStore.instructorMetrics.upcoming_sessions"
            :key="s.id"
            class="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
          >
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-white text-sm">{{ s.student?.name }}</h4>
                <p class="text-xs text-ink-400">{{ s.course ? s.course.title : 'General Mentorship' }}</p>
              </div>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-ink-300 uppercase">
                {{ s.mode ? s.mode.replace('_', ' ') : 'Online' }}
              </span>
            </div>
            <div class="text-xs font-mono text-emerald-400">
              {{ formatDatetime(s.scheduled_start) }}
            </div>
            <div v-if="s.meeting_link" class="text-[11px] truncate">
              <a :href="s.meeting_link" target="_blank" class="text-blue-400 hover:underline">
                {{ s.meeting_link }}
              </a>
            </div>
            <div v-else-if="s.location" class="text-[11px] text-ink-400">
              Venue: {{ s.location }}
            </div>
          </div>
        </div>
      </div>

      <!-- Courses Taught Summary -->
      <div class="glass p-6 rounded-2xl space-y-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">My Assigned Courses</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="c in dashboardStore.instructorMetrics.courses"
            :key="c.id"
            class="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
          >
            <h4 class="font-bold text-white text-sm line-clamp-1">{{ c.title }}</h4>
            <div class="flex justify-between text-xs text-ink-400">
              <span>Enrollments:</span>
              <span class="font-mono text-white font-bold">{{ c.enrollments_count }} students</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
