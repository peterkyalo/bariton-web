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

const activeTab = ref('mpesa') // 'mpesa' | 'card' | 'paypal' | 'cash'
const phone = ref('')
const phoneError = ref('')
const countdownSeconds = ref(0)
let timerInterval = null

// Card state (Stripe in KES)
const cardHolder = ref('')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvc = ref('')
const cardError = ref('')
const is3dSecureVerifying = ref(false)

// PayPal state (USD locked rate)
const showPaypalModal = ref(false)
const paypalApprovalData = ref(null)

onMounted(async () => {
  if (authStore.user?.phone) {
    phone.value = authStore.user.phone
  }
  if (authStore.user?.name) {
    cardHolder.value = authStore.user.name
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

// M-Pesa Payment
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
    const pollResult = await ordersStore.pollOrderStatus(order.value.uuid)
    if (pollResult.status === 'paid') {
      await ordersStore.fetchOrder(order.value.uuid)
    }
  } catch {
    // Handled in store
  }
}

// Card Payment (Stripe test mode)
function fillTestCard() {
  cardHolder.value = authStore.user?.name || 'Jane Wanjiku'
  cardNumber.value = '4242 4242 4242 4242'
  cardExpiry.value = '12/28'
  cardCvc.value = '123'
  cardError.value = ''
}

async function handleCardPay() {
  cardError.value = ''
  const rawNum = cardNumber.value.replace(/\s+/g, '')
  if (!rawNum || rawNum.length < 15) {
    cardError.value = 'Please enter a valid 16-digit card number.'
    return
  }
  if (!cardExpiry.value || !cardExpiry.value.includes('/')) {
    cardError.value = 'Please enter expiration date as MM/YY.'
    return
  }
  if (!cardCvc.value || cardCvc.value.length < 3) {
    cardError.value = 'Please enter a valid 3 or 4-digit CVC code.'
    return
  }

  if (!order.value) return

  try {
    is3dSecureVerifying.value = true
    const initRes = await ordersStore.initiateStripe(order.value.uuid)
    
    // Simulate 3D Secure 2.0 biometric / OTP verification delay
    await new Promise((resolve) => setTimeout(resolve, 1200))
    
    // Confirm PaymentIntent
    await ordersStore.confirmStripe(order.value.uuid, {
      payment_intent_id: initRes.payment_intent_id,
    })
    
    await ordersStore.fetchOrder(order.value.uuid)
  } catch (err) {
    cardError.value = err.response?.data?.message || 'Card payment failed. Please verify your details.'
  } finally {
    is3dSecureVerifying.value = false
  }
}

// PayPal Payment
async function handlePaypalInitiate() {
  if (!order.value) return
  try {
    const res = await ordersStore.initiatePaypal(order.value.uuid)
    paypalApprovalData.value = res
    showPaypalModal.value = true
  } catch {
    // Handled in store
  }
}

async function handlePaypalApprove() {
  if (!order.value || !paypalApprovalData.value) return
  try {
    await ordersStore.capturePaypal(order.value.uuid, {
      paypal_order_id: paypalApprovalData.value.paypal_order_id,
      payer_id: 'PAYER_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    })
    showPaypalModal.value = false
    await ordersStore.fetchOrder(order.value.uuid)
  } catch {
    // Handled in store
  }
}

async function handleDownloadReceipt() {
  if (order.value?.receipt?.uuid) {
    await ordersStore.downloadReceiptPdf(order.value.receipt.uuid, order.value.receipt.receipt_number)
  }
}

function handleGoToCourse() {
  router.push({ name: 'student.courses' })
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
          Choose your preferred method: M-Pesa, Card (Stripe), PayPal, or in-person cash.
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
              <span class="uppercase font-semibold text-brass-300">{{ order.payment_method || 'CONFIRMED' }}</span>
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
          <!-- Method Selection Tabs: 4 Options -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-xl bg-ink-950/60 border border-white/5">
            <!-- M-Pesa -->
            <button
              @click="activeTab = 'mpesa'"
              :class="[
                'flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-medium text-xs transition-all',
                activeTab === 'mpesa'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                  : 'text-ink-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span class="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
              M-Pesa
            </button>

            <!-- Card (Stripe) -->
            <button
              @click="activeTab = 'card'"
              :class="[
                'flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-medium text-xs transition-all',
                activeTab === 'card'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-ink-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Card (Stripe)
            </button>

            <!-- PayPal -->
            <button
              @click="activeTab = 'paypal'"
              :class="[
                'flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-medium text-xs transition-all',
                activeTab === 'paypal'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'text-ink-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.262-.03.188-.066.384-.108.587-.665 3.238-2.868 4.88-6.19 4.88H10.51c-.495 0-.916.36-1 .851l-1.077 6.822a.64.64 0 0 1-.633.541z" />
              </svg>
              PayPal (USD)
            </button>

            <!-- Cash -->
            <button
              @click="activeTab = 'cash'"
              :class="[
                'flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-medium text-xs transition-all',
                activeTab === 'cash'
                  ? 'bg-brass-500 text-ink-950 shadow-lg'
                  : 'text-ink-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              School Cash
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
                  Pay KES {{ order.total_kes_formatted }} via M-Pesa
                </span>
              </button>
            </div>
          </div>

          <!-- Tab 2: Credit / Debit Card (Stripe) -->
          <div v-else-if="activeTab === 'card'" class="space-y-5">
            <div class="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
              <span class="flex items-center gap-2 font-medium">
                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Stripe 3D Secure 2.0 (Charged in KES)
              </span>
              <button
                type="button"
                @click="fillTestCard"
                class="px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-[11px] font-semibold border border-indigo-400/30 transition-colors"
              >
                Autofill Test Card
              </button>
            </div>

            <!-- Cardholder Name -->
            <div>
              <label class="field-label" for="cardHolder">Cardholder Name</label>
              <input
                id="cardHolder"
                v-model="cardHolder"
                type="text"
                placeholder="Jane Wanjiku"
                class="field-input"
                :disabled="ordersStore.loading || is3dSecureVerifying"
              />
            </div>

            <!-- Card Number -->
            <div>
              <label class="field-label" for="cardNumber">Card Number</label>
              <div class="relative">
                <input
                  id="cardNumber"
                  v-model="cardNumber"
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  maxlength="19"
                  class="field-input pr-12 font-mono"
                  :disabled="ordersStore.loading || is3dSecureVerifying"
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-ink-400">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Expiry & CVC -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="field-label" for="cardExpiry">Expiration (MM/YY)</label>
                <input
                  id="cardExpiry"
                  v-model="cardExpiry"
                  type="text"
                  placeholder="12/28"
                  maxlength="5"
                  class="field-input font-mono"
                  :disabled="ordersStore.loading || is3dSecureVerifying"
                />
              </div>

              <div>
                <label class="field-label" for="cardCvc">CVC / CVV</label>
                <input
                  id="cardCvc"
                  v-model="cardCvc"
                  type="password"
                  placeholder="123"
                  maxlength="4"
                  class="field-input font-mono"
                  :disabled="ordersStore.loading || is3dSecureVerifying"
                />
              </div>
            </div>

            <p v-if="cardError" class="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-300">
              {{ cardError }}
            </p>

            <!-- 3D Secure Verifying Banner -->
            <div v-if="is3dSecureVerifying" class="p-4 rounded-xl bg-indigo-950/50 border border-indigo-400/30 flex items-center gap-3 text-xs text-indigo-200">
              <svg class="w-5 h-5 animate-spin text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>Verifying 3D Secure 2.0 with issuing bank and capturing in KES...</span>
            </div>

            <button
              @click="handleCardPay"
              :disabled="ordersStore.loading || is3dSecureVerifying"
              class="w-full btn bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 shadow-lg shadow-indigo-900/30"
            >
              <span v-if="ordersStore.loading || is3dSecureVerifying" class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Processing Card...
              </span>
              <span v-else>
                Pay KES {{ order.total_kes_formatted }} with Card
              </span>
            </button>

            <div class="flex items-center justify-center gap-4 text-[11px] text-ink-400 pt-1">
              <span>Visa</span>
              <span>•</span>
              <span>Mastercard</span>
              <span>•</span>
              <span>American Express</span>
              <span>•</span>
              <span>Idempotent SSL</span>
            </div>
          </div>

          <!-- Tab 3: PayPal (USD at Locked Rate) -->
          <div v-else-if="activeTab === 'paypal'" class="space-y-6">
            <div class="p-5 rounded-xl bg-blue-950/30 border border-blue-500/20 space-y-3">
              <div class="flex items-center gap-2 text-blue-300 font-semibold text-sm">
                <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.262-.03.188-.066.384-.108.587-.665 3.238-2.868 4.88-6.19 4.88H10.51c-.495 0-.916.36-1 .851l-1.077 6.822a.64.64 0 0 1-.633.541z" />
                </svg>
                Pay Internationally in USD
              </div>
              <p class="text-xs text-ink-300 leading-relaxed">
                PayPal charges international students directly in US Dollars at your order's locked exchange rate (KES {{ order.exchange_rate_usd }} per 1 USD).
              </p>
            </div>

            <div class="glass p-4 rounded-xl text-xs space-y-2 bg-ink-950/60">
              <div class="flex justify-between text-ink-300">
                <span>KES Equivalent:</span>
                <span class="font-mono text-white">KES {{ order.total_kes_formatted }}</span>
              </div>
              <div class="flex justify-between text-ink-300">
                <span>Order Exchange Rate:</span>
                <span class="text-white font-mono">1 USD = KES {{ order.exchange_rate_usd }}</span>
              </div>
              <div class="flex justify-between text-ink-200 font-bold border-t border-white/5 pt-2 text-sm">
                <span>Amount to Charge:</span>
                <span class="text-blue-400 font-mono">${{ order.total_usd_formatted }} USD</span>
              </div>
            </div>

            <div v-if="ordersStore.error" class="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-300">
              {{ ordersStore.error }}
            </div>

            <button
              @click="handlePaypalInitiate"
              :disabled="ordersStore.loading"
              class="w-full btn bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.262-.03.188-.066.384-.108.587-.665 3.238-2.868 4.88-6.19 4.88H10.51c-.495 0-.916.36-1 .851l-1.077 6.822a.64.64 0 0 1-.633.541z" />
              </svg>
              <span>Pay ${{ order.total_usd_formatted }} USD with PayPal</span>
            </button>
          </div>

          <!-- Tab 4: Cash Payment Instructions -->
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

    <!-- PayPal Approval Modal (Simulated Sandbox) -->
    <div v-if="showPaypalModal && paypalApprovalData" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
      <div class="glass max-w-md w-full p-6 sm:p-8 space-y-6 border-blue-500/30">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div class="flex items-center gap-2">
            <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.262-.03.188-.066.384-.108.587-.665 3.238-2.868 4.88-6.19 4.88H10.51c-.495 0-.916.36-1 .851l-1.077 6.822a.64.64 0 0 1-.633.541z" />
            </svg>
            <span class="font-bold text-white text-base">PayPal Checkout Sandbox</span>
          </div>
          <button @click="showPaypalModal = false" class="text-ink-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-4 rounded-xl bg-ink-950/80 border border-white/5 space-y-2">
            <div class="flex justify-between text-ink-300">
              <span>Merchant:</span>
              <span class="text-white font-medium">Bariton Music Academy</span>
            </div>
            <div class="flex justify-between text-ink-300">
              <span>Order ID:</span>
              <span class="font-mono text-white">{{ paypalApprovalData.paypal_order_id }}</span>
            </div>
            <div class="flex justify-between text-ink-300 border-t border-white/5 pt-2">
              <span>Charge Amount:</span>
              <span class="text-base font-bold text-blue-400 font-mono">${{ order.total_usd_formatted }} USD</span>
            </div>
          </div>
          <p class="text-ink-400 text-[11px] leading-relaxed">
            In test mode, clicking "Approve Payment" simulates authorization and calls the capture API to fulfill your order immediately.
          </p>
        </div>

        <div class="flex gap-3">
          <button
            @click="handlePaypalApprove"
            :disabled="ordersStore.loading"
            class="flex-1 btn bg-blue-600 hover:bg-blue-500 text-white font-bold"
          >
            <span v-if="ordersStore.loading">Capturing...</span>
            <span v-else>Approve ${{ order.total_usd_formatted }} USD</span>
          </button>
          <button @click="showPaypalModal = false" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
