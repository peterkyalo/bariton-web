<script setup>
import { ref, onMounted, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const ordersStore = useOrdersStore()

const gatewayFilter = ref('')
const statusFilter = ref('')

onMounted(async () => {
  await loadPayments()
})

async function loadPayments() {
  await ordersStore.fetchFinancePayments({
    gateway: gatewayFilter.value || undefined,
    status: statusFilter.value || undefined,
  })
}

function handleFilterChange() {
  loadPayments()
}

function formatDate(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleDownloadReceipt(receipt) {
  if (receipt?.uuid) {
    await ordersStore.downloadReceiptPdf(receipt.uuid, receipt.receipt_number)
  }
}

const payments = computed(() => ordersStore.financePayments)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-white">
          Payment Transactions Ledger
        </h1>
        <p class="text-sm text-ink-300 mt-1">
          Complete audit trail of all incoming payments across Safaricom M-Pesa, bursar cash, and international gateways.
        </p>
      </div>

      <router-link to="/finance/cash-entry" class="btn btn-primary text-xs">
        + Record Cash Payment
      </router-link>
    </div>

    <!-- Filters -->
    <div class="glass p-4 rounded-xl flex flex-wrap gap-4 items-center">
      <div class="flex items-center gap-2 text-xs">
        <label class="text-ink-400 font-medium">Gateway:</label>
        <select
          v-model="gatewayFilter"
          @change="handleFilterChange"
          class="field-input py-1.5 px-3 text-xs w-40"
        >
          <option value="">All Gateways</option>
          <option value="mpesa">Safaricom M-Pesa</option>
          <option value="stripe">Stripe (Card)</option>
          <option value="paypal">PayPal (USD)</option>
          <option value="cash">Office Cash</option>
        </select>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <label class="text-ink-400 font-medium">Status:</label>
        <select
          v-model="statusFilter"
          @change="handleFilterChange"
          class="field-input py-1.5 px-3 text-xs w-40"
        >
          <option value="">All Statuses</option>
          <option value="successful">Successful / Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <button @click="loadPayments" class="btn btn-secondary text-xs ml-auto">
        Refresh Ledger
      </button>
    </div>

    <!-- Payments Ledger Table -->
    <div class="glass rounded-2xl overflow-hidden">
      <div v-if="ordersStore.loading" class="py-20 flex justify-center">
        <LoadingSpinner text="Loading payment transactions..." />
      </div>

      <div v-else-if="!payments.length" class="p-12 text-center text-ink-400 space-y-2">
        <p class="text-base font-semibold text-white">No transactions recorded</p>
        <p class="text-xs">No transactions match the selected filters.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-ink-950/80 text-ink-300 uppercase tracking-wider border-b border-white/5 font-semibold">
            <tr>
              <th class="px-6 py-4">Reference / Receipt #</th>
              <th class="px-6 py-4">Date</th>
              <th class="px-6 py-4">Order #</th>
              <th class="px-6 py-4">Payer</th>
              <th class="px-6 py-4">Gateway</th>
              <th class="px-6 py-4 text-right">Amount (KES)</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Receipt PDF</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="payment in payments"
              :key="payment.id"
              class="hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-6 py-4">
                <div class="font-mono font-bold text-white">
                  {{ payment.reference || payment.checkout_request_id || '-' }}
                </div>
                <div v-if="payment.receipt" class="text-[11px] font-mono text-brass-300">
                  {{ payment.receipt.receipt_number }}
                </div>
              </td>
              <td class="px-6 py-4 text-ink-300 whitespace-nowrap">
                {{ formatDate(payment.created_at) }}
              </td>
              <td class="px-6 py-4 font-mono text-ink-200">
                {{ payment.order?.order_number }}
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-white">{{ payment.payer_name || payment.order?.user?.name || '-' }}</div>
                <div class="text-[11px] text-ink-400">{{ payment.payer_phone || payment.order?.user?.phone || '-' }}</div>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'badge text-[10px] uppercase font-semibold',
                    payment.gateway === 'mpesa' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : '',
                    payment.gateway === 'cash' ? 'badge-brass' : '',
                    payment.gateway === 'stripe' ? 'badge-aria' : '',
                  ]"
                >
                  {{ payment.gateway }}
                </span>
                <div v-if="payment.recorder" class="text-[10px] text-ink-500 mt-0.5">
                  by {{ payment.recorder.name }}
                </div>
              </td>
              <td class="px-6 py-4 text-right font-mono font-bold text-white">
                KES {{ (payment.amount_kes / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'badge text-[10px] uppercase font-semibold',
                    payment.status === 'successful' ? 'badge-success' : '',
                    payment.status === 'pending' ? 'badge-brass' : '',
                    payment.status === 'failed' ? 'badge-danger' : '',
                  ]"
                >
                  {{ payment.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  v-if="payment.receipt"
                  @click="handleDownloadReceipt(payment.receipt)"
                  class="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                >
                  <svg class="w-3.5 h-3.5 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PDF
                </button>
                <span v-else class="text-ink-500">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
