<script setup>
import { onMounted, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const ordersStore = useOrdersStore()

onMounted(async () => {
  await ordersStore.fetchStudentOrders()
})

const orders = computed(() => ordersStore.studentOrders)

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
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <div class="border-b border-white/10 pb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-white">
          My Orders & Official Receipts
        </h1>
        <p class="text-sm text-ink-300 mt-1">
          Review your purchase history, check payment statuses, and download official stamped PDF receipts.
        </p>
      </div>

      <router-link to="/courses" class="btn btn-secondary text-xs">
        Browse Course Catalog
      </router-link>
    </div>

    <div v-if="ordersStore.loading" class="py-20 flex justify-center">
      <LoadingSpinner text="Loading your orders..." />
    </div>

    <div v-else-if="!orders.length" class="py-12">
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
