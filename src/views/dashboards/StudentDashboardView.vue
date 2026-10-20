<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCoursesStore } from '@/stores/courses'
import { useExamsStore } from '@/stores/exams'

const auth = useAuthStore()
const coursesStore = useCoursesStore()
const examsStore = useExamsStore()

onMounted(async () => {
  try {
    await Promise.allSettled([
      coursesStore.fetchStudentEnrollments(),
      examsStore.fetchStudentCertificates(),
    ])
  } catch (e) {
    // Graceful handling
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- AdminLTE 4 Content Header & Breadcrumbs -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Student Learning Portal</span>
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              AdminLTE v4
            </span>
          </h1>
        </div>
        <p class="text-xs text-ink-400 mt-0.5">
          Welcome back, <span class="text-white font-semibold">{{ auth.user?.name }}</span> · Conservatory Student Dashboard
        </p>
      </div>

      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-1.5 text-xs text-ink-400" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-brass-300 transition-colors">Home</RouterLink>
        <span>/</span>
        <span class="text-ink-500">Dashboard</span>
        <span>/</span>
        <span class="text-blue-400 font-semibold">Student Portal</span>
      </nav>
    </div>

    <!-- ========================================== -->
    <!-- ADMINLTE 4: SMALL BOXES ROW (4 WIDGETS)    -->
    <!-- ========================================== -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Enrolled Courses (Primary / Blue) -->
      <div class="small-box bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div class="inner">
          <h3>{{ coursesStore.studentEnrollments.length }}</h3>
          <p>Active Courses</p>
          <div class="text-[11px] text-white/80 font-medium mt-1">
            Enrolled conservatory curricula
          </div>
        </div>
        <!-- Watermark Icon -->
        <div class="small-box-icon">
          <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
          </svg>
        </div>
        <RouterLink to="/student/courses" class="small-box-footer">
          <span>My Enrolled Courses</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </RouterLink>
      </div>

      <!-- 2. Certificates (Success / Emerald) -->
      <div class="small-box bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800">
        <div class="inner">
          <h3>{{ examsStore.certificates.length }}</h3>
          <p>Verifiable Credentials</p>
          <div class="text-[11px] text-white/80 font-medium mt-1">
            QR-certified digital credentials
          </div>
        </div>
        <!-- Watermark Icon -->
        <div class="small-box-icon">
          <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
          </svg>
        </div>
        <RouterLink to="/student/certificates" class="small-box-footer">
          <span>View Certificates</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </RouterLink>
      </div>

      <!-- 3. Tutoring Mentorship (Warning / Amber) -->
      <div class="small-box bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700">
        <div class="inner">
          <h3 class="!text-white">1-on-1</h3>
          <p class="!text-white/90">Private Tutoring</p>
          <div class="text-[11px] text-white/80 font-medium mt-1">
            Expert instrument & voice sessions
          </div>
        </div>
        <!-- Watermark Icon -->
        <div class="small-box-icon">
          <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <RouterLink to="/student/tutoring" class="small-box-footer">
          <span>Schedule Tutoring</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </RouterLink>
      </div>

      <!-- 4. Bootcamps & Workshops (Indigo / Purple) -->
      <div class="small-box bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800">
        <div class="inner">
          <h3>Physical</h3>
          <p>Bootcamps & Events</p>
          <div class="text-[11px] text-white/80 font-medium mt-1">
            Nairobi Conservatory intensives
          </div>
        </div>
        <!-- Watermark Icon -->
        <div class="small-box-icon">
          <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
          </svg>
        </div>
        <RouterLink to="/student/events" class="small-box-footer">
          <span>My Event Passes</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </RouterLink>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- ADMINLTE 4: MAIN CONTENT 2-COL SECTION     -->
    <!-- ========================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Active Courses List (Col 2) -->
      <div class="lg:col-span-2 adminlte-card card-outline-primary">
        <div class="adminlte-card-header">
          <div class="adminlte-card-title">
            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>My Active Course Pathway</span>
          </div>
          <div class="adminlte-card-tools">
            <RouterLink
              to="/courses"
              class="px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition"
            >
              Course Catalog &rarr;
            </RouterLink>
          </div>
        </div>

        <div class="adminlte-card-body">
          <!-- When Enrolled in Courses -->
          <div v-if="coursesStore.studentEnrollments.length > 0" class="space-y-4">
            <div
              v-for="enrollment in coursesStore.studentEnrollments"
              :key="enrollment.uuid || enrollment.id"
              class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 class="font-bold text-white text-sm">
                    {{ enrollment.course?.title || 'Course Module' }}
                  </h3>
                  <p class="text-xs text-ink-400 mt-0.5">
                    {{ enrollment.path_type === 'assessment_only' ? 'Skills Validation Path' : 'Standard Curriculum' }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-brass-300">
                    {{ enrollment.progress_percent || 0 }}% completed
                  </span>
                  <RouterLink
                    :to="`/student/courses/${enrollment.uuid}/player`"
                    class="px-3 py-1.5 rounded-lg bg-brass-400 text-slate-950 font-bold text-xs hover:bg-brass-300 transition"
                  >
                    Resume Lesson
                  </RouterLink>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-brass-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${enrollment.progress_percent || 0}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Empty State when Not Enrolled -->
          <div v-else class="text-center py-10 px-4">
            <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mx-auto mb-3 text-blue-400">
              🎼
            </div>
            <h3 class="text-base font-bold text-white mb-1">Your Musical Journey Starts Here</h3>
            <p class="text-xs text-ink-400 max-w-md mx-auto mb-5 leading-relaxed">
              You are not currently enrolled in any active courses. Explore our curated conservatory curricula across Guitar, Piano, Voice, and Music Production.
            </p>
            <RouterLink
              to="/courses"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 text-slate-950 font-bold text-xs shadow-lg hover:from-brass-400 transition"
            >
              <span>Explore Course Catalog</span>
              <span>&rarr;</span>
            </RouterLink>
          </div>
        </div>

        <div class="adminlte-card-footer">
          <span>All modules include downloadable sheet music and assignment tasks</span>
          <RouterLink to="/student/courses" class="text-blue-400 hover:underline font-semibold">
            View All Enrolled Courses &rarr;
          </RouterLink>
        </div>
      </div>

      <!-- Academic Milestones & Exam Center (Col 1) -->
      <div class="space-y-6">
        <!-- Exam & Certification Readiness Card -->
        <div class="adminlte-card card-outline-brass">
          <div class="adminlte-card-header">
            <div class="adminlte-card-title">
              <svg class="w-4 h-4 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>Certification Criteria</span>
            </div>
          </div>

          <div class="adminlte-card-body text-xs space-y-3">
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-brass-400/20 text-brass-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">✓</span>
              <div>
                <span class="font-bold text-white">70% Passing Threshold</span>
                <p class="text-ink-400 text-[11px]">Comprehensive exam combining theoretical analysis and performance.</p>
              </div>
            </div>

            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-blue-400/20 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">✓</span>
              <div>
                <span class="font-bold text-white">Rubric-Based Evaluation</span>
                <p class="text-ink-400 text-[11px]">Instructor scoring across accuracy, tempo, expression, and technique.</p>
              </div>
            </div>

            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">✓</span>
              <div>
                <span class="font-bold text-white">Verifiable QR Credentials</span>
                <p class="text-ink-400 text-[11px]">Instantly verifiable PDF certificates on the public blockchain/registry.</p>
              </div>
            </div>
          </div>

          <div class="adminlte-card-footer">
            <RouterLink to="/student/certificates" class="text-brass-300 hover:underline font-semibold">
              Browse My Certificates &rarr;
            </RouterLink>
          </div>
        </div>

        <!-- Student Resources Quick Jump -->
        <div class="adminlte-card card-outline-indigo">
          <div class="adminlte-card-header">
            <div class="adminlte-card-title">
              <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Student Services & Receipts</span>
            </div>
          </div>

          <div class="adminlte-card-body space-y-2">
            <RouterLink
              to="/student/orders"
              class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-2">
                <span class="text-emerald-400">🧾</span>
                <span class="font-medium text-white">My Orders & VAT Receipts</span>
              </div>
              <span class="text-ink-500">&rarr;</span>
            </RouterLink>

            <RouterLink
              to="/student/tutoring"
              class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-2">
                <span class="text-amber-400">📅</span>
                <span class="font-medium text-white">1-on-1 Tutoring Schedule</span>
              </div>
              <span class="text-ink-500">&rarr;</span>
            </RouterLink>

            <RouterLink
              to="/contact"
              class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-2">
                <span class="text-blue-400">💬</span>
                <span class="font-medium text-white">Conservatory Inquiries & Help</span>
              </div>
              <span class="text-ink-500">&rarr;</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
