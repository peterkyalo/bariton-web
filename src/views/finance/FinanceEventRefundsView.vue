<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEventsStore } from '@/stores/events'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'
import Modal from '@/components/ui/Modal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const eventsStore = useEventsStore()
const ui = useUiStore()

const statusFilter = ref('pending')
const refunds = computed(() => eventsStore.financeRefunds)

const showApprove = ref(false)
const showReject = ref(false)
const active = ref(null)
const manualReference = ref('')
const rejectReason = ref('')
const submitting = ref(false)

async function load() {
  try {
    await eventsStore.fetchFinanceRefunds(statusFilter.value ? { status: statusFilter.value } : {})
  } catch (err) {
    ui.notify({ type: 'error', title: 'Could not load refunds', message: parseError(err).message })
  }
}

function money(minor) {
  return (Number(minor || 0) / 100).toLocaleString('en-KE', { minimumFractionDigits: 2 })
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
}

function openApprove(refund) {
  active.value = refund
  manualReference.value = ''
  showApprove.value = true
}

function openReject(refund) {
  active.value = refund
  rejectReason.value = ''
  showReject.value = true
}

async function approve() {
  submitting.value = true
  try {
    const res = await eventsStore.approveRefund(active.value.uuid, manualReference.value || null)
    ui.notify({ type: 'success', title: 'Refund approved', message: res.message })
    showApprove.value = false
    await load()
  } catch (err) {
    ui.notify({ type: 'error', title: 'Approval failed', message: parseError(err).message })
  } finally {
    submitting.value = false
  }
}

async function reject() {
  submitting.value = true
  try {
    const res = await eventsStore.rejectRefund(active.value.uuid, rejectReason.value)
    ui.notify({ type: 'success', title: 'Refund rejected', message: res.message })
    showReject.value = false
    await load()
  } catch (err) {
    ui.notify({ type: 'error', title: 'Rejection failed', message: parseError(err).message })
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-white">Event Refund Requests</h1>
        <p class="text-sm text-ink-300 mt-1">
          Review refund requests for bootcamps and workshops. Approving issues a credit note and releases the seat to the waitlist.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <select
          id="event-refund-status"
          v-model="statusFilter"
          class="px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white"
          @change="load"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
        <router-link to="/finance/refunds" class="btn btn-secondary text-xs">Course Refunds</router-link>
      </div>
    </div>

    <div v-if="eventsStore.loading && !refunds.length" class="py-20 flex justify-center">
      <LoadingSpinner text="Loading event refunds..." />
    </div>

    <div v-else-if="!refunds.length" class="py-12">
      <EmptyState title="No event refund requests" description="Nothing matches the selected filter." />
    </div>

    <div v-else class="glass rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-ink-200">
          <thead class="bg-ink-950/80 text-ink-400 uppercase tracking-wider text-[10px] border-b border-white/10">
            <tr>
              <th class="py-3.5 px-4 font-semibold">Requested</th>
              <th class="py-3.5 px-4 font-semibold">Student</th>
              <th class="py-3.5 px-4 font-semibold">Event</th>
              <th class="py-3.5 px-4 font-semibold">Amount</th>
              <th class="py-3.5 px-4 font-semibold">Reason</th>
              <th class="py-3.5 px-4 font-semibold">Status</th>
              <th class="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="r in refunds" :key="r.uuid" class="hover:bg-white/[0.02]">
              <td class="py-4 px-4 text-ink-300">{{ formatDate(r.created_at) }}</td>
              <td class="py-4 px-4">
                <div class="font-semibold text-white">{{ r.user?.name || '-' }}</div>
                <div class="text-[11px] text-ink-400">{{ r.user?.email }}</div>
              </td>
              <td class="py-4 px-4 text-ink-300">{{ r.event_booking?.event?.title || '-' }}</td>
              <td class="py-4 px-4 font-mono font-bold text-white">KES {{ money(r.amount_kes) }}</td>
              <td class="py-4 px-4 max-w-xs"><p class="truncate text-ink-300" :title="r.reason">{{ r.reason }}</p></td>
              <td class="py-4 px-4">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                    r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300'
                      : r.status === 'rejected' ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300',
                  ]"
                >{{ r.status }}</span>
              </td>
              <td class="py-4 px-4 text-right whitespace-nowrap">
                <template v-if="r.status === 'pending'">
                  <button class="btn btn-primary text-xs py-1 px-3 mr-2" @click="openApprove(r)">Approve</button>
                  <button class="btn btn-secondary text-xs py-1 px-3" @click="openReject(r)">Reject</button>
                </template>
                <span v-else class="text-ink-500">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal :open="showApprove" title="Approve Event Refund" @close="showApprove = false">
      <form class="space-y-4" @submit.prevent="approve">
        <p class="text-xs text-ink-300">
          Approve a refund of <strong class="text-white">KES {{ money(active?.amount_kes) }}</strong>
          for {{ active?.user?.name }}. A credit note will be issued.
        </p>
        <div>
          <label class="block text-xs font-semibold text-ink-300 uppercase mb-1">Manual payout reference (optional)</label>
          <input v-model="manualReference" maxlength="100" type="text" class="w-full px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white" />
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-secondary text-xs" @click="showApprove = false">Cancel</button>
          <button type="submit" class="btn btn-primary text-xs font-bold" :disabled="submitting">Confirm Approval</button>
        </div>
      </form>
    </Modal>

    <Modal :open="showReject" title="Reject Event Refund" @close="showReject = false">
      <form class="space-y-4" @submit.prevent="reject">
        <div>
          <label class="block text-xs font-semibold text-ink-300 uppercase mb-1">Reason (min 5 characters) *</label>
          <textarea v-model="rejectReason" rows="3" required minlength="5" maxlength="1000" class="w-full px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white"></textarea>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-secondary text-xs" @click="showReject = false">Cancel</button>
          <button type="submit" class="btn btn-primary text-xs font-bold" :disabled="submitting">Reject Request</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
