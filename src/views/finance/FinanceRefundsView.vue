<script setup>
import { ref, onMounted, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const ordersStore = useOrdersStore()

const statusFilter = ref('')
const showReviewModal = ref(false)
const selectedRequest = ref(null)
const decision = ref('approved')
const reviewNotes = ref('')
const refundReference = ref('')
const reviewError = ref('')
const reviewSubmitting = ref(false)

onMounted(async () => {
  await loadRefunds()
})

async function loadRefunds() {
  await ordersStore.fetchFinanceRefunds({
    status: statusFilter.value || undefined,
  })
}

function handleFilterChange() {
  loadRefunds()
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

function openReviewModal(req) {
  selectedRequest.value = req
  decision.value = 'approved'
  reviewNotes.value = ''
  refundReference.value = ''
  reviewError.value = ''
  showReviewModal.value = true
}

async function submitReview() {
  reviewError.value = ''

  if (decision.value === 'rejected' && (!reviewNotes.value || reviewNotes.value.trim().length < 5)) {
    reviewError.value = 'Please state the reason for rejecting this refund request in the notes field.'
    return
  }

  reviewSubmitting.value = true
  try {
    await ordersStore.reviewRefundRequest(selectedRequest.value.uuid, {
      decision: decision.value,
      review_notes: reviewNotes.value,
      refund_reference: refundReference.value || undefined,
    })
    showReviewModal.value = false
    await loadRefunds()
  } catch (err) {
    reviewError.value = err.response?.data?.message || 'Failed to process refund review.'
  } finally {
    reviewSubmitting.value = false
  }
}

async function handleDownloadCreditNote(creditNote) {
  if (creditNote?.uuid) {
    await ordersStore.downloadCreditNotePdf(creditNote.uuid, creditNote.credit_note_number)
  }
}

const refundRequests = computed(() => ordersStore.financeRefunds)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-white">
          Refund Review Queue
        </h1>
        <p class="text-sm text-ink-300 mt-1">
          Review, approve, or reject student enrollment refund requests, trigger gateway reversals, and generate official Credit Notes.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link to="/finance/credit-notes" class="btn btn-secondary text-xs">
          View Credit Notes Ledger
        </router-link>
        <router-link to="/finance/payments" class="btn btn-secondary text-xs">
          Payments Ledger
        </router-link>
      </div>
    </div>

    <!-- Filters & Controls -->
    <div class="glass p-4 rounded-xl flex flex-wrap gap-4 items-center">
      <div class="flex items-center gap-2 text-xs">
        <label class="text-ink-400 font-medium">Status:</label>
        <select
          v-model="statusFilter"
          @change="handleFilterChange"
          class="field-input py-1.5 px-3 text-xs w-44"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <button @click="loadRefunds" class="btn btn-secondary text-xs ml-auto">
        Refresh Queue
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="ordersStore.loading && !refundRequests.length" class="py-20 flex justify-center">
      <LoadingSpinner text="Loading refund queue..." />
    </div>

    <!-- Empty State -->
    <div v-else-if="!refundRequests.length" class="py-12">
      <EmptyState
        title="No refund requests found"
        description="There are currently no refund requests matching the selected filter criteria."
      />
    </div>

    <!-- Table -->
    <div v-else class="glass rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-ink-200">
          <thead class="bg-ink-950/80 text-ink-400 uppercase tracking-wider text-[10px] border-b border-white/10">
            <tr>
              <th class="py-3.5 px-4 font-semibold">Request</th>
              <th class="py-3.5 px-4 font-semibold">Student</th>
              <th class="py-3.5 px-4 font-semibold">Order / Course Item</th>
              <th class="py-3.5 px-4 font-semibold">Amount</th>
              <th class="py-3.5 px-4 font-semibold">Reason</th>
              <th class="py-3.5 px-4 font-semibold">Status</th>
              <th class="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="req in refundRequests"
              :key="req.id"
              class="hover:bg-white/[0.02] transition-colors"
            >
              <td class="py-4 px-4 font-mono">
                <div class="font-bold text-white">#{{ req.id }}</div>
                <div class="text-[11px] text-ink-400">{{ formatDate(req.created_at) }}</div>
              </td>

              <td class="py-4 px-4">
                <div class="font-semibold text-white">{{ req.student?.name || 'Student' }}</div>
                <div class="text-[11px] text-ink-400">{{ req.student?.email }}</div>
              </td>

              <td class="py-4 px-4">
                <div class="font-mono text-brass-300 font-medium">{{ req.order_number }}</div>
                <div class="text-white max-w-xs truncate">{{ req.item_title }}</div>
              </td>

              <td class="py-4 px-4 font-mono">
                <div class="font-bold text-white">KES {{ req.amount_kes_formatted }}</div>
                <div class="text-[11px] text-ink-400">${{ req.amount_usd_formatted }} USD</div>
              </td>

              <td class="py-4 px-4 max-w-xs">
                <p class="truncate text-ink-300" :title="req.reason">{{ req.reason }}</p>
                <div v-if="req.review_notes" class="text-[10px] text-ink-400 mt-1 italic">
                  Notes: {{ req.review_notes }}
                </div>
              </td>

              <td class="py-4 px-4">
                <span
                  :class="[
                    'badge text-[10px] font-bold uppercase',
                    req.status === 'approved' ? 'badge-success' : '',
                    req.status === 'pending' ? 'badge-brass' : '',
                    req.status === 'rejected' ? 'badge-danger' : '',
                  ]"
                >
                  {{ req.status }}
                </span>
              </td>

              <td class="py-4 px-4 text-right">
                <button
                  v-if="req.status === 'pending'"
                  @click="openReviewModal(req)"
                  class="btn btn-primary text-xs py-1 px-3"
                >
                  Review
                </button>

                <button
                  v-else-if="req.status === 'approved' && req.credit_note"
                  @click="handleDownloadCreditNote(req.credit_note)"
                  class="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                >
                  <svg class="w-3.5 h-3.5 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CRN PDF
                </button>

                <span v-else class="text-ink-500 text-xs italic">
                  Reviewed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="showReviewModal && selectedRequest" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/85 backdrop-blur-sm">
      <div class="glass max-w-lg w-full p-6 sm:p-8 space-y-6 border-brass-400/30">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 class="text-lg font-display font-bold text-white">Review Refund Request #{{ selectedRequest.id }}</h2>
            <p class="text-xs text-ink-300 mt-0.5">Order {{ selectedRequest.order_number }} • Student: {{ selectedRequest.student?.name }}</p>
          </div>
          <button @click="showReviewModal = false" class="text-ink-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="glass p-4 rounded-xl text-xs space-y-2 bg-ink-950/60">
          <div class="flex justify-between text-ink-300">
            <span>Course Item:</span>
            <span class="text-white font-medium">{{ selectedRequest.item_title }}</span>
          </div>
          <div class="flex justify-between text-ink-300">
            <span>Refund Amount:</span>
            <span class="font-bold text-brass-300 font-mono">KES {{ selectedRequest.amount_kes_formatted }} (${{ selectedRequest.amount_usd_formatted }} USD)</span>
          </div>
          <div class="border-t border-white/5 pt-2 text-ink-300">
            <span class="text-ink-400 block mb-1">Student Reason:</span>
            <p class="text-ink-100 bg-ink-900/60 p-2.5 rounded-lg text-[11px] leading-relaxed">{{ selectedRequest.reason }}</p>
          </div>
        </div>

        <!-- Decision Selection -->
        <div class="space-y-2">
          <label class="field-label">Decision</label>
          <div class="grid grid-cols-2 gap-3">
            <label
              :class="[
                'flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-semibold text-xs transition-all',
                decision === 'approved'
                  ? 'bg-success-500/20 border-success-500/50 text-success-300'
                  : 'bg-ink-950/40 border-white/10 text-ink-400 hover:text-white'
              ]"
            >
              <input type="radio" value="approved" v-model="decision" class="sr-only" />
              <span>✓ Approve & Issue Credit Note</span>
            </label>

            <label
              :class="[
                'flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-semibold text-xs transition-all',
                decision === 'rejected'
                  ? 'bg-danger-500/20 border-danger-500/50 text-danger-300'
                  : 'bg-ink-950/40 border-white/10 text-ink-400 hover:text-white'
              ]"
            >
              <input type="radio" value="rejected" v-model="decision" class="sr-only" />
              <span>✕ Reject Request</span>
            </label>
          </div>
        </div>

        <!-- Optional Manual Reference -->
        <div v-if="decision === 'approved'" class="space-y-1">
          <label class="field-label" for="ref">Manual Refund Reference (Optional)</label>
          <input
            id="ref"
            v-model="refundReference"
            type="text"
            placeholder="e.g. MPESA-REV-849302 or CHK-99201"
            class="field-input font-mono text-xs"
            :disabled="reviewSubmitting"
          />
          <p class="field-hint">Leave blank to use automated gateway refund driver reference.</p>
        </div>

        <!-- Review Notes -->
        <div class="space-y-1">
          <label class="field-label" for="reviewNotes">
            Review Notes <span v-if="decision === 'rejected'" class="text-danger-400">*</span>
          </label>
          <textarea
            id="reviewNotes"
            v-model="reviewNotes"
            rows="3"
            placeholder="Notes sent to the student regarding this decision..."
            class="field-input text-xs"
            :disabled="reviewSubmitting"
          ></textarea>
        </div>

        <div v-if="reviewError" class="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-300">
          {{ reviewError }}
        </div>

        <div class="flex gap-3 pt-2">
          <button
            @click="submitReview"
            :disabled="reviewSubmitting"
            :class="[
              'flex-1 btn font-bold text-xs',
              decision === 'approved' ? 'bg-success-600 hover:bg-success-500 text-white' : 'bg-danger-600 hover:bg-danger-500 text-white'
            ]"
          >
            <span v-if="reviewSubmitting">Processing...</span>
            <span v-else>Confirm {{ decision === 'approved' ? 'Approval' : 'Rejection' }}</span>
          </button>
          <button @click="showReviewModal = false" class="btn btn-secondary text-xs">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
