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
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  fromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  toDate.value = now.toISOString().split('T')[0]
  await applyFilters()
})

async function applyFilters() {
  await dashboardStore.fetchFinanceMetrics({
    from: fromDate.value || undefined,
    to: toDate.value || undefined,
  })
}

function setPreset(days) {
  const now = new Date()
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  fromDate.value = past.toISOString().split('T')[0]
  toDate.value = now.toISOString().split('T')[0]
  applyFilters()
}

async function handleExportCsv() {
  exportLoading.value = true
  try {
    await dashboardStore.downloadFinanceCsv({
      from: fromDate.value || undefined,
      to: toDate.value || undefined,
    })
  } catch (err) {
    alert('Failed to export finance ledger.')
  } finally {
    exportLoading.value = false
  }
}

function formatMoney(amount) {
  return `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDatetime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  })
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Hero Banner -->
    <div class="glass p-6 sm:p-8 border-brass-400/20 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Finance Directorate · Ledger & Cash Operations
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Financial Ledger: {{ auth.user?.name }}
        </h1>
        <p class="text-xs text-ink-300 mt-1 max-w-2xl">
          Track real-time multi-channel inflows across M-Pesa STK push, card payments via Stripe, USD PayPal orders, cash receipts recorded at Nairobi reception, and refund credit notes.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="handleExportCsv"
          :disabled="exportLoading"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{{ exportLoading ? 'Exporting...' : 'Export Payments CSV' }}</span>
        </button>
      </div>
    </div>

    <!-- Date Filters Bar -->
    <div class="glass p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-ink-400 font-semibold uppercase text-[11px]">Period:</span>
        <button @click="setPreset(7)" class="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/10 text-ink-200">Last 7 Days</button>
        <button @click="setPreset(30)" class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-medium">Last 30 Days</button>
        <button @click="setPreset(90)" class="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/10 text-ink-200">Last 90 Days</button>
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
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400 mx-auto mb-3"></div>
      Loading financial ledger and payment settlements...
    </div>

    <!-- Metrics Content -->
    <div v-else-if="dashboardStore.financeMetrics" class="space-y-8">
      <!-- 4 Financial KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass p-5 rounded-2xl border-emerald-500/30">
          <p class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Gross Settled Revenue</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-white">
              {{ formatMoney(dashboardStore.financeMetrics.summary.total_revenue_kes) }}
            </span>
          </div>
          <p class="text-[11px] text-ink-400 mt-1">Confirmed payments in selected period</p>
        </div>

        <div class="glass p-5 rounded-2xl">
          <p class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Cash Over-The-Counter</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {{ formatMoney(dashboardStore.financeMetrics.summary.cash_total_kes) }}
            </span>
          </div>
          <p class="text-[11px] text-ink-400 mt-1">
            {{ dashboardStore.financeMetrics.summary.cash_entries_count }} manual cash receipts recorded
          </p>
        </div>

        <div class="glass p-5 rounded-2xl">
          <p class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Pending Refunds</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-rose-400">
              {{ dashboardStore.financeMetrics.summary.pending_refunds_count }}
            </span>
            <span class="text-xs text-ink-500">requests</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-1">
            Total {{ formatMoney(dashboardStore.financeMetrics.summary.pending_refunds_amount_kes) }} awaiting decision
          </p>
        </div>

        <div class="glass p-5 rounded-2xl">
          <p class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Credit Notes Issued</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-purple-400">
              {{ dashboardStore.financeMetrics.summary.credit_notes_count }}
            </span>
            <span class="text-xs text-ink-500">credit notes</span>
          </div>
          <p class="text-[11px] text-ink-400 mt-1">
            Total {{ formatMoney(dashboardStore.financeMetrics.summary.credit_notes_total_kes) }} credited
          </p>
        </div>
      </div>

      <!-- Daily Revenue Inflow Table -->
      <div class="glass p-6 rounded-2xl space-y-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Daily Collections Summary</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-ink-300">
            <thead class="bg-slate-950/70 text-ink-400 uppercase border-b border-white/10">
              <tr>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Transactions</th>
                <th class="py-3 px-4 text-right">Daily Inflow (KES)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-if="dashboardStore.financeMetrics.daily_totals.length === 0">
                <td colspan="3" class="py-6 text-center text-ink-500">No settled transactions in this period.</td>
              </tr>
              <tr v-for="daily in dashboardStore.financeMetrics.daily_totals" :key="daily.date" class="hover:bg-white/[0.02]">
                <td class="py-3 px-4 font-mono text-white">{{ daily.date }}</td>
                <td class="py-3 px-4">{{ daily.transaction_count }} payments</td>
                <td class="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                  {{ formatMoney(daily.total_kes) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Payments Ledger -->
      <div class="glass p-6 rounded-2xl space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Recent Payment Transactions</h3>
          <RouterLink to="/finance/payments" class="text-xs text-brass-400 hover:underline">View Full Ledger</RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-ink-300">
            <thead class="bg-slate-950/70 text-ink-400 uppercase border-b border-white/10">
              <tr>
                <th class="py-3 px-4">Date & Time</th>
                <th class="py-3 px-4">Student</th>
                <th class="py-3 px-4">Receipt #</th>
                <th class="py-3 px-4">Method</th>
                <th class="py-3 px-4">Amount</th>
                <th class="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="p in dashboardStore.financeMetrics.recent_payments" :key="p.id" class="hover:bg-white/[0.02]">
                <td class="py-3 px-4 font-mono text-ink-400">{{ formatDatetime(p.created_at) }}</td>
                <td class="py-3 px-4 text-white font-medium">{{ p.order?.user?.name || 'Student' }}</td>
                <td class="py-3 px-4 font-mono text-brass-400">{{ p.receipt?.receipt_number || 'Pending' }}</td>
                <td class="py-3 px-4 uppercase font-bold text-[11px]">{{ p.payment_method }}</td>
                <td class="py-3 px-4 font-mono font-bold text-white">{{ formatMoney(p.amount_kes) }}</td>
                <td class="py-3 px-4">
                  <span
                    :class="p.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'"
                    class="font-semibold uppercase text-[10px]"
                  >
                    {{ p.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Quick Navigation Links -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <RouterLink to="/finance/cash-entry" class="glass p-5 glass-hover block rounded-2xl border-emerald-500/20">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white">Cash Reception</span>
          <span class="text-emerald-400">💵</span>
        </div>
        <p class="text-[11px] text-ink-400 mt-2">Record physical cash payments received at the academy Nairobi counter and issue sequential tax receipts.</p>
      </RouterLink>

      <RouterLink to="/finance/payments" class="glass p-5 glass-hover block rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white">All Payments Ledger</span>
          <span class="text-brass-300">📋</span>
        </div>
        <p class="text-[11px] text-ink-400 mt-2">Search transaction records by M-Pesa code, Stripe intent, PayPal capture, or receipt number.</p>
      </RouterLink>

      <RouterLink to="/finance/refunds" class="glass p-5 glass-hover block rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white">Refund Approvals</span>
          <span class="text-rose-400">↩</span>
        </div>
        <p class="text-[11px] text-ink-400 mt-2">Review student refund requests with proof documents and policy window compliance.</p>
      </RouterLink>

      <RouterLink to="/finance/credit-notes" class="glass p-5 glass-hover block rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white">Credit Notes</span>
          <span class="text-purple-400">🧾</span>
        </div>
        <p class="text-[11px] text-ink-400 mt-2">View issued credit notes and download official signed PDFs for tax compliance.</p>
      </RouterLink>
    </div>
  </div>
</template>
