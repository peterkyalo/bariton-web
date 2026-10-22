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

// Payment method radio: 'mpesa' | 'card' | 'paypal' | 'cash'
const activeMethod = ref('mpesa')

// M-Pesa state
const phone = ref('')
const phoneError = ref('')

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

// T&C and newsletter agreement
const agreeTerms = ref(true)
const subscribeUpdates = ref(false)
const termsError = ref('')

// Expiry timer
const countdownSeconds = ref(0)
let timerInterval = null

onMounted(async () => {
  if (authStore.user?.phone) {
    phone.value = authStore.user.phone
  }
  if (authStore.user?.name) {
    cardHolder.value = authStore.user.name
  }

  const orderUuid = route.query.order || route.params.uuid
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

// Safe pricing getters that handle both flat and nested pricing resource structures
const totalKesFormatted = computed(() => {
  return order.value?.pricing?.total_kes_formatted || order.value?.total_kes_formatted || (order.value?.total_kes ? (order.value.total_kes / 100).toLocaleString('en-KE', { minimumFractionDigits: 2 }) : '0.00')
})

const totalUsdFormatted = computed(() => {
  return order.value?.pricing?.total_usd_formatted || order.value?.total_usd_formatted || (order.value?.total_usd_cents ? (order.value.total_usd_cents / 100).toFixed(2) : '0.00')
})

const vatKesFormatted = computed(() => {
  return order.value?.pricing?.vat_kes_formatted || order.value?.vat_kes_formatted || (order.value?.vat_kes ? (order.value.vat_kes / 100).toLocaleString('en-KE', { minimumFractionDigits: 2 }) : '0.00')
})

const vatRatePercent = computed(() => {
  return order.value?.pricing?.vat_rate_percent ?? order.value?.vat_rate_percent ?? 0
})

const exchangeRateUsed = computed(() => {
  return order.value?.pricing?.exchange_rate_used ?? order.value?.exchange_rate_usd ?? 130
})

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
  if (!validateTerms()) return
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

function validateTerms() {
  termsError.value = ''
  if (!agreeTerms.value) {
    termsError.value = 'Please agree to the enrollment terms and conditions to proceed.'
    return false
  }
  return true
}

async function handleCardPay() {
  if (!validateTerms()) return
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
  if (!validateTerms()) return
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

function handlePrimaryOrderAction() {
  if (activeMethod.value === 'mpesa') {
    handleMpesaPay()
  } else if (activeMethod.value === 'card') {
    handleCardPay()
  } else if (activeMethod.value === 'paypal') {
    handlePaypalInitiate()
  } else if (activeMethod.value === 'cash') {
    router.push({ name: 'student.orders' })
  }
}
</script>

<template>
  <div class="checkout-page bg-slate-100 min-h-screen text-slate-800 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <!-- Title & Breadcrumb Header -->
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <RouterLink to="/" class="hover:text-amber-600 transition">Home</RouterLink>
            <span>/</span>
            <RouterLink to="/courses" class="hover:text-amber-600 transition">Courses</RouterLink>
            <span>/</span>
            <span class="text-slate-800 font-semibold">Payment</span>
          </nav>
          <h1 class="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Select Payment Option
          </h1>
        </div>

        <div v-if="order && order.status === 'pending'" class="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span class="text-slate-500">Hold expires in:</span>
          <span class="font-mono font-bold text-slate-900">{{ formattedCountdown }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="ordersStore.loading && !order" class="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
        <LoadingSpinner text="Preparing your order..." />
      </div>

      <!-- Error State -->
      <div v-else-if="ordersStore.error && !order" class="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center space-y-3 max-w-md mx-auto">
        <h2 class="text-base font-bold text-slate-900">Could Not Load Order</h2>
        <p class="text-xs text-slate-600">{{ ordersStore.error }}</p>
        <RouterLink to="/courses" class="inline-block px-4 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-amber-500 hover:text-slate-950 transition">
          Return to Courses
        </RouterLink>
      </div>

      <!-- Main Two-Column Layout (Bootdey Style: Left col-lg-8, Right col-lg-4) -->
      <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- LEFT: Payment Accordion -->
        <div class="lg:col-span-8 space-y-3">
          <!-- Order Paid Success State -->
          <div v-if="order.status === 'paid'" class="bg-white rounded-xl p-6 shadow-sm border border-emerald-200 text-center space-y-4">
            <div class="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <div>
              <h2 class="text-xl font-serif font-bold text-slate-900">Payment Confirmed!</h2>
              <p class="text-xs text-slate-600 mt-1">Your enrollment is active and course materials are now accessible.</p>
            </div>
            <div class="bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-200 max-w-sm mx-auto text-left">
              <div class="flex justify-between">
                <span class="text-slate-500">Order:</span>
                <span class="font-mono font-bold text-slate-800">{{ order.order_number }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Method:</span>
                <span class="font-bold text-amber-700 uppercase">{{ order.payment_method || 'CONFIRMED' }}</span>
              </div>
              <div v-if="order.receipt" class="flex justify-between">
                <span class="text-slate-500">Receipt:</span>
                <span class="font-mono font-bold text-emerald-700">{{ order.receipt.receipt_number }}</span>
              </div>
            </div>
            <div class="flex gap-2 justify-center pt-2">
              <button @click="handleGoToCourse" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition">
                Start Learning
              </button>
              <button v-if="order.receipt" @click="handleDownloadReceipt" class="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition">
                Download PDF
              </button>
            </div>
          </div>

          <!-- Order Expired State -->
          <div v-else-if="order.status === 'expired'" class="bg-white rounded-xl p-8 shadow-sm border border-rose-200 text-center space-y-3">
            <h2 class="text-base font-bold text-slate-900">Session Expired</h2>
            <p class="text-xs text-slate-600">This order hold has expired. Please initiate a new order from the catalog.</p>
            <RouterLink to="/courses" class="inline-block px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400">
              Browse Courses
            </RouterLink>
          </div>

          <!-- Accordion Group -->
          <div v-else class="space-y-3">
            <!-- 1. M-Pesa Accordion Card -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all" :class="{ 'ring-2 ring-emerald-500 border-transparent': activeMethod === 'mpesa' }">
              <div
                @click="activeMethod = 'mpesa'"
                class="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div class="flex items-center gap-2.5">
                  <input
                    type="radio"
                    id="payment-mpesa"
                    name="payment"
                    value="mpesa"
                    v-model="activeMethod"
                    class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label for="payment-mpesa" class="font-bold text-slate-900 text-sm cursor-pointer">
                    M-Pesa Express
                  </label>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    STK Push
                  </span>
                </div>

                <span class="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Safaricom M-Pesa
                </span>
              </div>

              <div v-if="activeMethod === 'mpesa'" class="p-4 border-t border-slate-200 space-y-3 bg-white">
                <div v-if="ordersStore.paymentStatus === 'polling'" class="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <p class="text-xs font-bold text-slate-900">Prompt Sent to Your Phone</p>
                  <p class="text-xs text-slate-600">{{ ordersStore.paymentMessage }}</p>
                  <div class="flex items-center justify-center gap-2 text-xs text-emerald-700 font-mono">
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Awaiting PIN confirmation...
                  </div>
                </div>

                <div v-else class="space-y-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1" for="phone">
                      Mobile Number (Safaricom)
                    </label>
                    <div class="relative max-w-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">
                        🇰🇪 +254
                      </div>
                      <input
                        id="phone"
                        v-model="phone"
                        type="tel"
                        placeholder="712 345 678"
                        class="w-full pl-18 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        :disabled="ordersStore.paymentStatus === 'initiating'"
                      />
                    </div>
                    <p v-if="phoneError" class="text-xs text-rose-600 mt-1 font-semibold">{{ phoneError }}</p>
                  </div>

                  <div v-if="ordersStore.error" class="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {{ ordersStore.error }}
                  </div>

                  <button
                    @click="handleMpesaPay"
                    :disabled="ordersStore.loading"
                    class="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span v-if="ordersStore.loading">Initiating...</span>
                    <span v-else>Pay KES {{ totalKesFormatted }} via M-Pesa</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. Credit Card Accordion Card (Bootdey Spec with SVG & Inputs) -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all" :class="{ 'ring-2 ring-indigo-500 border-transparent': activeMethod === 'card' }">
              <div
                @click="activeMethod = 'card'"
                class="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div class="flex items-center gap-2.5">
                  <input
                    type="radio"
                    id="payment-cc"
                    name="payment"
                    value="card"
                    v-model="activeMethod"
                    class="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label for="payment-cc" class="font-bold text-slate-900 text-sm cursor-pointer">
                    Credit Card
                  </label>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                    3D Secure
                  </span>
                </div>

                <!-- Bootdey Spec Credit Card SVG -->
                <span>
                  <svg width="34" height="25" xmlns="http://www.w3.org/2000/svg">
                    <g fill-rule="nonzero" fill="#333840">
                      <path d="M29.418 2.083c1.16 0 2.101.933 2.101 2.084v16.666c0 1.15-.94 2.084-2.1 2.084H4.202A2.092 2.092 0 0 1 2.1 20.833V4.167c0-1.15.941-2.084 2.102-2.084h25.215ZM4.203 0C1.882 0 0 1.865 0 4.167v16.666C0 23.135 1.882 25 4.203 25h25.215c2.321 0 4.203-1.865 4.203-4.167V4.167C33.62 1.865 31.739 0 29.418 0H4.203Z"></path>
                      <path d="M4.203 7.292c0-.576.47-1.042 1.05-1.042h4.203c.58 0 1.05.466 1.05 1.042v2.083c0 .575-.47 1.042-1.05 1.042H5.253c-.58 0-1.05-.467-1.05-1.042V7.292Zm0 6.25c0-.576.47-1.042 1.05-1.042H15.76c.58 0 1.05.466 1.05 1.042 0 .575-.47 1.041-1.05 1.041H5.253c-.58 0-1.05-.466-1.05-1.041Zm0 4.166c0-.575.47-1.041 1.05-1.041h2.102c.58 0 1.05.466 1.05 1.041 0 .576-.47 1.042-1.05 1.042H5.253c-.58 0-1.05-.466-1.05-1.042Zm6.303 0c0-.575.47-1.041 1.051-1.041h2.101c.58 0 1.051.466 1.051 1.041 0 .576-.47 1.042-1.05 1.042h-2.102c-.58 0-1.05-.466-1.05-1.042Zm6.304 0c0-.575.47-1.041 1.051-1.041h2.101c.58 0 1.05.466 1.05 1.041 0 .576-.47 1.042-1.05 1.042h-2.101c-.58 0-1.05-.466-1.05-1.042Zm6.304 0c0-.575.47-1.041 1.05-1.041h2.102c.58 0 1.05.466 1.05 1.041 0 .576-.47 1.042-1.05 1.042h-2.101c-.58 0-1.05-.466-1.05-1.042Z"></path>
                    </g>
                  </svg>
                </span>
              </div>

              <!-- Collapsible Card Inputs -->
              <div v-if="activeMethod === 'card'" class="p-4 border-t border-slate-200 space-y-3 bg-white">
                <div class="flex items-center justify-between pb-1">
                  <span class="text-[11px] text-slate-500 font-medium">Billed via Stripe in KES</span>
                  <button
                    type="button"
                    @click="fillTestCard"
                    class="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition cursor-pointer"
                  >
                    Autofill Test Card
                  </button>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1" for="card-number">
                    Card Number
                  </label>
                  <input
                    id="card-number"
                    v-model="cardNumber"
                    type="text"
                    maxlength="19"
                    placeholder="4242 4242 4242 4242"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    :disabled="ordersStore.loading || is3dSecureVerifying"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div class="sm:col-span-6">
                    <label class="block text-xs font-semibold text-slate-700 mb-1" for="card-holder">
                      Name on card
                    </label>
                    <input
                      id="card-holder"
                      v-model="cardHolder"
                      type="text"
                      placeholder="Jane Wanjiku"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      :disabled="ordersStore.loading || is3dSecureVerifying"
                    />
                  </div>

                  <div class="sm:col-span-3">
                    <label class="block text-xs font-semibold text-slate-700 mb-1" for="card-expiry">
                      Expiry date
                    </label>
                    <input
                      id="card-expiry"
                      v-model="cardExpiry"
                      type="text"
                      placeholder="MM/YY"
                      maxlength="5"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      :disabled="ordersStore.loading || is3dSecureVerifying"
                    />
                  </div>

                  <div class="sm:col-span-3">
                    <label class="block text-xs font-semibold text-slate-700 mb-1" for="card-cvv">
                      CVV Code
                    </label>
                    <input
                      id="card-cvv"
                      v-model="cardCvc"
                      type="password"
                      placeholder="123"
                      maxlength="4"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      :disabled="ordersStore.loading || is3dSecureVerifying"
                    />
                  </div>
                </div>

                <div v-if="cardError" class="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {{ cardError }}
                </div>

                <div v-if="is3dSecureVerifying" class="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-xs text-indigo-900">
                  <svg class="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Verifying 3D Secure with bank...</span>
                </div>

                <button
                  @click="handleCardPay"
                  :disabled="ordersStore.loading || is3dSecureVerifying"
                  class="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span v-if="ordersStore.loading || is3dSecureVerifying">Authorizing...</span>
                  <span v-else>Pay KES {{ totalKesFormatted }} with Card</span>
                </button>
              </div>
            </div>

            <!-- 3. PayPal Accordion Card (Bootdey Spec with SVG & Inputs) -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all" :class="{ 'ring-2 ring-blue-500 border-transparent': activeMethod === 'paypal' }">
              <div
                @click="activeMethod = 'paypal'"
                class="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div class="flex items-center gap-2.5">
                  <input
                    type="radio"
                    id="payment-pp"
                    name="payment"
                    value="paypal"
                    v-model="activeMethod"
                    class="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label for="payment-pp" class="font-bold text-slate-900 text-sm cursor-pointer">
                    PayPal
                  </label>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                    USD (${{ totalUsdFormatted }})
                  </span>
                </div>

                <!-- Bootdey Spec PayPal SVG -->
                <span>
                  <svg width="103" height="25" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fill-rule="evenodd">
                      <path d="M8.962 5.857h7.018c3.768 0 5.187 1.907 4.967 4.71-.362 4.627-3.159 7.187-6.87 7.187h-1.872c-.51 0-.852.337-.99 1.25l-.795 5.308c-.052.344-.233.543-.505.57h-4.41c-.414 0-.561-.317-.452-1.003L7.74 6.862c.105-.68.478-1.005 1.221-1.005Z" fill="#009EE3"></path>
                      <path d="M39.431 5.542c2.368 0 4.553 1.284 4.254 4.485-.363 3.805-2.4 5.91-5.616 5.919h-2.81c-.404 0-.6.33-.705 1.005l-.543 3.455c-.082.522-.35.779-.745.779h-2.614c-.416 0-.561-.267-.469-.863l2.158-13.846c.106-.68.362-.934.827-.934h6.263Zm-4.257 7.413h2.129c1.331-.051 2.215-.973 2.304-2.636.054-1.027-.64-1.763-1.743-1.757l-2.003.009-.687 4.384Zm15.618 7.17c.239-.217.482-.33.447-.062l-.085.642c-.043.335.089.512.4.512h2.323c.391 0 .581-.157.677-.762l1.432-8.982c.072-.451-.039-.672-.38-.672H53.05c-.23 0-.343.128-.402.48l-.095.552c-.049.288-.18.34-.304.05-.433-1.026-1.538-1.486-3.08-1.45-3.581.074-5.996 2.793-6.255 6.279-.2 2.696 1.732 4.813 4.279 4.813 1.848 0 2.674-.543 3.605-1.395l-.007-.005Zm-1.946-1.382c-1.542 0-2.616-1.23-2.393-2.738.223-1.507 1.665-2.737 3.206-2.737 1.542 0 2.616 1.23 2.394 2.737-.223 1.508-1.664 2.738-3.207 2.738Zm11.685-7.971h-2.355c-.486 0-.683.362-.53.808l2.925 8.561-2.868 4.075c-.241.34-.054.65.284.65h2.647a.81.81 0 0 0 .786-.386l8.993-12.898c.277-.397.147-.814-.308-.814H67.6c-.43 0-.602.17-.848.527l-3.75 5.435-1.676-5.447c-.098-.33-.342-.511-.793-.511h-.002Z" fill="#113984"></path>
                      <path d="M79.768 5.542c2.368 0 4.553 1.284 4.254 4.485-.363 3.805-2.4 5.91-5.616 5.919h-2.808c-.404 0-.6.33-.705 1.005l-.543 3.455c-.082.522-.35.779-.745.779h-2.614c-.417 0-.562-.267-.47-.863l2.162-13.85c.107-.68.362-.934.828-.934h6.257v.004Zm-4.257 7.413h2.128c1.332-.051 2.216-.973 2.305-2.636.054-1.027-.64-1.763-1.743-1.757l-2.004.009-.686 4.384Zm15.618 7.17c.239-.217.482-.33.447-.062l-.085.642c-.044.335.089.512.4.512h2.323c.391 0 .581-.157.677-.762l1.431-8.982c.073-.451-.038-.672-.38-.672h-2.55c-.23 0-.343.128-.403.48l-.094.552c-.049.288-.181.34-.304.05-.433-1.026-1.538-1.486-3.08-1.45-3.582.074-5.997 2.793-6.256 6.279-.199 2.696 1.732 4.813 4.28 4.813 1.847 0 2.673-.543 3.604-1.395l-.01-.005Zm-1.944-1.382c-1.542 0-2.616-1.23-2.393-2.738.222-1.507 1.665-2.737 3.206-2.737 1.542 0 2.616 1.23 2.393 2.737-.223 1.508-1.665 2.738-3.206 2.738Zm10.712 2.489h-2.681a.317.317 0 0 1-.328-.362l2.355-14.92a.462.462 0 0 1 .445-.363h2.682a.317.317 0 0 1 .327.362l-2.355 14.92a.462.462 0 0 1-.445.367v-.004Z" fill="#009EE3"></path>
                      <path d="M4.572 0h7.026c1.978 0 4.326.063 5.895 1.45 1.049.925 1.6 2.398 1.473 3.985-.432 5.364-3.64 8.37-7.944 8.37H7.558c-.59 0-.98.39-1.147 1.449l-.967 6.159c-.064.399-.236.634-.544.663H.565c-.48 0-.65-.362-.525-1.163L3.156 1.17C3.28.377 3.717 0 4.572 0Z" fill="#113984"></path>
                      <path d="m6.513 14.629 1.226-7.767c.107-.68.48-1.007 1.223-1.007h7.018c1.161 0 2.102.181 2.837.516-.705 4.776-3.793 7.428-7.837 7.428H7.522c-.464.002-.805.234-1.01.83Z" fill="#172C70"></path>
                    </g>
                  </svg>
                </span>
              </div>

              <div v-if="activeMethod === 'paypal'" class="p-4 border-t border-slate-200 space-y-3 bg-white">
                <div class="max-w-xs">
                  <label class="block text-xs font-semibold text-slate-700 mb-1" for="paypal-email">
                    Email address
                  </label>
                  <input
                    id="paypal-email"
                    type="email"
                    :value="authStore.user?.email || 'student@domain.com'"
                    readonly
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-slate-50 text-xs focus:outline-none"
                  />
                </div>

                <div class="bg-blue-50/70 p-3 rounded-lg border border-blue-200 text-xs space-y-1 max-w-sm">
                  <div class="flex justify-between text-slate-600">
                    <span>Rate:</span>
                    <span>1 USD = KES {{ exchangeRateUsed }}</span>
                  </div>
                  <div class="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-1">
                    <span>Charge:</span>
                    <span>${{ totalUsdFormatted }} USD</span>
                  </div>
                </div>

                <button
                  @click="handlePaypalInitiate"
                  :disabled="ordersStore.loading"
                  class="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Pay ${{ totalUsdFormatted }} USD via PayPal</span>
                </button>
              </div>
            </div>

            <!-- 4. Cash Accordion Card -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all" :class="{ 'ring-2 ring-amber-500 border-transparent': activeMethod === 'cash' }">
              <div
                @click="activeMethod = 'cash'"
                class="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div class="flex items-center gap-2.5">
                  <input
                    type="radio"
                    id="payment-cash"
                    name="payment"
                    value="cash"
                    v-model="activeMethod"
                    class="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label for="payment-cash" class="font-bold text-slate-900 text-sm cursor-pointer">
                    School Cash
                  </label>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    In-Person
                  </span>
                </div>

                <span class="text-xs text-amber-700 font-bold">
                  Bursar Office
                </span>
              </div>

              <div v-if="activeMethod === 'cash'" class="p-4 border-t border-slate-200 space-y-2.5 bg-white text-xs">
                <p class="text-slate-600">Present your order reference number below to receive an official stamped receipt.</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span class="text-slate-400 block text-[10px]">Reference:</span>
                    <span class="font-mono font-bold text-slate-900">{{ order.order_number }}</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span class="text-slate-400 block text-[10px]">Amount:</span>
                    <span class="font-bold text-amber-700">KES {{ totalKesFormatted }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Order Summary Card (Bootdey Spec col-lg-3 card position-sticky) -->
        <div class="lg:col-span-4 sticky top-6">
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h6 class="text-sm font-serif font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Order Summary
            </h6>

            <!-- Items -->
            <div class="space-y-2 pb-2 border-b border-slate-100">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex items-start justify-between gap-2 text-xs"
              >
                <div>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 inline-block mb-0.5">
                    {{ item.item_type.replace('_', ' ') }}
                  </span>
                  <p class="font-semibold text-slate-800 leading-snug line-clamp-2">
                    {{ item.title }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <span class="font-bold text-slate-900 text-xs">
                    KES {{ (item.price_kes / 100).toLocaleString('en-KE', { minimumFractionDigits: 0 }) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Price Breakdown -->
            <div class="space-y-1.5 text-xs text-slate-600">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span>KES {{ totalKesFormatted }}</span>
              </div>
              <div class="flex justify-between text-slate-500 text-[11px]">
                <span>VAT ({{ vatRatePercent }}% included)</span>
                <span>KES {{ vatKesFormatted }}</span>
              </div>
              <div class="flex justify-between text-slate-500 text-[11px]">
                <span>USD Equivalent</span>
                <span>${{ totalUsdFormatted }} USD</span>
              </div>
            </div>

            <hr class="border-slate-100 my-2" />

            <!-- TOTAL -->
            <div class="flex justify-between items-baseline mb-2 text-xs">
              <span class="font-bold text-slate-700 uppercase tracking-wider text-[11px]">TOTAL</span>
              <div class="text-right">
                <span class="text-lg font-serif font-bold text-slate-950 block leading-tight">
                  KES {{ totalKesFormatted }}
                </span>
                <span class="text-[10px] text-amber-700 font-semibold block">
                  ${{ totalUsdFormatted }} USD
                </span>
              </div>
            </div>

            <!-- Checkboxes (Bootdey Spec) -->
            <div class="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div class="flex items-start gap-2">
                <input
                  type="checkbox"
                  v-model="agreeTerms"
                  id="tnc"
                  class="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label for="tnc" class="cursor-pointer text-[11px] leading-tight select-none">
                  I agree to the <RouterLink to="/terms" target="_blank" class="text-amber-600 underline font-medium">terms and conditions</RouterLink>
                </label>
              </div>

              <div class="flex items-start gap-2">
                <input
                  type="checkbox"
                  v-model="subscribeUpdates"
                  id="subscribe"
                  class="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label for="subscribe" class="cursor-pointer text-[10px] text-slate-500 leading-tight select-none">
                  Get emails about product updates and events. <RouterLink to="/privacy" target="_blank" class="text-slate-600 underline">Privacy Policy</RouterLink>
                </label>
              </div>
            </div>

            <p v-if="termsError" class="text-[11px] text-rose-600 font-semibold">{{ termsError }}</p>

            <!-- Primary Order Button -->
            <button
              @click="handlePrimaryOrderAction"
              :disabled="ordersStore.loading || is3dSecureVerifying"
              class="w-full py-2.5 px-4 rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span v-if="ordersStore.loading || is3dSecureVerifying">Processing...</span>
              <span v-else>
                {{ activeMethod === 'cash' ? 'Confirm In-Person Order' : `Place order • KES ${totalKesFormatted}` }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PayPal Modal -->
    <div v-if="showPaypalModal && paypalApprovalData" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-white max-w-sm w-full p-5 rounded-xl shadow-xl border border-blue-200 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 pb-2">
          <span class="font-serif font-bold text-slate-900 text-sm">PayPal Checkout</span>
          <button @click="showPaypalModal = false" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>

        <div class="space-y-2 text-xs">
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div class="flex justify-between text-slate-500">
              <span>Merchant:</span>
              <span class="text-slate-900 font-bold">Bariton Music Academy</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Charge:</span>
              <span class="text-sm font-bold text-blue-600 font-mono">${{ totalUsdFormatted }} USD</span>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="handlePaypalApprove"
            :disabled="ordersStore.loading"
            class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
          >
            <span v-if="ordersStore.loading">Capturing...</span>
            <span v-else>Approve ${{ totalUsdFormatted }} USD</span>
          </button>
          <button @click="showPaypalModal = false" class="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
