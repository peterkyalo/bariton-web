<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const auth = useAuthStore()
const dashboardStore = useDashboardStore()

const activeGradingTab = ref('assignments')
const showAssignmentBanner = ref(true)

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

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getInitials(name) {
  if (!name) return 'S'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const metrics = computed(() => dashboardStore.instructorMetrics || {})
</script>

<template>
  <div class="space-y-6">
    <!-- ============================================== -->
    <!-- CONTENT HEADER & BREADCRUMBS                   -->
    <!-- ============================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <span>Instructor Studio</span>
          </h1>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-500/15 text-gold-400 border border-gold-500/30">
            Academic Faculty
          </span>
          <span class="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            Nairobi Campus (EAT)
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-1">
          Faculty Masterclass & Tutoring Operations · Welcome back, <strong class="text-white">{{ auth.user?.name }}</strong>
        </p>
      </div>

      <!-- Quick Action Controls -->
      <div class="flex items-center gap-2.5">
        <RouterLink
          to="/instructor/tutoring"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
        >
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Availability & Hours</span>
        </RouterLink>

        <RouterLink
          to="/instructor/grading"
          class="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-gold-500/20"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Grading Studio</span>
        </RouterLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="dashboardStore.loading" class="py-20 text-center text-slate-400">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-400 mx-auto mb-3"></div>
      <p class="text-xs font-medium">Synchronizing faculty queues, student tutoring sessions, and curricula...</p>
    </div>

    <div v-else-if="metrics" class="space-y-6">
      <!-- ============================================== -->
      <!-- COURSE ASSIGNMENT BANNER (CLEAN & COLLAPSIBLE) -->
      <!-- ============================================== -->
      <div
        v-if="showAssignmentBanner && metrics.newly_assigned_courses?.length"
        class="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-gold-500/10 to-amber-600/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md"
      >
        <div class="flex items-start gap-3.5 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-white">Curriculum Development Assignment</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {{ metrics.newly_assigned_courses.length }} Assigned
              </span>
            </div>
            <p class="text-xs text-amber-200/90 mt-1">
              You are assigned to author modules and video masterclasses for:
              <strong class="text-white font-semibold">
                {{ metrics.newly_assigned_courses.slice(0, 3).map(c => c.title).join(', ') }}
                <span v-if="metrics.newly_assigned_courses.length > 3">
                  (+{{ metrics.newly_assigned_courses.length - 3 }} more)
                </span>
              </strong>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <RouterLink
            :to="`/instructor/courses/${metrics.newly_assigned_courses[0]?.id}`"
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center gap-1.5"
          >
            <span>Author Curriculum</span>
            <span class="text-sm">→</span>
          </RouterLink>
          <button
            type="button"
            @click="showAssignmentBanner = false"
            class="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- STAT WIDGETS ROW (4 CARDS)                     -->
      <!-- ============================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Assignment Submissions (Warning / Amber) -->
        <div class="small-box bg-gradient-to-br from-amber-600/95 via-amber-700/90 to-amber-900 border-amber-500/30">
          <div class="inner">
            <div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/30 text-amber-200">
                Evaluation Queue
              </span>
              <h3 class="mt-2">{{ metrics.pending_assignments_count || 0 }}</h3>
              <p>Pending Assignments</p>
            </div>
            <div class="text-[11px] text-amber-100/80 font-medium mt-2">
              Submissions awaiting rubric evaluation
            </div>
          </div>
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <RouterLink to="/instructor/grading" class="small-box-footer group">
            <span>Assignment Grading Studio</span>
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </RouterLink>
        </div>

        <!-- 2. Exam Evaluations (Primary / Blue) -->
        <div class="small-box bg-gradient-to-br from-blue-600/95 via-blue-700/90 to-blue-900 border-blue-500/30">
          <div class="inner">
            <div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/30 text-blue-200">
                Certifications
              </span>
              <h3 class="mt-2">{{ metrics.pending_exams_count || 0 }}</h3>
              <p>Exam Evaluations</p>
            </div>
            <div class="text-[11px] text-blue-100/80 font-medium mt-2">
              Final exams submitted for certification
            </div>
          </div>
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-4h2v4zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
          </div>
          <RouterLink to="/instructor/exam-grading" class="small-box-footer group">
            <span>Certification Evaluation Queue</span>
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </RouterLink>
        </div>

        <!-- 3. 1-on-1 Sessions (Emerald) -->
        <div class="small-box bg-gradient-to-br from-emerald-600/95 via-emerald-700/90 to-emerald-900 border-emerald-500/30">
          <div class="inner">
            <div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/30 text-emerald-200">
                Private Coaching
              </span>
              <h3 class="mt-2">{{ metrics.upcoming_sessions_count || 0 }}</h3>
              <p>1-on-1 Sessions</p>
            </div>
            <div class="text-[11px] text-emerald-100/80 font-medium mt-2">
              Confirmed private student bookings
            </div>
          </div>
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </div>
          <RouterLink to="/instructor/tutoring" class="small-box-footer group">
            <span>Tutoring Roster & Calendar</span>
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </RouterLink>
        </div>

        <!-- 4. Assigned Courses (Indigo / Purple) -->
        <div class="small-box bg-gradient-to-br from-indigo-600/95 via-indigo-700/90 to-indigo-900 border-indigo-500/30">
          <div class="inner">
            <div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/30 text-indigo-200">
                Curriculum
              </span>
              <h3 class="mt-2">{{ metrics.courses?.length || 0 }}</h3>
              <p>Assigned Courses</p>
            </div>
            <div class="text-[11px] text-indigo-100/80 font-medium mt-2">
              Curriculum modules under instruction
            </div>
          </div>
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <RouterLink to="/instructor/courses" class="small-box-footer group">
            <span>Faculty Course Catalog</span>
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </RouterLink>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- MAIN 2-COLUMN BALANCED WORKFLOW GRID           -->
      <!-- ============================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <!-- LEFT 2 COLS: UPCOMING SESSIONS + GRADING QUEUE -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Upcoming 1-on-1 Lessons Table Card -->
          <div class="adminlte-card card-outline-success">
            <div class="adminlte-card-header">
              <div class="adminlte-card-title">
                <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>Upcoming 1-on-1 Student Lessons</span>
              </div>
              <div class="adminlte-card-tools">
                <RouterLink
                  to="/instructor/tutoring"
                  class="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
                >
                  Manage Roster &rarr;
                </RouterLink>
              </div>
            </div>

            <div class="adminlte-card-body !p-0">
              <div v-if="!metrics.upcoming_sessions?.length" class="py-12 px-4 text-center">
                <div class="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p class="text-xs font-semibold text-slate-300">No student sessions scheduled today</p>
                <p class="text-[11px] text-slate-500 mt-1">Students can book sessions based on your configured availability window.</p>
                <RouterLink
                  to="/instructor/tutoring"
                  class="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition"
                >
                  Configure Weekly Hours
                </RouterLink>
              </div>

              <div v-else class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                      <th class="px-5 py-3">Student</th>
                      <th class="px-5 py-3">Curriculum Focus</th>
                      <th class="px-5 py-3">Scheduled Time (EAT)</th>
                      <th class="px-5 py-3 text-right">Venue / Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60">
                    <tr
                      v-for="s in metrics.upcoming_sessions"
                      :key="s.id"
                      class="hover:bg-white/[0.02] transition-colors"
                    >
                      <td class="px-5 py-3.5">
                        <div class="flex items-center gap-2.5">
                          <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/30">
                            {{ getInitials(s.student?.name) }}
                          </div>
                          <div>
                            <div class="font-bold text-white text-xs">{{ s.student?.name }}</div>
                            <div class="text-[10px] text-slate-400 font-mono">{{ s.student?.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-5 py-3.5">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700">
                          <span>🎵</span>
                          <span>{{ s.course ? s.course.title : 'Faculty Mentorship' }}</span>
                        </span>
                      </td>
                      <td class="px-5 py-3.5">
                        <div class="font-mono text-emerald-400 text-[11px] font-bold">
                          {{ formatDatetime(s.scheduled_start) }}
                        </div>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <a
                          v-if="s.meeting_link"
                          :href="s.meeting_link"
                          target="_blank"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Join Call</span>
                        </a>
                        <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span>📍</span>
                          <span>{{ s.location || 'Studio Campus' }}</span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="adminlte-card-footer">
              <span class="text-slate-400">Timezone synced to Africa/Nairobi (EAT)</span>
              <RouterLink to="/instructor/tutoring" class="text-emerald-400 hover:text-emerald-300 font-bold transition flex items-center gap-1">
                <span>Update Weekly Calendar</span>
                <span>&rarr;</span>
              </RouterLink>
            </div>
          </div>

          <!-- Evaluation & Grading Center Card -->
          <div class="adminlte-card card-outline-warning">
            <div class="adminlte-card-header">
              <div class="adminlte-card-title">
                <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span>Student Assessment & Certification Queues</span>
              </div>

              <!-- Tabs -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="activeGradingTab = 'assignments'"
                  class="px-3 py-1 rounded-lg text-xs font-bold transition"
                  :class="activeGradingTab === 'assignments' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-slate-800'"
                >
                  Assignments ({{ metrics.pending_assignments_count || 0 }})
                </button>
                <button
                  type="button"
                  @click="activeGradingTab = 'exams'"
                  class="px-3 py-1 rounded-lg text-xs font-bold transition"
                  :class="activeGradingTab === 'exams' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-800'"
                >
                  Final Exams ({{ metrics.pending_exams_count || 0 }})
                </button>
              </div>
            </div>

            <div class="adminlte-card-body">
              <!-- Assignments Queue -->
              <div v-if="activeGradingTab === 'assignments'">
                <div v-if="!metrics.pending_assignments?.length" class="py-8 text-center">
                  <div class="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    ✓
                  </div>
                  <p class="text-xs font-bold text-white">All Assignment Submissions Evaluated</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">Your students have received their rubric evaluations and performance marks.</p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="sub in metrics.pending_assignments"
                    :key="sub.id"
                    class="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-4 hover:border-amber-500/40 transition"
                  >
                    <div>
                      <div class="font-bold text-white text-xs">
                        {{ sub.student?.name }} · <span class="text-amber-400">{{ sub.assignment?.title || 'Performance Submission' }}</span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-0.5">
                        Course: {{ sub.assignment?.module?.course?.title || 'Conservatory Course' }} · Submitted {{ formatDate(sub.created_at) }}
                      </div>
                    </div>
                    <RouterLink
                      :to="`/instructor/grading/${sub.uuid}`"
                      class="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0"
                    >
                      Grade with Rubric &rarr;
                    </RouterLink>
                  </div>
                </div>
              </div>

              <!-- Final Exams Queue -->
              <div v-else-if="activeGradingTab === 'exams'">
                <div v-if="!metrics.pending_exams?.length" class="py-8 text-center">
                  <div class="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    ✓
                  </div>
                  <p class="text-xs font-bold text-white">Final Exam Queue Clear</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">No theoretical or recital exam attempts currently waiting for certification review.</p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="exam in metrics.pending_exams"
                    :key="exam.id"
                    class="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-4 hover:border-blue-500/40 transition"
                  >
                    <div>
                      <div class="font-bold text-white text-xs">
                        {{ exam.user?.name }} · <span class="text-blue-400">{{ exam.exam?.title || 'Certification Exam' }}</span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-0.5">
                        Course: {{ exam.exam?.course?.title }} · Submitted {{ formatDate(exam.created_at) }}
                      </div>
                    </div>
                    <RouterLink
                      :to="`/instructor/exam-grading/${exam.uuid}`"
                      class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shrink-0"
                    >
                      Evaluate Exam &rarr;
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>

            <div class="adminlte-card-footer">
              <span class="text-slate-400">Passing score (≥70%) triggers automated digital verifiable credential generation</span>
              <RouterLink
                :to="activeGradingTab === 'assignments' ? '/instructor/grading' : '/instructor/exam-grading'"
                class="text-amber-400 hover:text-amber-300 font-bold transition"
              >
                Full Queue Studio &rarr;
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- RIGHT 1 COL: ASSIGNED COURSES + QUICK ACTIONS -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Teaching Courses Card -->
          <div class="adminlte-card card-outline-indigo">
            <div class="adminlte-card-header">
              <div class="adminlte-card-title">
                <div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span>My Teaching Courses</span>
              </div>
              <div class="adminlte-card-tools">
                <RouterLink
                  to="/instructor/courses"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition"
                >
                  All ({{ metrics.courses?.length || 0 }}) &rarr;
                </RouterLink>
              </div>
            </div>

            <!-- Scrollable list of courses to prevent height stretching -->
            <div class="adminlte-card-body !p-4 max-h-[440px] overflow-y-auto space-y-3 custom-scrollbar">
              <div
                v-for="c in metrics.courses"
                :key="c.id"
                class="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5 hover:border-indigo-500/40 transition group"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-bold text-white text-xs leading-snug group-hover:text-indigo-300 transition">
                      {{ c.title }}
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono"
                        :class="c.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'"
                      >
                        {{ c.status || 'draft' }}
                      </span>
                      <span class="text-[10px] text-slate-400 font-medium">
                        {{ c.level || 'All Levels' }}
                      </span>
                    </div>
                  </div>

                  <span class="px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 font-mono text-[10px] font-bold shrink-0 border border-indigo-500/30">
                    {{ c.modules_count || 0 }} mods
                  </span>
                </div>

                <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span class="text-slate-400 flex items-center gap-1 text-[10px]">
                    <svg class="w-3.5 h-3.5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{{ c.enrollments_count || 0 }} Enrolled</span>
                  </span>

                  <RouterLink
                    :to="`/instructor/courses/${c.id}`"
                    class="text-gold-400 hover:text-gold-300 font-bold flex items-center gap-1 transition"
                  >
                    <span>Curriculum Studio</span>
                    <span>&rarr;</span>
                  </RouterLink>
                </div>
              </div>

              <div v-if="!metrics.courses?.length" class="text-xs text-slate-400 py-8 text-center">
                No teaching courses assigned to your faculty profile.
              </div>
            </div>

            <div class="adminlte-card-footer">
              <span class="text-slate-400">Curricula & lesson authoring studio</span>
              <RouterLink to="/instructor/courses" class="text-indigo-400 hover:text-indigo-300 font-bold transition">
                Manage Courses &rarr;
              </RouterLink>
            </div>
          </div>

          <!-- Faculty Quick Tools Card -->
          <div class="adminlte-card card-outline-brass">
            <div class="adminlte-card-header">
              <div class="adminlte-card-title">
                <div class="w-7 h-7 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center">
                  ⚡
                </div>
                <span>Faculty Tools & Shortcuts</span>
              </div>
            </div>

            <div class="adminlte-card-body space-y-2.5">
              <RouterLink
                to="/instructor/tutoring"
                class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-gold-500/40 transition group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    🕒
                  </div>
                  <div>
                    <div class="text-xs font-bold text-white group-hover:text-gold-300 transition">Office Hours & Tutoring</div>
                    <div class="text-[10px] text-slate-400">Set recurring weekday booking slots</div>
                  </div>
                </div>
                <span class="text-slate-500 group-hover:text-gold-400 transition">&rarr;</span>
              </RouterLink>

              <RouterLink
                to="/instructor/rubrics"
                class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-gold-500/40 transition group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                    📜
                  </div>
                  <div>
                    <div class="text-xs font-bold text-white group-hover:text-gold-300 transition">Rubric Criteria Library</div>
                    <div class="text-[10px] text-slate-400">Manage pitch, timing & artistry weights</div>
                  </div>
                </div>
                <span class="text-slate-500 group-hover:text-gold-400 transition">&rarr;</span>
              </RouterLink>

              <RouterLink
                to="/instructor/exam-grading"
                class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-gold-500/40 transition group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                    🎓
                  </div>
                  <div>
                    <div class="text-xs font-bold text-white group-hover:text-gold-300 transition">Certification Studio</div>
                    <div class="text-[10px] text-slate-400">Review final exams for digital credentials</div>
                  </div>
                </div>
                <span class="text-slate-500 group-hover:text-gold-400 transition">&rarr;</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(217, 119, 6, 0.6);
}
</style>
