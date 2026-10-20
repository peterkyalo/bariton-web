<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const auth = useAuthStore()
const dashboardStore = useDashboardStore()

const fromDate = ref('')
const toDate = ref('')
const exportLoading = ref(false)

onMounted(async () => {
  // Default to last 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  fromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  toDate.value = now.toISOString().split('T')[0]
  await applyFilters()
})

async function applyFilters() {
  await dashboardStore.fetchAdminMetrics({
    from: fromDate.value || undefined,
    to: toDate.value || undefined,
  })
}

function setPreset(days) {
  const now = new Date()
  if (days === 'all') {
    fromDate.value = '2026-01-01'
  } else {
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    fromDate.value = past.toISOString().split('T')[0]
  }
  toDate.value = now.toISOString().split('T')[0]
  applyFilters()
}

async function handleExportCsv() {
  exportLoading.value = true
  try {
    await dashboardStore.downloadAdminCsv({
      from: fromDate.value || undefined,
      to: toDate.value || undefined,
    })
  } catch (err) {
    alert('Failed to generate CSV export.')
  } finally {
    exportLoading.value = false
  }
}

function formatMoney(amount) {
  return `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Hero Banner -->
    <div class="glass p-6 sm:p-8 border-brass-400/20 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass-400/10 border border-brass-400/20 text-brass-300 text-xs font-semibold uppercase tracking-wider mb-2">
          Executive Administration & Institutional Intelligence
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          System Overview & Analytics: {{ auth.user?.name }}
        </h1>
        <p class="text-xs text-ink-300 mt-1 max-w-2xl">
          Real-time performance indicators for revenue across payment gateways, student enrollments, exam pass rates, physical bootcamp occupancy, and 1-on-1 tutoring capacity.
        </p>
      </div>

      <!-- Action Button -->
      <div class="flex items-center gap-3">
        <button
          @click="handleExportCsv"
          :disabled="exportLoading"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{{ exportLoading ? 'Exporting...' : 'Export Executive CSV' }}</span>
        </button>
      </div>
    </div>

    <!-- Date Filters Bar -->
    <div class="glass p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-ink-400 font-semibold uppercase text-[11px]">Quick Ranges:</span>
        <button @click="setPreset(7)" class="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/10 text-ink-200">Last 7 Days</button>
        <button @click="setPreset(30)" class="px-2.5 py-1 rounded bg-brass-400/20 text-brass-300 font-medium">Last 30 Days</button>
        <button @click="setPreset(90)" class="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/10 text-ink-200">Last Quarter</button>
        <button @click="setPreset('all')" class="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/10 text-ink-200">Year 2026</button>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="flex items-center gap-2">
          <span class="text-ink-400">From:</span>
          <input type="date" v-model="fromDate" class="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-ink-400">To:</span>
          <input type="date" v-model="toDate" class="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white" />
        </div>
        <button @click="applyFilters" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium">Filter</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="dashboardStore.loading" class="py-16 text-center text-ink-400">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brass-400 mx-auto mb-3"></div>
      Aggregating multi-gateway financial and academic data...
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="dashboardStore.adminMetrics" class="space-y-8">
      <!-- Top Revenue Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass p-5 rounded-2xl border-brass-400/30">
          <p class="text-xs font-semibold text-brass-400 uppercase tracking-wider">Gross Total Revenue</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-white">
              {{ formatMoney(dashboardStore.adminMetrics.revenue.total_kes) }}
            </span>
          </div>
          <p class="text-[11px] text-ink-400 mt-1">
            Approx. ${{ dashboardStore.adminMetrics.revenue.total_usd.toLocaleString() }} USD
          </p>
        </div>

        <div class="glass p-5 rounded-2xl">
          <p class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Course Enrollments</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {{ dashboardStore.adminMetrics.enrollments.total }}
            </span>
            <span class="text-xs text-ink-500">students</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-1">
            {{ dashboardStore.adminMetrics.enrollments.standard }} standard · {{ dashboardStore.adminMetrics.enrollments.assessment_only }} validation path
          </p>
        </div>

        <div class="glass p-5 rounded-2xl">
          <p class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Exam Pass Rate</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-blue-400">
              {{ dashboardStore.adminMetrics.exams.pass_rate_percentage }}%
            </span>
          </div>
          <p class="text-[11px] text-ink-400 mt-1">
            {{ dashboardStore.adminMetrics.exams.passed }} passed / {{ dashboardStore.adminMetrics.exams.total_graded }} total attempts
          </p>
        </div>

        <div class="glass p-5 rounded-2xl">
          <p class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Physical Event Occupancy</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {{ dashboardStore.adminMetrics.events.occupancy_percentage }}%
            </span>
          </div>
          <p class="text-[11px] text-ink-400 mt-1">
            {{ dashboardStore.adminMetrics.events.occupied_seats }} of {{ dashboardStore.adminMetrics.events.total_capacity }} seats booked
          </p>
        </div>
      </div>

      <!-- Revenue Breakdown Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue by Payment Method -->
        <div class="glass p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Revenue By Payment Gateway</span>
            <span class="text-xs font-normal text-ink-400">M-Pesa · Stripe · PayPal · Cash</span>
          </h3>

          <div class="space-y-3">
            <div
              v-for="(methodData, method) in dashboardStore.adminMetrics.revenue.by_method"
              :key="method"
              class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <span
                  :class="{
                    'bg-emerald-500/20 text-emerald-400': method === 'mpesa',
                    'bg-purple-500/20 text-purple-400': method === 'stripe',
                    'bg-blue-500/20 text-blue-400': method === 'paypal',
                    'bg-amber-500/20 text-amber-400': method === 'cash',
                  }"
                  class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase"
                >
                  {{ method.substring(0, 2) }}
                </span>
                <div>
                  <span class="font-bold text-white text-xs uppercase">{{ method }}</span>
                  <p class="text-[11px] text-ink-400">{{ methodData.count }} confirmed transactions</p>
                </div>
              </div>
              <div class="text-right">
                <div class="font-mono font-bold text-white text-sm">{{ formatMoney(methodData.total_kes) }}</div>
                <div class="text-[10px] text-ink-400">
                  {{ ((methodData.total_kes / (dashboardStore.adminMetrics.revenue.total_kes || 1)) * 100).toFixed(1) }}% of total
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue by Item Type -->
        <div class="glass p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Revenue By Product Category</span>
            <span class="text-xs font-normal text-ink-400">Catalog · Bootcamps · Tutoring</span>
          </h3>

          <div class="space-y-3">
            <div
              v-for="(itemData, type) in dashboardStore.adminMetrics.revenue.by_item_type"
              :key="type"
              class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
            >
              <div>
                <span class="font-bold text-white text-xs capitalize">{{ type.replace(/_/g, ' ') }}</span>
                <p class="text-[11px] text-ink-400">{{ itemData.count }} units fulfilled</p>
              </div>
              <div class="text-right">
                <div class="font-mono font-bold text-brass-300 text-sm">{{ formatMoney(itemData.total_kes) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tutoring & Operational Health Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass p-5 rounded-2xl space-y-1">
          <span class="text-xs text-ink-400">1-on-1 Tutoring Credits Sold</span>
          <p class="text-2xl font-bold text-white font-mono">
            {{ dashboardStore.adminMetrics.tutoring.credits_sold }} <span class="text-xs text-ink-500 font-sans">hours</span>
          </p>
          <p class="text-[11px] text-ink-400">
            {{ dashboardStore.adminMetrics.tutoring.sessions_booked }} scheduled / {{ dashboardStore.adminMetrics.tutoring.attended }} attended
          </p>
        </div>

        <div class="glass p-5 rounded-2xl space-y-1">
          <span class="text-xs text-ink-400">Active Bootcamps & Workshops</span>
          <p class="text-2xl font-bold text-white font-mono">
            {{ dashboardStore.adminMetrics.events.total_events }} <span class="text-xs text-ink-500 font-sans">events</span>
          </p>
          <p class="text-[11px] text-ink-400">
            {{ dashboardStore.adminMetrics.events.occupied_seats }} seats locked / {{ dashboardStore.adminMetrics.events.total_capacity }} maximum
          </p>
        </div>

        <div class="glass p-5 rounded-2xl space-y-1">
          <span class="text-xs text-ink-400">Certification Exams Evaluated</span>
          <p class="text-2xl font-bold text-white font-mono">
            {{ dashboardStore.adminMetrics.exams.total_graded }} <span class="text-xs text-ink-500 font-sans">exams</span>
          </p>
          <p class="text-[11px] text-ink-400">
            {{ dashboardStore.adminMetrics.exams.passed }} passing scores / {{ dashboardStore.adminMetrics.exams.failed }} retakes needed
          </p>
        </div>
      </div>
    </div>

    <!-- Administration Hub Quick Links -->
    <div class="space-y-4">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">Administrative Modules & Control Center</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink to="/admin/notification-templates" class="glass p-5 glass-hover block rounded-2xl border-brass-400/20">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">Notification Templates</span>
            <span class="text-brass-300">✉</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-2">Edit automated email and SMS message templates for payments, receipts, exams, and event reminders.</p>
        </RouterLink>

        <RouterLink to="/admin/users" class="glass p-5 glass-hover block rounded-2xl">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">User Accounts & Roles</span>
            <span class="text-brass-300">👥</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-2">Manage student enrollments, instructors, finance staff, and granular permissions.</p>
        </RouterLink>

        <RouterLink to="/admin/settings" class="glass p-5 glass-hover block rounded-2xl">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">System Settings</span>
            <span class="text-brass-300">⚙</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-2">Adjust VAT percentage, USD exchange rate, seat hold durations, and upload limits.</p>
        </RouterLink>

        <RouterLink to="/admin/courses" class="glass p-5 glass-hover block rounded-2xl">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">Courses & Curriculum</span>
            <span class="text-brass-300">📚</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-2">Manage course modules, video lessons, rubrics, and validation path pricing.</p>
        </RouterLink>

        <RouterLink to="/admin/certificates" class="glass p-5 glass-hover block rounded-2xl">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">Digital Certificates Registry</span>
            <span class="text-brass-300">🛡</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-2">Search issued certificates, verify authenticity QR codes, revoke, or reissue credentials.</p>
        </RouterLink>

        <RouterLink to="/admin/activity" class="glass p-5 glass-hover block rounded-2xl">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">Security Audit Log</span>
            <span class="text-brass-300">📋</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-2">Review immutable administrative actions, role changes, and system modifications.</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
