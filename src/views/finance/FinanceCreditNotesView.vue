<script setup>
import { onMounted, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const ordersStore = useOrdersStore()

onMounted(async () => {
  await ordersStore.fetchFinanceCreditNotes()
})

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

async function handleDownload(creditNote) {
  if (creditNote?.uuid) {
    await ordersStore.downloadCreditNotePdf(creditNote.uuid, creditNote.credit_note_number)
  }
}

const creditNotes = computed(() => ordersStore.financeCreditNotes)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-white">
          Credit Notes Registry
        </h1>
        <p class="text-sm text-ink-300 mt-1">
          Complete statutory record of sequentially-numbered Credit Notes issued for tuition reversals and course module refunds.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link to="/finance/refunds" class="btn btn-secondary text-xs">
          Refund Review Queue
        </router-link>
        <router-link to="/finance/payments" class="btn btn-secondary text-xs">
          Payments Ledger
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="ordersStore.loading && !creditNotes.length" class="py-20 flex justify-center">
      <LoadingSpinner text="Loading credit notes registry..." />
    </div>

    <!-- Empty State -->
    <div v-else-if="!creditNotes.length" class="py-12">
      <EmptyState
        title="No Credit Notes Issued"
        description="There are currently no credit notes in the registry. Approved refunds automatically generate numbered credit notes here."
      />
    </div>

    <!-- Table -->
    <div v-else class="glass rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-ink-200">
          <thead class="bg-ink-950/80 text-ink-400 uppercase tracking-wider text-[10px] border-b border-white/10">
            <tr>
              <th class="py-3.5 px-4 font-semibold">Credit Note #</th>
              <th class="py-3.5 px-4 font-semibold">Date Issued</th>
              <th class="py-3.5 px-4 font-semibold">Student</th>
              <th class="py-3.5 px-4 font-semibold">Original Order</th>
              <th class="py-3.5 px-4 font-semibold">Amount Credited</th>
              <th class="py-3.5 px-4 font-semibold">Reason</th>
              <th class="py-3.5 px-4 font-semibold text-right">Download</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="cn in creditNotes"
              :key="cn.id"
              class="hover:bg-white/[0.02] transition-colors"
            >
              <td class="py-4 px-4 font-mono font-bold text-brass-300">
                {{ cn.credit_note_number }}
              </td>

              <td class="py-4 px-4 text-ink-300">
                {{ formatDate(cn.created_at) }}
              </td>

              <td class="py-4 px-4">
                <div class="font-semibold text-white">{{ cn.student?.name || 'Student' }}</div>
                <div class="text-[11px] text-ink-400">{{ cn.student?.email }}</div>
              </td>

              <td class="py-4 px-4 font-mono text-ink-300">
                {{ cn.order?.order_number || '-' }}
              </td>

              <td class="py-4 px-4 font-mono">
                <div class="font-bold text-white">KES {{ cn.amount_kes_formatted }}</div>
                <div class="text-[11px] text-ink-400">${{ cn.amount_usd_formatted }} USD</div>
              </td>

              <td class="py-4 px-4 max-w-xs">
                <p class="truncate text-ink-300" :title="cn.reason">{{ cn.reason }}</p>
              </td>

              <td class="py-4 px-4 text-right">
                <button
                  @click="handleDownload(cn)"
                  class="btn btn-secondary text-xs py-1 px-3 inline-flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PDF
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
