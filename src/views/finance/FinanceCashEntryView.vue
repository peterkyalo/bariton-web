<script setup>
import { ref, onMounted, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Modal from '@/components/ui/Modal.vue'

const ordersStore = useOrdersStore()

const searchQuery = ref('')
const selectedOrder = ref(null)
const isModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const newlyIssuedReceipt = ref(null)

const form = ref({
  amount_kes: 0,
  payer_name: '',
  notes: '',
  payment_date: new Date().toISOString().split('T')[0],
})
const formError = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  await loadOrders()
})

async function loadOrders() {
  await ordersStore.fetchFinanceOrders({
    search: searchQuery.value,
    status: 'pending',
  })
}

function handleSearch() {
  loadOrders()
}

function openCashModal(order) {
  selectedOrder.value = order
  form.value = {
    amount_kes: order.total_kes / 100,
    payer_name: order.user?.name || '',
    notes: 'Payment received at school cashier desk.',
    payment_date: new Date().toISOString().split('T')[0],
  }
  formError.value = ''
  isModalOpen.value = true
}

async function submitCashPayment() {
  formError.value = ''
  if (!selectedOrder.value) return

  const amountMajor = parseFloat(form.value.amount_kes)
  if (isNaN(amountMajor) || amountMajor <= 0) {
    formError.value = 'Please enter a valid payment amount.'
    return
  }

  isSubmitting.value = true
  try {
    const res = await ordersStore.recordCashPayment({
      orderId: selectedOrder.value.id,
      amountKes: Math.round(amountMajor * 100),
      payerName: form.value.payer_name,
      notes: form.value.notes,
      paymentDate: form.value.payment_date,
    })

    newlyIssuedReceipt.value = res.receipt
    isModalOpen.value = false
    isSuccessModalOpen.value = true
    await loadOrders()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to record cash payment.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDownloadReceipt(receipt) {
  if (receipt?.uuid) {
    await ordersStore.downloadReceiptPdf(receipt.uuid, receipt.receipt_number)
  }
}

const orders = computed(() => ordersStore.financeOrders)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white">
          Cash Payment Reception
        </h1>
        <p class="text-sm text-ink-300 mt-1">
          Search pending student orders, record cash collected at bursar desk, and issue sequential receipts.
        </p>
      </div>

      <router-link to="/finance/payments" class="btn btn-secondary text-xs">
        View Payment Ledger
      </router-link>
    </div>

    <!-- Search Bar -->
    <div class="glass p-4 rounded-xl flex flex-wrap gap-3 items-center">
      <div class="flex-1 min-w-[240px]">
        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Search by order number (BMAS-ORD-...), student name, email, or phone..."
          class="field-input text-xs"
        />
      </div>

      <button @click="handleSearch" class="btn btn-primary text-xs">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search Orders
      </button>
    </div>

    <!-- Orders Table -->
    <div class="glass rounded-2xl overflow-hidden">
      <div v-if="ordersStore.loading" class="py-20 flex justify-center">
        <LoadingSpinner text="Searching orders..." />
      </div>

      <div v-else-if="!orders.length" class="p-12 text-center text-ink-400 space-y-2">
        <p class="text-base font-semibold text-white">No pending orders found</p>
        <p class="text-xs">There are no pending orders matching your search query.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-ink-950/80 text-ink-300 uppercase tracking-wider border-b border-white/5 font-semibold">
            <tr>
              <th class="px-6 py-4">Order #</th>
              <th class="px-6 py-4">Student / Payer</th>
              <th class="px-6 py-4">Items</th>
              <th class="px-6 py-4 text-right">Amount (KES)</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="order in orders"
              :key="order.id"
              class="hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-6 py-4 font-mono font-bold text-white">
                {{ order.order_number }}
              </td>
              <td class="px-6 py-4">
                <div class="font-semibold text-white">{{ order.user?.name || 'Student' }}</div>
                <div class="text-ink-400 text-[11px]">{{ order.user?.email }} • {{ order.user?.phone || 'No phone' }}</div>
              </td>
              <td class="px-6 py-4 max-w-xs truncate text-ink-300">
                <span v-for="item in order.items" :key="item.id" class="block truncate">
                  • {{ item.title }}
                </span>
              </td>
              <td class="px-6 py-4 text-right font-mono font-bold text-brass-300">
                KES {{ order.total_kes_formatted }}
              </td>
              <td class="px-6 py-4">
                <span class="badge badge-brass text-[10px] uppercase font-semibold">
                  {{ order.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  v-if="order.status === 'pending'"
                  @click="openCashModal(order)"
                  class="btn btn-primary text-xs py-1.5 px-3"
                >
                  Record Cash
                </button>
                <span v-else class="text-ink-500 font-medium">Completed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cash Entry Modal -->
    <Modal :open="isModalOpen" @close="isModalOpen = false" title="Record Office Cash Payment">
      <div v-if="selectedOrder" class="space-y-4 text-xs">
        <div class="p-3 rounded-lg bg-ink-950/60 border border-white/5 space-y-1">
          <div class="flex justify-between">
            <span class="text-ink-400">Order Reference:</span>
            <span class="font-mono font-bold text-white">{{ selectedOrder.order_number }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-400">Student:</span>
            <span class="text-white">{{ selectedOrder.user?.name }} ({{ selectedOrder.user?.email }})</span>
          </div>
        </div>

        <div>
          <label class="field-label">Amount Received (KES)</label>
          <input
            v-model="form.amount_kes"
            type="number"
            step="1"
            class="field-input font-mono font-bold text-base"
          />
        </div>

        <div>
          <label class="field-label">Payer Name / Depositor</label>
          <input
            v-model="form.payer_name"
            type="text"
            placeholder="e.g. Student name or Parent/Guardian name"
            class="field-input"
          />
        </div>

        <div>
          <label class="field-label">Payment Date</label>
          <input
            v-model="form.payment_date"
            type="date"
            class="field-input"
          />
        </div>

        <div>
          <label class="field-label">Office Notes / Bursar Reference</label>
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="e.g. Cash counted at counter 2."
            class="field-input"
          ></textarea>
        </div>

        <p v-if="formError" class="field-error">{{ formError }}</p>

        <div class="flex justify-end gap-3 pt-3 border-t border-white/10">
          <button @click="isModalOpen = false" type="button" class="btn btn-secondary">
            Cancel
          </button>
          <button
            @click="submitCashPayment"
            :disabled="isSubmitting"
            type="button"
            class="btn btn-primary"
          >
            <span v-if="isSubmitting">Processing...</span>
            <span v-else>Confirm & Issue Receipt</span>
          </button>
        </div>
      </div>
    </Modal>

    <!-- Success Receipt Modal -->
    <Modal :open="isSuccessModalOpen" @close="isSuccessModalOpen = false" title="Receipt Issued Successfully">
      <div v-if="newlyIssuedReceipt" class="space-y-4 text-center py-2">
        <div class="w-12 h-12 mx-auto rounded-full bg-success-500/10 border border-success-500/30 flex items-center justify-center text-success-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div class="space-y-1">
          <h3 class="text-base font-bold text-white">Cash Recorded & Access Granted</h3>
          <p class="text-xs text-ink-300">
            Sequential receipt generated with row-locked gapless numbering.
          </p>
        </div>

        <div class="glass p-3 rounded-lg text-xs font-mono text-left bg-ink-950/60 space-y-1">
          <div class="flex justify-between">
            <span class="text-ink-400">Receipt Number:</span>
            <span class="font-bold text-success-400">{{ newlyIssuedReceipt.receipt_number }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-400">Amount Paid:</span>
            <span class="text-white">KES {{ (newlyIssuedReceipt.amount_kes / 100).toLocaleString() }}</span>
          </div>
        </div>

        <div class="flex justify-center gap-3 pt-2">
          <button @click="handleDownloadReceipt(newlyIssuedReceipt)" class="btn btn-primary text-xs">
            Download Stamped PDF
          </button>
          <button @click="isSuccessModalOpen = false" class="btn btn-secondary text-xs">
            Done
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
