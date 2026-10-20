<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTutoringStore } from '../../stores/tutoring'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const tutoringStore = useTutoringStore()
const authStore = useAuthStore()

const loading = ref(false)
const selectedCurrency = ref('KES')

onMounted(async () => {
  loading.value = true
  try {
    await tutoringStore.fetchPackages()
  } catch (e) {
    // handled in store
  } finally {
    loading.value = false
  }
})

const packages = computed(() => tutoringStore.packages)

function formatMoney(amount, currency = 'KES') {
  if (currency === 'KES') {
    return `KES ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  const usdAmount = Number(amount) / 130
  return `$${usdAmount.toFixed(2)}`
}

function handleBookPackage(pkg) {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: `/tutoring` } })
    return
  }
  // Route to checkout with tutoring_package item
  router.push({
    name: 'checkout',
    query: {
      type: 'tutoring_package',
      id: pkg.id,
      slug: pkg.slug,
    },
  })
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-12">
      <!-- Hero Section -->
      <div class="text-center space-y-4 max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Elite 1-on-1 Mentorship
        </div>
        <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Private Studio Tutoring & Technique Coaching
        </h1>
        <p class="text-lg text-slate-400">
          Book tailored one-on-one sessions with Bariton's master vocal coaches, instrumental virtuosos, and audio engineers. Available via Zoom, Google Meet, or at our Nairobi state-of-the-art studio.
        </p>

        <!-- Currency switch -->
        <div class="pt-2 flex justify-center items-center gap-2">
          <span class="text-xs font-medium text-slate-400">Display currency:</span>
          <button
            @click="selectedCurrency = 'KES'"
            :class="selectedCurrency === 'KES' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'"
            class="px-2.5 py-1 text-xs rounded transition-all"
          >
            KES (KSh)
          </button>
          <button
            @click="selectedCurrency = 'USD'"
            :class="selectedCurrency === 'USD' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'"
            class="px-2.5 py-1 text-xs rounded transition-all"
          >
            USD ($)
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>

      <!-- Packages Grid -->
      <div v-else-if="packages.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          v-for="pkg in packages"
          :key="pkg.id"
          class="relative bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-amber-500/40 transition-all duration-300 shadow-xl backdrop-blur-sm group hover:-translate-y-1"
        >
          <!-- Popular badge if 5-pack -->
          <div
            v-if="pkg.session_count === 5"
            class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase px-3 py-1 rounded-full shadow-md"
          >
            Most Popular
          </div>

          <div>
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  {{ pkg.title }}
                </h3>
                <p v-if="pkg.course" class="text-xs font-medium text-amber-500/80 mt-0.5">
                  {{ pkg.course.title }}
                </p>
                <p v-else class="text-xs font-medium text-slate-400 mt-0.5">
                  All Academy Instruments & Vocals
                </p>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {{ pkg.session_count }} {{ pkg.session_count === 1 ? 'Session' : 'Sessions' }}
              </span>
            </div>

            <p class="text-slate-400 text-sm mb-6 line-clamp-3">
              {{ pkg.description || 'Comprehensive 1-on-1 private instruction tailored to your artistic and technical goals.' }}
            </p>

            <div class="mb-6 pb-6 border-b border-slate-800/80">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-extrabold text-white">
                  {{ formatMoney(pkg.price_kes, selectedCurrency) }}
                </span>
                <span class="text-xs text-slate-400 font-medium">total package</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Valid for {{ pkg.validity_days }} days from checkout (Africa/Nairobi time)
              </p>
            </div>

            <!-- Features List -->
            <ul class="space-y-3 mb-8 text-xs text-slate-300">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>60-Minute private lesson + 15m buffer transition</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Choice of Zoom, Google Meet, or Nairobi Studio</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Flexible rescheduling (24h advance notice)</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Full credit protection if instructor reschedules</span>
              </li>
            </ul>
          </div>

          <button
            @click="handleBookPackage(pkg)"
            class="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold focus:ring-2 focus:ring-amber-500/50"
          >
            <span>Get Package</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <p class="text-slate-400">No tutoring packages are currently active. Please check back shortly.</p>
      </div>

      <!-- FAQ & Policy Highlights -->
      <div class="mt-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 max-w-4xl mx-auto space-y-6">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tutoring Policy & Fair Scheduling
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div class="space-y-1">
            <h4 class="font-semibold text-slate-200">How do bookings work?</h4>
            <p class="text-slate-400">After purchasing a package, session credits are loaded into your student account. You pick an instructor and select open slots in the calendar.</p>
          </div>
          <div class="space-y-1">
            <h4 class="font-semibold text-slate-200">What is the rescheduling policy?</h4>
            <p class="text-slate-400">Students may reschedule free of charge up to 24 hours prior to the session. Emergency medical waivers are accommodated with stated reasons.</p>
          </div>
          <div class="space-y-1">
            <h4 class="font-semibold text-slate-200">What if my instructor cancels?</h4>
            <p class="text-slate-400">Your session credit is immediately restored to your account, and your package expiry is protected so you can rebook anytime.</p>
          </div>
          <div class="space-y-1">
            <h4 class="font-semibold text-slate-200">Studio & Online Modes</h4>
            <p class="text-slate-400">Choose online video conferencing (Zoom or Google Meet with direct links) or physical attendance at our Nairobi music studios.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
