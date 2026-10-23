<script setup>
import { ref, onMounted, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const ordersStore = useOrdersStore()

const activeTab = ref('orders') // 'orders' | 'refunds'

// Refund Modal State
const showRefundModal = ref(false)
const selectedOrder = ref(null)
const selectedItemId = ref(null)
const refundReason = ref('')
const refundError = ref('')
const refundSubmitting = ref(false)
const refundSuccessMessage = ref('')

onMounted(async () => {
  await Promise.all([
    ordersStore.fetchStudentOrders(),
    ordersStore.fetchStudentRefunds(),
  ])
})

const orders = computed(() => ordersStore.studentOrders)
const refunds = computed(() => ordersStore.studentRefunds)

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

function isEligibleForRefund(order) {
  if (order.status !== 'paid') return false
  if (order.refund_status === 'refunded') return false
  if (!order.paid_at) return false

  const paidDate = new Date(order.paid_at).getTime()
  const windowDays = order.refund_window_days || 14
  const deadline = paidDate + (windowDays * 24 * 60 * 60 * 1000)
  return Date.now() <= deadline
}

function openRefundModal(order) {
  selectedOrder.value = order
  selectedItemId.value = order.items?.[0]?.id || null
  refundReason.value = ''
  refundError.value = ''
  refundSuccessMessage.value = ''
  showRefundModal.value = true
}

async function submitRefundRequest() {
  refundError.value = ''
  refundSuccessMessage.value = ''

  if (!refundReason.value || refundReason.value.trim().length < 10) {
    refundError.value = 'Please provide a clear reason for your refund request (minimum 10 characters).'
    return
  }

  refundSubmitting.value = true
  try {
    await ordersStore.requestRefund(selectedOrder.value.uuid, {
      order_item_id: selectedItemId.value,
      reason: refundReason.value,
    })
    refundSuccessMessage.value = 'Your refund request has been submitted and is pending review by the finance office.'
    await ordersStore.fetchStudentRefunds()
    await ordersStore.fetchStudentOrders()
    setTimeout(() => {
      showRefundModal.value = false
    }, 2000)
  } catch (err) {
    refundError.value = err.response?.data?.message || 'Could not submit refund request.'
  } finally {
    refundSubmitting.value = false
  }
}

async function handleDownloadReceipt(receipt) {
  if (receipt?.uuid) {
    await ordersStore.downloadReceiptPdf(receipt.uuid, receipt.receipt_number)
  }
}

async function handleDownloadCreditNote(creditNote) {
  if (creditNote?.uuid) {
    await ordersStore.downloadCreditNotePdf(creditNote.uuid, creditNote.credit_note_number)
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Page Header & Tab Navigation -->
    <div class="border-b border-white/10 pb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white">
          My Orders & Financial Ledger
        </h1>
        <p class="text-sm text-ink-300 mt-1">
          Review purchase history, download official receipts, and manage course refund requests & credit notes.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link to="/courses" class="btn btn-secondary text-xs">
          Browse Catalog
        </router-link>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div class="flex gap-3 border-b border-white/10">
      <button
        @click="activeTab = 'orders'"
        :class="[
          'pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2',
          activeTab === 'orders'
            ? 'border-brass-400 text-brass-300 font-bold'
            : 'border-transparent text-ink-400 hover:text-white'
        ]"
      >
        <span>Orders & Receipts</span>
        <span class="px-2 py-0.5 rounded-full text-xs bg-ink-800 text-ink-200">
          {{ orders.length }}
        </span>
      </button>

      <button
        @click="activeTab = 'refunds'"
        :class="[
          'pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2',
          activeTab === 'refunds'
            ? 'border-brass-400 text-brass-300 font-bold'
            : 'border-transparent text-ink-400 hover:text-white'
        ]"
      >
        <span>Refunds & Credit Notes</span>
        <span v-if="refunds.length" class="px-2 py-0.5 rounded-full text-xs bg-brass-500/20 text-brass-300 font-mono">
          {{ refunds.length }}
        </span>
      </button>
    </div>

    <!-- Global Loading Spinner -->
    <div v-if="ordersStore.loading && !orders.length" class="py-20 flex justify-center">
      <LoadingSpinner text="Loading financial records..." />
    </div>

    <!-- TAB 1: Orders & Receipts -->
    <div v-else-if="activeTab === 'orders'" class="space-y-4">
      <div v-if="!orders.length" class="py-12">
        <EmptyState
          title="No orders yet"
          description="You have not placed any course orders. Explore our conservatory curriculum to enroll in modules or complete courses."
        >
          <router-link to="/courses" class="btn btn-primary mt-4">
            Explore Courses
          </router-link>
        </EmptyState>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.id"
          class="glass p-6 rounded-2xl space-y-4 hover:border-brass-300/30 transition-all"
        >
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <span class="font-mono font-bold text-white text-base sm:text-lg">
                  {{ order.order_number }}
                </span>
                <span
                  :class="[
                    'badge text-xs font-semibold',
                    order.status === 'paid' ? 'badge-success' : '',
                    order.status === 'pending' ? 'badge-brass' : '',
                    order.status === 'expired' ? 'badge-danger' : '',
                  ]"
                >
                  {{ order.status.toUpperCase() }}
                </span>

                <span
                  v-if="order.refund_status && order.refund_status !== 'none'"
                  :class="[
                    'badge text-[11px] font-semibold',
                    order.refund_status === 'refunded' ? 'badge-danger' : 'badge-brass',
                  ]"
                >
                  {{ order.refund_status.toUpperCase() }}
                </span>
              </div>
              <p class="text-xs text-ink-400">
                Placed on {{ formatDate(order.created_at) }}
              </p>
            </div>

            <div class="text-right">
              <div class="text-lg font-bold text-white">
                KES {{ order.total_kes_formatted }}
              </div>
              <div class="text-xs text-ink-400">
                ${{ order.total_usd_formatted }} USD • VAT included
              </div>
            </div>
          </div>

          <!-- Items Summary -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="p-3 rounded-xl bg-ink-950/60 border border-white/5 space-y-1 text-xs"
            >
              <div class="flex justify-between">
                <span class="font-semibold text-white">{{ item.title }}</span>
                <span class="text-brass-300 font-mono">KES {{ (item.price_kes / 100).toLocaleString() }}</span>
              </div>
              <p v-if="item.meta?.level" class="text-ink-400 capitalize">
                Conservatory Level: {{ item.meta.level }}
              </p>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div class="flex items-center gap-2 text-xs text-ink-400">
              <span v-if="order.payment_method" class="uppercase">Method: {{ order.payment_method }}</span>
              <span v-if="order.paid_at">• Paid on {{ formatDate(order.paid_at) }}</span>
            </div>

            <div class="flex items-center gap-3">
              <router-link
                v-if="order.status === 'pending'"
                :to="{ path: '/checkout', query: { order: order.uuid } }"
                class="btn btn-primary text-xs"
              >
                Complete Checkout
              </router-link>

              <button
                v-if="order.status === 'paid' && order.receipt"
                @click="handleDownloadReceipt(order.receipt)"
                class="btn btn-secondary text-xs inline-flex items-center gap-1.5"
              >
                <svg class="w-4 h-4 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Receipt {{ order.receipt.receipt_number }} (PDF)
              </button>

              <button
                v-if="isEligibleForRefund(order)"
                @click="openRefundModal(order)"
                class="btn bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Request Refund
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: Refunds & Credit Notes -->
    <div v-else-if="activeTab === 'refunds'" class="space-y-6">
      <div v-if="!refunds.length" class="py-12">
        <EmptyState
          title="No refund requests"
          description="You do not have any active or past refund requests. All paid orders within 14 days are eligible for review in accordance with our conservatory policy."
        />
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="req in refunds"
          :key="req.id"
          class="glass p-6 rounded-2xl space-y-4 border border-white/5 hover:border-brass-300/30 transition-all"
        >
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <span class="font-mono font-bold text-white text-base">
                  Refund Request #{{ req.id }}
                </span>
                <span
                  :class="[
                    'badge text-xs font-semibold',
                    req.status === 'approved' ? 'badge-success' : '',
                    req.status === 'pending' ? 'badge-brass' : '',
                    req.status === 'rejected' ? 'badge-danger' : '',
                  ]"
                >
                  {{ req.status.toUpperCase() }}
                </span>
              </div>
              <p class="text-xs text-ink-400">
                For Order <span class="font-mono text-ink-200">{{ req.order_number }}</span> • Requested {{ formatDate(req.created_at) }}
              </p>
            </div>

            <div class="text-right">
              <div class="text-base font-bold text-white font-mono">
                KES {{ req.amount_kes_formatted }}
              </div>
              <div class="text-xs text-ink-400 font-mono">
                ${{ req.amount_usd_formatted }} USD
              </div>
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-3 rounded-xl bg-ink-950/60 border border-white/5 space-y-1">
              <span class="text-ink-400 block font-medium">Refund Reason:</span>
              <p class="text-ink-200 leading-relaxed">{{ req.reason }}</p>
            </div>

            <div v-if="req.review_notes" class="p-3 rounded-xl bg-ink-950/80 border border-white/10 space-y-1">
              <span class="text-brass-300 block font-semibold">Finance Office Decision Notes:</span>
              <p class="text-ink-300 leading-relaxed">{{ req.review_notes }}</p>
            </div>
          </div>

          <!-- Download Credit Note if Approved -->
          <div v-if="req.status === 'approved' && req.credit_note" class="flex items-center justify-between pt-2 border-t border-white/5">
            <div class="text-xs text-ink-300 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Credit Note Issued: <strong class="font-mono text-white">{{ req.credit_note.credit_note_number }}</strong></span>
            </div>

            <button
              @click="handleDownloadCreditNote(req.credit_note)"
              class="btn btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <svg class="w-4 h-4 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Credit Note (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Refund Request Modal -->
    <div v-if="showRefundModal && selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/85 backdrop-blur-sm">
      <div class="glass max-w-lg w-full p-6 sm:p-8 space-y-6 border-brass-400/30">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 class="text-lg font-display font-bold text-white">Request Course Refund</h2>
            <p class="text-xs text-ink-300 mt-0.5">Order {{ selectedOrder.order_number }}</p>
          </div>
          <button @click="showRefundModal = false" class="text-ink-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Policy notice -->
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1.5">
          <div class="flex items-center gap-1.5 font-bold text-amber-300">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Conservatory Refund Policy:
          </div>
          <ul class="list-disc pl-5 space-y-1 text-ink-300 text-[11px]">
            <li>14-day window from purchase date.</li>
            <li>Ineligible if course completion exceeds 50%.</li>
            <li>Ineligible if an official completion certificate has already been issued.</li>
            <li>Upon approval, access to the refunded module will be revoked and a formal Credit Note generated.</li>
          </ul>
        </div>

        <!-- Item Selector -->
        <div v-if="selectedOrder.items?.length > 1" class="space-y-2">
          <label class="field-label">Select Item for Refund</label>
          <div class="space-y-2">
            <label
              v-for="item in selectedOrder.items"
              :key="item.id"
              class="flex items-center justify-between p-3 rounded-xl bg-ink-950/60 border border-white/5 cursor-pointer hover:border-brass-300/30 text-xs"
            >
              <div class="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="refund_item"
                  :value="item.id"
                  v-model="selectedItemId"
                  class="text-brass-500 focus:ring-brass-400"
                />
                <span class="text-white font-medium">{{ item.title }}</span>
              </div>
              <span class="font-mono text-brass-300">KES {{ (item.price_kes / 100).toLocaleString() }}</span>
            </label>
          </div>
        </div>

        <!-- Reason Text Area -->
        <div class="space-y-1">
          <label class="field-label" for="refundReason">Reason for Refund Request</label>
          <textarea
            id="refundReason"
            v-model="refundReason"
            rows="3"
            placeholder="Please detail why you are requesting a refund for this enrollment..."
            class="field-input"
            :disabled="refundSubmitting"
          ></textarea>
        </div>

        <div v-if="refundError" class="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-300">
          {{ refundError }}
        </div>

        <div v-if="refundSuccessMessage" class="p-3 rounded-lg bg-success-500/10 border border-success-500/20 text-xs text-success-300">
          {{ refundSuccessMessage }}
        </div>

        <div class="flex gap-3 pt-2">
          <button
            @click="submitRefundRequest"
            :disabled="refundSubmitting"
            class="flex-1 btn bg-rose-600 hover:bg-rose-500 text-white font-bold"
          >
            <span v-if="refundSubmitting">Submitting...</span>
            <span v-else>Submit Refund Request</span>
          </button>
          <button @click="showRefundModal = false" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
