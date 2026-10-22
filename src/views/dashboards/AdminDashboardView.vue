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
  <div class="space-y-6">
    <!-- AdminLTE 4 Content Header & Breadcrumbs -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <span>Executive Dashboard</span>
          </h1>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-500/15 text-gold-400 border border-gold-500/30">
            Conservatory Governance
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-1">
          Welcome back, <strong class="text-white">{{ auth.user?.name }}</strong> · Institutional Intelligence & Financial Governance
        </p>
      </div>

      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-1.5 text-xs text-ink-400" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-brass-300 transition-colors">Home</RouterLink>
        <span>/</span>
        <span class="text-ink-500">Dashboard</span>
        <span>/</span>
        <span class="text-brass-300 font-semibold">Admin Overview</span>
      </nav>
    </div>

    <!-- AdminLTE Filter & Quick Action Card -->
    <div class="adminlte-card card-outline-brass">
      <div class="adminlte-card-header">
        <div class="adminlte-card-title">
          <svg class="w-4 h-4 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Metrics Filtering & Analytics Window</span>
        </div>
        <div class="adminlte-card-tools">
          <button
            @click="handleExportCsv"
            :disabled="exportLoading"
            class="px-3 py-1.5 rounded-lg bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold text-xs shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{{ exportLoading ? 'Exporting...' : 'Export Executive CSV' }}</span>
          </button>
        </div>
      </div>

      <div class="adminlte-card-body">
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-xs">
          <!-- Preset Button Group -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-ink-400 font-semibold uppercase text-[11px] mr-1">Period:</span>
            <div class="inline-flex rounded-lg shadow-sm border border-slate-700 bg-slate-950/60 p-0.5">
              <button
                @click="setPreset(7)"
                class="px-3 py-1 rounded-md text-xs font-medium text-ink-300 hover:text-white hover:bg-white/5 transition"
              >
                7 Days
              </button>
              <button
                @click="setPreset(30)"
                class="px-3 py-1 rounded-md text-xs font-semibold bg-brass-400/20 text-brass-300 transition"
              >
                30 Days
              </button>
              <button
                @click="setPreset(90)"
                class="px-3 py-1 rounded-md text-xs font-medium text-ink-300 hover:text-white hover:bg-white/5 transition"
              >
                90 Days
              </button>
              <button
                @click="setPreset('all')"
                class="px-3 py-1 rounded-md text-xs font-medium text-ink-300 hover:text-white hover:bg-white/5 transition"
              >
                Year 2026
              </button>
            </div>
          </div>

          <!-- Custom Date Range -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div class="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1">
              <span class="text-ink-400 text-[11px]">From:</span>
              <input
                type="date"
                v-model="fromDate"
                class="bg-transparent border-none text-xs text-white focus:outline-none"
              />
            </div>
            <div class="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1">
              <span class="text-ink-400 text-[11px]">To:</span>
              <input
                type="date"
                v-model="toDate"
                class="bg-transparent border-none text-xs text-white focus:outline-none"
              />
            </div>
            <button
              @click="applyFilters"
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs transition border border-slate-700"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="dashboardStore.loading" class="py-16 text-center text-ink-400">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brass-400 mx-auto mb-3"></div>
      <p class="text-xs">Aggregating multi-gateway financial and academic data...</p>
    </div>

    <!-- Main AdminLTE 4 Content Dashboard -->
    <div v-else-if="dashboardStore.adminMetrics" class="space-y-6">
      <!-- ========================================== -->
      <!-- ADMINLTE 4: SMALL BOXES ROW (4 WIDGETS)    -->
      <!-- ========================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Gross Revenue (Warning / Gold) -->
        <div class="small-box bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700">
          <div class="inner">
            <h3 class="!text-white">{{ formatMoney(dashboardStore.adminMetrics.revenue.total_kes) }}</h3>
            <p class="!text-white/90">Gross Revenue (KES)</p>
            <div class="text-[11px] text-white/80 font-medium mt-1">
              Approx. ${{ dashboardStore.adminMetrics.revenue.total_usd.toLocaleString() }} USD
            </div>
          </div>
          <!-- Watermark Icon -->
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" opacity="0.3"/>
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm1 9h-2v-2h2v2zm0-4h-2V7h2v4z"/>
            </svg>
          </div>
          <RouterLink to="/finance/payments" class="small-box-footer">
            <span>Payment Ledger</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
        </div>

        <!-- 2. Course Enrollments (Success / Emerald) -->
        <div class="small-box bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800">
          <div class="inner">
            <h3>{{ dashboardStore.adminMetrics.enrollments.total }}</h3>
            <p>Course Enrollments</p>
            <div class="text-[11px] text-white/80 font-medium mt-1">
              {{ dashboardStore.adminMetrics.enrollments.standard }} standard · {{ dashboardStore.adminMetrics.enrollments.assessment_only }} validation
            </div>
          </div>
          <!-- Watermark Icon -->
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <RouterLink to="/admin/courses" class="small-box-footer">
            <span>Course Catalog</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
        </div>

        <!-- 3. Exam Pass Rate (Info / Cyan) -->
        <div class="small-box bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800">
          <div class="inner">
            <h3>{{ dashboardStore.adminMetrics.exams.pass_rate_percentage }}<span class="text-xl">%</span></h3>
            <p>Exam Pass Rate</p>
            <div class="text-[11px] text-white/80 font-medium mt-1">
              {{ dashboardStore.adminMetrics.exams.passed }} passed / {{ dashboardStore.adminMetrics.exams.total_graded }} total evaluated
            </div>
          </div>
          <!-- Watermark Icon -->
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
          </div>
          <RouterLink to="/admin/certificates" class="small-box-footer">
            <span>Certificate Registry</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
        </div>

        <!-- 4. Physical Bootcamp Occupancy (Danger / Rose) -->
        <div class="small-box bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800">
          <div class="inner">
            <h3>{{ dashboardStore.adminMetrics.events.occupancy_percentage }}<span class="text-xl">%</span></h3>
            <p>Bootcamp Occupancy</p>
            <div class="text-[11px] text-white/80 font-medium mt-1">
              {{ dashboardStore.adminMetrics.events.occupied_seats }} of {{ dashboardStore.adminMetrics.events.total_capacity }} seats booked
            </div>
          </div>
          <!-- Watermark Icon -->
          <div class="small-box-icon">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
            </svg>
          </div>
          <RouterLink to="/events" class="small-box-footer">
            <span>Events Schedule</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- ADMINLTE 4: MAIN ANALYTICS CARDS (2-COL)   -->
      <!-- ========================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue by Payment Gateway Table Card -->
        <div class="adminlte-card card-outline-primary">
          <div class="adminlte-card-header">
            <div class="adminlte-card-title">
              <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Revenue by Payment Gateway</span>
            </div>
            <div class="adminlte-card-tools">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Multi-Gateway
              </span>
            </div>
          </div>

          <div class="adminlte-card-body !p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-800 bg-slate-950/40 text-ink-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th class="px-4 py-2.5">Gateway</th>
                    <th class="px-4 py-2.5">Transactions</th>
                    <th class="px-4 py-2.5">Volume Share</th>
                    <th class="px-4 py-2.5 text-right">Total KES</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr
                    v-for="(methodData, method) in dashboardStore.adminMetrics.revenue.by_method"
                    :key="method"
                    class="hover:bg-white/[0.02] transition-colors"
                  >
                    <td class="px-4 py-3 flex items-center gap-2.5">
                      <span
                        :class="{
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': method === 'mpesa',
                          'bg-purple-500/20 text-purple-400 border border-purple-500/30': method === 'stripe',
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30': method === 'paypal',
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30': method === 'cash',
                        }"
                        class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase shrink-0"
                      >
                        {{ method.substring(0, 2) }}
                      </span>
                      <span class="font-bold text-white uppercase text-xs">{{ method }}</span>
                    </td>
                    <td class="px-4 py-3 text-ink-300 font-mono">
                      {{ methodData.count }} confirmed
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            class="h-full rounded-full"
                            :class="{
                              'bg-emerald-400': method === 'mpesa',
                              'bg-purple-400': method === 'stripe',
                              'bg-blue-400': method === 'paypal',
                              'bg-amber-400': method === 'cash',
                            }"
                            :style="{ width: `${((methodData.total_kes / (dashboardStore.adminMetrics.revenue.total_kes || 1)) * 100).toFixed(0)}%` }"
                          ></div>
                        </div>
                        <span class="text-[11px] font-mono text-ink-400">
                          {{ ((methodData.total_kes / (dashboardStore.adminMetrics.revenue.total_kes || 1)) * 100).toFixed(1) }}%
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right font-mono font-bold text-white">
                      {{ formatMoney(methodData.total_kes) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="adminlte-card-footer">
            <span>Automatic currency conversion applied to USD gateways</span>
            <RouterLink to="/finance/payments" class="text-blue-400 hover:underline flex items-center gap-1 font-semibold">
              View Detailed Ledger &rarr;
            </RouterLink>
          </div>
        </div>

        <!-- Revenue by Product Category Card -->
        <div class="adminlte-card card-outline-success">
          <div class="adminlte-card-header">
            <div class="adminlte-card-title">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Revenue by Product Category</span>
            </div>
            <div class="adminlte-card-tools">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Fulfilled Units
              </span>
            </div>
          </div>

          <div class="adminlte-card-body space-y-4">
            <div
              v-for="(itemData, type) in dashboardStore.adminMetrics.revenue.by_item_type"
              :key="type"
              class="space-y-1.5"
            >
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span class="font-bold text-white capitalize">{{ type.replace(/_/g, ' ') }}</span>
                  <span class="text-[11px] text-ink-400">({{ itemData.count }} units)</span>
                </div>
                <span class="font-mono font-bold text-brass-300">{{ formatMoney(itemData.total_kes) }}</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-emerald-500 to-brass-400 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${Math.min(100, ((itemData.total_kes / (dashboardStore.adminMetrics.revenue.total_kes || 1)) * 100))}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="adminlte-card-footer">
            <span>Includes catalog purchases, workshops, and 1-on-1 packages</span>
            <RouterLink to="/admin/courses" class="text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
              Manage Catalog &rarr;
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- ADMINLTE 4: INFO BOXES ROW (3 WIDGETS)     -->
      <!-- ========================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Info Box 1: Tutoring -->
        <div class="info-box">
          <div class="info-box-icon bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <div class="info-box-content">
            <span class="info-box-text">1-on-1 Tutoring Hours</span>
            <span class="info-box-number">{{ dashboardStore.adminMetrics.tutoring.credits_sold }} hrs</span>
            <span class="text-[11px] text-ink-400 mt-0.5 block truncate">
              {{ dashboardStore.adminMetrics.tutoring.sessions_booked }} booked · {{ dashboardStore.adminMetrics.tutoring.attended }} attended
            </span>
          </div>
        </div>

        <!-- Info Box 2: Bootcamps -->
        <div class="info-box">
          <div class="info-box-icon bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
            </svg>
          </div>
          <div class="info-box-content">
            <span class="info-box-text">Active Bootcamps</span>
            <span class="info-box-number">{{ dashboardStore.adminMetrics.events.total_events }} events</span>
            <span class="text-[11px] text-ink-400 mt-0.5 block truncate">
              {{ dashboardStore.adminMetrics.events.occupied_seats }} of {{ dashboardStore.adminMetrics.events.total_capacity }} seats booked
            </span>
          </div>
        </div>

        <!-- Info Box 3: Exam Evaluations -->
        <div class="info-box">
          <div class="info-box-icon bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="info-box-content">
            <span class="info-box-text">Exams Evaluated</span>
            <span class="info-box-number">{{ dashboardStore.adminMetrics.exams.total_graded }} exams</span>
            <span class="text-[11px] text-ink-400 mt-0.5 block truncate">
              {{ dashboardStore.adminMetrics.exams.passed }} passed · {{ dashboardStore.adminMetrics.exams.failed }} retakes
            </span>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- ADMINLTE 4: CONTROL CENTER QUICK TILES     -->
      <!-- ========================================== -->
      <div class="adminlte-card card-outline-indigo">
        <div class="adminlte-card-header">
          <div class="adminlte-card-title">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Administration Hub & System Control Modules</span>
          </div>
          <div class="adminlte-card-tools">
            <span class="text-xs text-ink-400">Institutional Governance</span>
          </div>
        </div>

        <div class="adminlte-card-body">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <RouterLink to="/admin/notification-templates" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition group flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-white group-hover:text-brass-300 transition">Notification Templates</span>
                  <span class="text-xs p-1 rounded bg-blue-500/10 text-blue-400">✉</span>
                </div>
                <p class="text-[11px] text-ink-400">Manage automated email/SMS templates for receipts, exam pass alerts, and reminders.</p>
              </div>
              <span class="text-[10px] text-brass-400 font-semibold mt-3 flex items-center gap-1">Open Module &rarr;</span>
            </RouterLink>

            <RouterLink to="/admin/users" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition group flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-white group-hover:text-brass-300 transition">User Accounts & Roles</span>
                  <span class="text-xs p-1 rounded bg-emerald-500/10 text-emerald-400">👥</span>
                </div>
                <p class="text-[11px] text-ink-400">Manage students, instructors, finance staff, and RBAC permission delegations.</p>
              </div>
              <span class="text-[10px] text-emerald-400 font-semibold mt-3 flex items-center gap-1">Manage Users &rarr;</span>
            </RouterLink>

            <RouterLink to="/admin/settings" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition group flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-white group-hover:text-brass-300 transition">System Settings</span>
                  <span class="text-xs p-1 rounded bg-amber-500/10 text-amber-400">⚙</span>
                </div>
                <p class="text-[11px] text-ink-400">Adjust VAT rates, USD exchange conversions, seat hold limits, and file size quotas.</p>
              </div>
              <span class="text-[10px] text-amber-400 font-semibold mt-3 flex items-center gap-1">Configuration &rarr;</span>
            </RouterLink>

            <RouterLink to="/admin/courses" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition group flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-white group-hover:text-brass-300 transition">Courses & Curriculum</span>
                  <span class="text-xs p-1 rounded bg-purple-500/10 text-purple-400">📚</span>
                </div>
                <p class="text-[11px] text-ink-400">Configure modules, lesson videos, rubrics, and skills validation paths.</p>
              </div>
              <span class="text-[10px] text-purple-400 font-semibold mt-3 flex items-center gap-1">Curriculum Studio &rarr;</span>
            </RouterLink>

            <RouterLink to="/admin/certificates" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition group flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-white group-hover:text-brass-300 transition">Certificates Registry</span>
                  <span class="text-xs p-1 rounded bg-cyan-500/10 text-cyan-400">🛡</span>
                </div>
                <p class="text-[11px] text-ink-400">Verify digital certificates, inspect QR verification links, or revoke credentials.</p>
              </div>
              <span class="text-[10px] text-cyan-400 font-semibold mt-3 flex items-center gap-1">Registry Search &rarr;</span>
            </RouterLink>

            <RouterLink to="/admin/activity" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition group flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-white group-hover:text-brass-300 transition">Security Audit Log</span>
                  <span class="text-xs p-1 rounded bg-rose-500/10 text-rose-400">📋</span>
                </div>
                <p class="text-[11px] text-ink-400">Review tamper-evident system logs, administrative overrides, and login activity.</p>
              </div>
              <span class="text-[10px] text-rose-400 font-semibold mt-3 flex items-center gap-1">Audit Trail &rarr;</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
