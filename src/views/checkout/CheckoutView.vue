<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const authStore = useAuthStore()

const activeTab = ref('mpesa') // 'mpesa' | 'cash'
const phone = ref('')
const phoneError = ref('')
const countdownSeconds = ref(0)
let timerInterval = null

// Formatted phone prefilled from user profile if available
onMounted(async () => {
  if (authStore.user?.phone) {
    phone.value = authStore.user.phone
  }

  const orderUuid = route.query.order
  const itemType = route.query.type
  const itemId = route.query.id

  if (orderUuid) {
    try {
      await ordersStore.fetchOrder(orderUuid)
      startExpiryTimer()
    } catch {
      // Handled in store
    }
  } else if (itemType && itemId) {
    try {
      await ordersStore.createOrder(itemType, parseInt(itemId, 10))
      startExpiryTimer()
    } catch {
      // Handled in store
    }
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const order = computed(() => ordersStore.activeOrder)

function startExpiryTimer() {
  if (!order.value?.expires_at) return
  const expiryTime = new Date(order.value.expires_at).getTime()

  const updateRemaining = () => {
    const diff = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000))
    countdownSeconds.value = diff
    if (diff === 0 && timerInterval) {
      clearInterval(timerInterval)
      if (order.value) order.value.status = 'expired'
    }
  }

  updateRemaining()
  timerInterval = setInterval(updateRemaining, 1000)
}

const formattedCountdown = computed(() => {
  const m = Math.floor(countdownSeconds.value / 60)
  const s = countdownSeconds.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

async function handleMpesaPay() {
  phoneError.value = ''
  const cleaned = phone.value.replace(/[^0-9]/g, '')
  if (!cleaned || cleaned.length < 9) {
    phoneError.value = 'Please enter a valid Kenyan phone number (e.g. 0712345678).'
    return
  }

  if (!order.value) return

  try {
    await ordersStore.initiateMpesa(order.value.uuid, cleaned)
    // Begin polling status
    const pollResult = await ordersStore.pollOrderStatus(order.value.uuid)
    if (pollResult.status === 'paid') {
      await ordersStore.fetchOrder(order.value.uuid)
    }
  } catch (err) {
    // Handled in store
  }
}

async function handleDownloadReceipt() {
  if (order.value?.receipt?.uuid) {
    await ordersStore.downloadReceiptPdf(order.value.receipt.uuid, order.value.receipt.receipt_number)
  }
}

function handleGoToCourse() {
  const firstItem = order.value?.items?.[0]
  if (firstItem?.item_type === 'course_bundle' && firstItem?.meta?.course_id) {
    router.push({ name: 'student.courses' })
  } else {
    router.push({ name: 'student.courses' })
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <router-link to="/courses" class="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-brass-300 transition-colors mb-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </router-link>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-white">
          Enrollment Checkout
        </h1>
        <p class="text-sm text-ink-300 mt-1">
          Complete your payment securely with Safaricom M-Pesa or at our school bursar desk.
        </p>
      </div>

      <!-- Expiry Timer -->
      <div v-if="order && order.status === 'pending'" class="flex items-center gap-2 glass px-3.5 py-1.5 rounded-xl border-brass-300/20">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brass-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-brass-400"></span>
        </span>
        <span class="text-xs text-ink-300">Order expires in:</span>
        <span class="font-mono text-sm font-bold text-brass-300">{{ formattedCountdown }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="ordersStore.loading && !order" class="py-24 text-center">
      <LoadingSpinner text="Preparing your order..." />
    </div>

    <!-- Error State without Order -->
    <div v-else-if="ordersStore.error && !order" class="glass p-8 text-center space-y-4">
      <div class="w-12 h-12 mx-auto rounded-full bg-danger-500/10 border border-danger-500/20 flex items-center justify-center text-danger-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 class="text-lg font-bold text-white">Could Not Load Order</h2>
      <p class="text-sm text-ink-300 max-w-md mx-auto">{{ ordersStore.error }}</p>
      <router-link to="/courses" class="btn btn-secondary">
        Return to Catalog
      </router-link>
    </div>

    <!-- Checkout Grid -->
    <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Left Column: Payment Section -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Order Paid Success State -->
        <div v-if="order.status === 'paid'" class="glass p-8 text-center space-y-6 border-success-500/30">
          <div class="w-16 h-16 mx-auto rounded-full bg-success-500/10 border border-success-500/30 flex items-center justify-center text-success-400 animate-bounce">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div class="space-y-2">
            <h2 class="text-2xl font-display font-bold text-white">Payment Confirmed!</h2>
            <p class="text-sm text-ink-300 max-w-md mx-auto">
              Your enrollment is active and all lessons for this purchase have been unlocked immediately.
            </p>
          </div>

          <div class="glass p-4 rounded-xl text-left text-xs space-y-2 bg-ink-950/60">
            <div class="flex justify-between text-ink-300">
              <span>Order Number:</span>
              <span class="font-mono text-white">{{ order.order_number }}</span>
            </div>
            <div class="flex justify-between text-ink-300">
              <span>Payment Method:</span>
              <span class="uppercase font-semibold text-brass-300">{{ order.payment_method }}</span>
            </div>
            <div v-if="order.receipt" class="flex justify-between text-ink-300">
              <span>Official Receipt:</span>
              <span class="font-mono text-success-400 font-bold">{{ order.receipt.receipt_number }}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button @click="handleGoToCourse" class="btn btn-primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Start Learning Now
            </button>

            <button v-if="order.receipt" @click="handleDownloadReceipt" class="btn btn-secondary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF Receipt
            </button>
          </div>
        </div>

        <!-- Order Expired State -->
        <div v-else-if="order.status === 'expired'" class="glass p-8 text-center space-y-4 border-danger-500/30">
          <div class="w-12 h-12 mx-auto rounded-full bg-danger-500/10 border border-danger-500/20 flex items-center justify-center text-danger-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-white">Order Expired</h2>
          <p class="text-sm text-ink-300 max-w-md mx-auto">
            This checkout session has expired after 30 minutes. Please return to the course page and initiate a new order.
          </p>
          <router-link to="/courses" class="btn btn-primary">
            Explore Courses
          </router-link>
        </div>

        <!-- Active Payment Form (Pending) -->
        <div v-else class="glass p-6 sm:p-8 space-y-6">
          <!-- Method Selection Tabs -->
          <div class="grid grid-cols-2 gap-3 p-1 rounded-xl bg-ink-950/60 border border-white/5">
            <button
              @click="activeTab = 'mpesa'"
              :class="[
                'flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all',
                activeTab === 'mpesa'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                  : 'text-ink-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-green-400"></span>
              Safaricom M-Pesa
            </button>

            <button
              @click="activeTab = 'cash'"
              :class="[
                'flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all',
                activeTab === 'cash'
                  ? 'bg-brass-500 text-ink-950 shadow-lg'
                  : 'text-ink-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              School Office Cash
            </button>
          </div>

          <!-- Tab 1: M-Pesa STK Push -->
          <div v-if="activeTab === 'mpesa'" class="space-y-6">
            <!-- STK Polling State -->
            <div v-if="ordersStore.paymentStatus === 'polling'" class="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-4">
              <div class="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></div>
                <div class="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 class="text-base font-bold text-white">Prompt Sent to Your Handset</h3>
                <p class="text-xs text-ink-300 mt-1 max-w-sm mx-auto">
                  {{ ordersStore.paymentMessage }}
                </p>
              </div>

              <div class="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Awaiting M-Pesa PIN confirmation...
              </div>
            </div>

            <!-- M-Pesa Input Form -->
            <div v-else class="space-y-4">
              <div>
                <label class="field-label" for="phone">Kenyan Phone Number</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400 text-sm">
                    🇰🇪 +254
                  </div>
                  <input
                    id="phone"
                    v-model="phone"
                    type="tel"
                    placeholder="712 345 678"
                    class="field-input pl-20"
                    :disabled="ordersStore.paymentStatus === 'initiating'"
                  />
                </div>
                <p v-if="phoneError" class="field-error">{{ phoneError }}</p>
                <p class="field-hint">Enter your Safaricom line (07... or 01...). An instant STK prompt will appear on your phone.</p>
              </div>

              <div v-if="ordersStore.error" class="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-300">
                {{ ordersStore.error }}
              </div>

              <button
                @click="handleMpesaPay"
                :disabled="ordersStore.loading"
                class="w-full btn bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-3.5 shadow-lg shadow-emerald-900/30"
              >
                <span v-if="ordersStore.loading" class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Processing...
                </span>
                <span v-else>
                  Pay KES {{ order.total_kes_formatted }} via M-Pesa STK Push
                </span>
              </button>
            </div>
          </div>

          <!-- Tab 2: Cash Payment Instructions -->
          <div v-else-if="activeTab === 'cash'" class="space-y-6">
            <div class="p-5 rounded-xl bg-brass-500/10 border border-brass-500/20 space-y-3">
              <div class="flex items-center gap-2 text-brass-300 font-semibold text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                In-Person Cash Payment Instructions
              </div>
              <p class="text-xs text-ink-300 leading-relaxed">
                You can pay physical cash at our school office cashier. Present your order reference number below to receive an official stamped receipt and immediate account activation.
              </p>
            </div>

            <div class="space-y-3 text-xs text-ink-200">
              <div class="glass p-3 rounded-lg flex justify-between items-center bg-ink-950/60">
                <span class="text-ink-400">Order Reference:</span>
                <span class="font-mono font-bold text-white text-sm">{{ order.order_number }}</span>
              </div>
              <div class="glass p-3 rounded-lg flex justify-between items-center bg-ink-950/60">
                <span class="text-ink-400">Amount Due:</span>
                <span class="font-bold text-brass-300 text-sm">KES {{ order.total_kes_formatted }}</span>
              </div>
              <div class="glass p-3 rounded-lg flex justify-between items-center bg-ink-950/60">
                <span class="text-ink-400">Campus Location:</span>
                <span class="text-white">Karen Main Campus & Westlands Center</span>
              </div>
              <div class="glass p-3 rounded-lg flex justify-between items-center bg-ink-950/60">
                <span class="text-ink-400">Finance Office Hours:</span>
                <span class="text-white">Mon–Fri: 8:00 AM – 5:00 PM | Sat: 9:00 AM – 1:00 PM</span>
              </div>
            </div>

            <div class="pt-2">
              <router-link to="/student/orders" class="w-full btn btn-secondary text-center">
                View in My Orders
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Order Summary -->
      <div class="lg:col-span-5 space-y-6">
        <div class="glass p-6 sm:p-8 space-y-6 sticky top-6">
          <h2 class="text-lg font-display font-bold text-white border-b border-white/10 pb-4">
            Order Summary
          </h2>

          <!-- Purchased Items List -->
          <div class="space-y-4">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-ink-950/60 border border-white/5"
            >
              <div class="space-y-1">
                <span class="badge badge-brass text-[10px] uppercase tracking-wider">
                  {{ item.item_type.replace('_', ' ') }}
                </span>
                <h3 class="text-sm font-semibold text-white leading-snug">
                  {{ item.title }}
                </h3>
                <p v-if="item.meta?.module_count" class="text-xs text-ink-400">
                  {{ item.meta.module_count }} Comprehensive Conservatory Levels
                </p>
                <p v-else-if="item.meta?.level" class="text-xs text-ink-400 capitalize">
                  Level: {{ item.meta.level }}
                </p>
              </div>

              <div class="text-right">
                <div class="text-sm font-bold text-white">
                  KES {{ (item.price_kes / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Price Calculation Breakdown -->
          <div class="space-y-2 text-xs border-t border-white/10 pt-4">
            <div class="flex justify-between text-ink-300">
              <span>Subtotal:</span>
              <span class="text-white">KES {{ order.total_kes_formatted }}</span>
            </div>
            <div class="flex justify-between text-ink-400">
              <span>VAT ({{ order.vat_rate_percent }}% included):</span>
              <span>KES {{ order.vat_kes_formatted }}</span>
            </div>
            <div class="flex justify-between text-ink-400">
              <span>Approx. USD (rate 130):</span>
              <span>${{ order.total_usd_formatted }}</span>
            </div>
            <div class="flex justify-between text-base font-bold text-white pt-3 border-t border-white/5">
              <span>Total Due:</span>
              <span class="text-gradient-brass font-display text-lg">KES {{ order.total_kes_formatted }}</span>
            </div>
          </div>

          <!-- Security Guarantee Notice -->
          <div class="flex items-center gap-3 p-3 rounded-lg bg-ink-950/40 border border-white/5 text-[11px] text-ink-400">
            <svg class="w-5 h-5 text-brass-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Official Bariton Music Academy receipt issued upon confirmation. Safe & encrypted.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
