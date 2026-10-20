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
  <div class="space-y-6">
    <!-- AdminLTE 4 Content Header & Breadcrumbs -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Instructor Studio</span>
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              AdminLTE v4
            </span>
          </h1>
        </div>
        <p class="text-xs text-ink-400 mt-0.5">
          Academic Faculty Dashboard · Welcome back, <span class="text-white font-semibold">{{ auth.user?.name }}</span>
        </p>
      </div>

      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-1.5 text-xs text-ink-400" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-brass-300 transition-colors">Home</RouterLink>
        <span>/</span>
        <span class="text-ink-500">Dashboard</span>
        <span>/</span>
        <span class="text-amber-400 font-semibold">Faculty Studio</span>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="dashboardStore.loading" class="py-16 text-center text-ink-400">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400 mx-auto mb-3"></div>
      <p class="text-xs">Loading instructor grading queues and student sessions...</p>
    </div>

    <div v-else-if="dashboardStore.instructorMetrics" class="space-y-6">
      <!-- ========================================== -->
      <!-- ADMINLTE 4: SMALL BOXES ROW (4 WIDGETS)    -->
      <!-- ========================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Assignment Submissions (Warning / Amber) -->
        <div class="small-box bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700">
          <div class="inner">
            <h3 class="!text-white">{{ dashboardStore.instructorMetrics.pending_assignments_count }}</h3>
            <p class="!text-white/90">Pending Assignments</p>
            <div class="text-[11px] text-white/80 font-medium mt-1">
              Submissions awaiting rubric evaluation
            </div>
          </div>
          <!-- Watermark Icon -->
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <RouterLink to="/instructor/grading" class="small-box-footer">
            <span>Assignment Grading Studio</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
        </div>

        <!-- 2. Exam Evaluations (Primary / Blue) -->
        <div class="small-box bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
          <div class="inner">
            <h3>{{ dashboardStore.instructorMetrics.pending_exams_count }}</h3>
            <p>Exam Evaluations</p>
            <div class="text-[11px] text-white/80 font-medium mt-1">
              Final exams submitted for certification
            </div>
          </div>
          <!-- Watermark Icon -->
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-4h2v4zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
          </div>
          <RouterLink to="/instructor/exam-grading" class="small-box-footer">
            <span>Exam Evaluation Queue</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
        </div>

        <!-- 3. 1-on-1 Tutoring Sessions (Success / Emerald) -->
        <div class="small-box bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800">
          <div class="inner">
            <h3>{{ dashboardStore.instructorMetrics.upcoming_sessions_count }}</h3>
            <p>1-on-1 Sessions</p>
            <div class="text-[11px] text-white/80 font-medium mt-1">
              Private student lessons booked
            </div>
          </div>
          <!-- Watermark Icon -->
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </div>
          <RouterLink to="/instructor/tutoring" class="small-box-footer">
            <span>Tutoring Schedule</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
        </div>

        <!-- 4. Assigned Courses (Indigo / Purple) -->
        <div class="small-box bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800">
          <div class="inner">
            <h3>{{ dashboardStore.instructorMetrics.courses?.length || 0 }}</h3>
            <p>Assigned Courses</p>
            <div class="text-[11px] text-white/80 font-medium mt-1">
              Curriculum modules under instruction
            </div>
          </div>
          <!-- Watermark Icon -->
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <RouterLink to="/instructor/courses" class="small-box-footer">
            <span>Class Catalog</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- ADMINLTE 4: MAIN CONTENT 2-COL GRID       -->
      <!-- ========================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Next 1-on-1 Lessons Table (Col 2) -->
        <div class="lg:col-span-2 adminlte-card card-outline-success">
          <div class="adminlte-card-header">
            <div class="adminlte-card-title">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Upcoming 1-on-1 Student Lessons</span>
            </div>
            <div class="adminlte-card-tools">
              <RouterLink
                to="/instructor/tutoring"
                class="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
              >
                Calendar & Hours &rarr;
              </RouterLink>
            </div>
          </div>

          <div class="adminlte-card-body !p-0">
            <div v-if="dashboardStore.instructorMetrics.upcoming_sessions.length === 0" class="py-12 text-center text-xs text-ink-400">
              <svg class="w-8 h-8 mx-auto text-ink-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              No upcoming student lessons currently on your calendar.
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-800 bg-slate-950/40 text-ink-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th class="px-4 py-2.5">Student</th>
                    <th class="px-4 py-2.5">Subject / Course</th>
                    <th class="px-4 py-2.5">Date & Time (EAT)</th>
                    <th class="px-4 py-2.5">Location / Link</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr
                    v-for="s in dashboardStore.instructorMetrics.upcoming_sessions"
                    :key="s.id"
                    class="hover:bg-white/[0.02] transition-colors"
                  >
                    <td class="px-4 py-3 font-semibold text-white">
                      {{ s.student?.name }}
                    </td>
                    <td class="px-4 py-3 text-ink-300">
                      {{ s.course ? s.course.title : 'General Mentorship' }}
                    </td>
                    <td class="px-4 py-3 text-emerald-400 font-mono text-[11px]">
                      {{ formatDatetime(s.scheduled_start) }}
                    </td>
                    <td class="px-4 py-3">
                      <a
                        v-if="s.meeting_link"
                        :href="s.meeting_link"
                        target="_blank"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 font-semibold text-[11px]"
                      >
                        <span>Join Call</span>
                        <span>↗</span>
                      </a>
                      <span v-else class="text-[11px] text-ink-400">
                        {{ s.location || 'Studio' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="adminlte-card-footer">
            <span>Sessions automatically respect your weekly configured availability</span>
            <RouterLink to="/instructor/tutoring" class="text-emerald-400 hover:underline font-semibold">
              Update Availability &rarr;
            </RouterLink>
          </div>
        </div>

        <!-- Assigned Courses & Enrollment Stats (Col 1) -->
        <div class="adminlte-card card-outline-indigo">
          <div class="adminlte-card-header">
            <div class="adminlte-card-title">
              <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>My Teaching Courses</span>
            </div>
          </div>

          <div class="adminlte-card-body space-y-3">
            <div
              v-for="c in dashboardStore.instructorMetrics.courses"
              :key="c.id"
              class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-white truncate max-w-[160px]">{{ c.title }}</span>
                <span class="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                  {{ c.enrollments_count }} enrolled
                </span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div class="bg-indigo-400 h-full rounded-full" :style="{ width: `${Math.min(100, c.enrollments_count * 10)}%` }"></div>
              </div>
            </div>

            <div v-if="!dashboardStore.instructorMetrics.courses?.length" class="text-xs text-ink-400 py-6 text-center">
              No courses currently assigned to you.
            </div>
          </div>

          <div class="adminlte-card-footer">
            <span>Covers lecture video content & grading</span>
            <RouterLink to="/instructor/courses" class="text-indigo-400 hover:underline font-semibold">
              Course Details &rarr;
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- ADMINLTE 4: GRADING QUEUE ACTION CARDS     -->
      <!-- ========================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="adminlte-card card-outline-warning">
          <div class="adminlte-card-body flex items-center justify-between gap-4">
            <div>
              <h3 class="font-bold text-white text-sm">Assignment Rubric Grading Studio</h3>
              <p class="text-xs text-ink-400 mt-1">
                Score student audio/video performance submissions using criterion weights.
              </p>
            </div>
            <RouterLink
              to="/instructor/grading"
              class="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition"
            >
              Grade Now ({{ dashboardStore.instructorMetrics.pending_assignments_count }}) &rarr;
            </RouterLink>
          </div>
        </div>

        <div class="adminlte-card card-outline-primary">
          <div class="adminlte-card-body flex items-center justify-between gap-4">
            <div>
              <h3 class="font-bold text-white text-sm">Final Exam Evaluation Queue</h3>
              <p class="text-xs text-ink-400 mt-1">
                Assess final examination tasks and validate student skills for digital certification.
              </p>
            </div>
            <RouterLink
              to="/instructor/exam-grading"
              class="px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shrink-0 transition"
            >
              Evaluate ({{ dashboardStore.instructorMetrics.pending_exams_count }}) &rarr;
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
