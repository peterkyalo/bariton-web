<template>
  <div class="event-detail-view bg-slate-50 min-h-screen text-slate-800 pb-24">
    <!-- 1. Hero Conservatory Banner -->
    <div class="relative bg-gradient-to-b from-slate-950 via-slate-900 to-navy-950 text-white pt-10 pb-20 sm:pb-24 border-b border-slate-800 overflow-hidden">
      <!-- Decorative Conservatory Glows & Vignette -->
      <div class="absolute -right-24 -top-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 bottom-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <!-- Breadcrumb Navigation -->
        <nav class="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
          <RouterLink to="/" class="hover:text-amber-400 transition-colors">Home</RouterLink>
          <span class="text-slate-600">/</span>
          <RouterLink :to="{ name: 'events-catalog' }" class="hover:text-amber-400 transition-colors">Workshops & Bootcamps</RouterLink>
          <span class="text-slate-600">/</span>
          <span class="text-amber-400 truncate max-w-xs">{{ event?.title || 'Event Details' }}</span>
        </nav>

        <div v-if="eventsStore.loading && !event" class="py-20 flex justify-center">
          <LoadingSpinner text="Loading workshop details..." />
        </div>

        <div v-else-if="!event" class="py-16 text-center">
          <EmptyState
            title="Event not found"
            description="The workshop or bootcamp you are looking for does not exist or has passed."
          >
            <RouterLink :to="{ name: 'events-catalog' }" class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all">
              Return to Events Catalog
            </RouterLink>
          </EmptyState>
        </div>

        <!-- Banner Content Grid -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-8 space-y-5">
            <!-- Badges -->
            <div class="flex flex-wrap items-center gap-2.5">
              <span
                class="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                :class="{
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30': event.type === 'masterclass',
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': event.type === 'bootcamp',
                  'bg-purple-500/20 text-purple-300 border border-purple-500/30': event.type === 'workshop'
                }"
              >
                In-Person {{ event.type }}
              </span>

              <span
                v-if="event.is_full"
                class="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
              >
                Fully Booked
              </span>
              <span
                v-else-if="event.available_seats_count <= 5"
                class="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
              >
                Only {{ event.available_seats_count }} Seats Remaining!
              </span>
              <span
                v-else
                class="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              >
                {{ event.available_seats_count }} Seats Open
              </span>

              <span v-if="event.has_accommodation" class="px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Residence Lodging Available
              </span>
            </div>

            <!-- Title -->
            <h1 class="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
              {{ event.title }}
            </h1>

            <p class="text-base sm:text-lg text-slate-300 leading-relaxed font-light max-w-3xl">
              {{ event.description }}
            </p>

            <!-- Key Metadata Strip -->
            <div class="pt-4 flex flex-wrap items-center gap-6 border-t border-slate-800/80 text-xs sm:text-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div class="text-slate-400 text-xs font-medium">Dates & Schedule</div>
                  <div class="text-white font-semibold">{{ formatDateRange(event.start_date, event.end_date) }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3 max-w-sm">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-slate-400 text-xs font-medium">Venue Campus</div>
                  <div class="text-white font-semibold line-clamp-1" :title="event.venue">{{ event.venue }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-slate-400 text-xs font-medium">Cohort Cap</div>
                  <div class="text-white font-semibold">{{ event.capacity }} Attendees Max</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Hero Image Card -->
          <div class="lg:col-span-4 hidden lg:block">
            <div class="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900 group">
              <div class="aspect-video relative overflow-hidden bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80"
                  :alt="event.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              </div>
              <div class="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span class="flex items-center gap-1.5 text-amber-400 font-medium">
                  <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Live Masterclass Stage
                </span>
                <span class="text-slate-400">BMAS Kilimani Studios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Main Content & Booking Panel Grid -->
    <div v-if="event" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Intensive Overview & Inclusions (8 cols) -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Intensive Curriculum & Structure -->
          <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/90 space-y-6">
            <h2 class="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span class="w-2.5 h-6 bg-amber-500 rounded-full inline-block"></span>
              Intensive Overview & Repertoire
            </h2>

            <div class="text-slate-600 leading-relaxed text-sm sm:text-base space-y-4">
              <p class="whitespace-pre-line">{{ event.description }}</p>
            </div>

            <!-- Schedule Highlights Box -->
            <div class="p-4 sm:p-5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Daily Studio Routine
              </h4>
              <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Intensive sessions run daily from 09:00 AM to 05:00 PM with master lecture demonstrations, small ensemble clinics, individual clinician critiques, and an evening participant showcase recital on the final day.
              </p>
            </div>

            <!-- Inclusions Section -->
            <div class="pt-6 border-t border-slate-100">
              <h3 class="text-base font-serif font-bold text-slate-900 mb-4">
                What's Included in Your Workshop Registration
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span>Full access to daily masterclasses & clinics</span>
                </div>
                <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span>Sheet music binders & rehearsal audio recordings</span>
                </div>
                <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span>One-on-one clinician feedback sessions</span>
                </div>
                <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span>Certificate of attendance & final concert showcase</span>
                </div>
              </div>
            </div>

            <!-- Refund Policy Alert -->
            <div class="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <svg class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span class="font-bold text-slate-900 block mb-0.5">BMAS In-Person Refund Policy</span>
                Due to venue arrangements and clinician scheduling, refunds must be formally requested at least 7 days prior to the start date with supporting emergency/medical documentation.
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Interactive Booking Configuration Card (4 cols) -->
        <div class="lg:col-span-4 sticky top-6 space-y-6">
          <div class="bg-gradient-to-b from-slate-950 via-slate-900 to-navy-950 text-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-amber-500/30 space-y-6 relative overflow-hidden">
            <div class="flex items-center justify-between pb-4 border-b border-slate-800">
              <span class="text-xs uppercase tracking-wider text-amber-400 font-extrabold">Reserve Seat</span>
              <span class="text-xs text-slate-400">Strict Capacity ({{ event.capacity }})</span>
            </div>

            <!-- Seat Occupancy Progress -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs text-slate-400">
                <span>Occupancy</span>
                <span class="text-white font-semibold">{{ event.occupied_seats_count }} of {{ event.capacity }} booked</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  :class="event.is_full ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-amber-300'"
                  :style="{ width: `${Math.min(100, (event.occupied_seats_count / event.capacity) * 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- If Not Full: Package Options -->
            <div v-if="!event.is_full" class="space-y-4">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Your Attendance Package
              </label>

              <!-- Option 1: Training Only -->
              <div
                @click="selectedBookingType = 'training_only'"
                class="p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between"
                :class="selectedBookingType === 'training_only'
                  ? 'bg-amber-500/15 border-amber-500/80 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="booking_package"
                      value="training_only"
                      v-model="selectedBookingType"
                      class="text-amber-500 focus:ring-amber-500"
                    />
                    <span class="text-sm font-bold text-white">Training Only</span>
                  </div>
                  <p class="text-xs text-slate-400 pl-5">Non-residential participation. Meals & lodging excluded.</p>
                </div>
                <div class="text-right">
                  <span class="text-base font-bold text-white">KES {{ formatCurrency(event.training_fee_kes) }}</span>
                </div>
              </div>

              <!-- Option 2: Training + Accommodation (if available) -->
              <div
                v-if="event.has_accommodation"
                @click="selectedBookingType = 'training_and_accommodation'"
                class="p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between"
                :class="selectedBookingType === 'training_and_accommodation'
                  ? 'bg-amber-500/15 border-amber-500/80 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="booking_package"
                      value="training_and_accommodation"
                      v-model="selectedBookingType"
                      class="text-amber-500 focus:ring-amber-500"
                    />
                    <span class="text-sm font-bold text-white">Training + Lodging</span>
                  </div>
                  <p class="text-xs text-slate-400 pl-5">Includes campus residence accommodation & full board dining.</p>
                </div>
                <div class="text-right">
                  <span class="text-base font-bold text-white">KES {{ formatCurrency(event.total_fee_with_accommodation_kes) }}</span>
                </div>
              </div>

              <!-- Total Display -->
              <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Registration Fee</span>
                <span class="text-2xl font-bold font-serif text-amber-400">
                  KES {{ formatCurrency(calculatedTotal) }}
                </span>
              </div>

              <!-- Hold Timer Policy Notice -->
              <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Seat is placed on a <strong>15-minute exclusive hold</strong> upon proceeding.</span>
              </div>

              <!-- Action Button -->
              <button
                @click="handleHoldSeat"
                :disabled="isSubmitting"
                class="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span v-if="isSubmitting">Placing Exclusive Hold...</span>
                <span v-else>Hold Seat & Register Now</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            <!-- If Fully Booked: Waitlist Card -->
            <div v-else class="space-y-4">
              <div class="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-center space-y-2">
                <span class="text-xs uppercase tracking-wider font-extrabold text-rose-300 block">All Seats Allocated</span>
                <p class="text-xs text-slate-300 leading-relaxed">
                  This cohort has reached maximum capacity. Join the waitlist to receive immediate automated alerts if holds expire or cancellations occur.
                </p>
              </div>

              <div v-if="waitlistJoined" class="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-2">
                <span class="text-sm font-bold text-emerald-300 block">✓ You Are on the Priority Waitlist!</span>
                <p class="text-xs text-slate-300">
                  You will receive an instant email and SMS alert if a seat is released for your booking.
                </p>
              </div>

              <div v-else class="space-y-3">
                <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Waitlist Preference
                </label>
                <select
                  v-model="selectedBookingType"
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="training_only">Training Only</option>
                  <option v-if="event.has_accommodation" value="training_and_accommodation">Training + Lodging</option>
                </select>

                <button
                  @click="handleJoinWaitlist"
                  :disabled="isSubmitting"
                  class="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span v-if="isSubmitting">Joining Queue...</span>
                  <span v-else>Join Priority Waitlist</span>
                </button>
              </div>
            </div>

            <div v-if="actionError" class="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
              {{ actionError }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useEventsStore } from '../../stores/events';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

const selectedBookingType = ref('training_only');
const isSubmitting = ref(false);
const actionError = ref(null);
const waitlistJoined = ref(false);

const event = computed(() => eventsStore.currentEvent);

const calculatedTotal = computed(() => {
  if (!event.value) return 0;
  if (selectedBookingType.value === 'training_and_accommodation' && event.value.has_accommodation) {
    return event.value.total_fee_with_accommodation_kes;
  }
  return event.value.training_fee_kes;
});

onMounted(async () => {
  await eventsStore.fetchEvent(route.params.slug);
});

async function handleHoldSeat() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  isSubmitting.value = true;
  actionError.value = null;

  try {
    const res = await eventsStore.bookSeat(event.value.slug, selectedBookingType.value);
    if (res.order && res.order.uuid) {
      router.push({ name: 'checkout', params: { uuid: res.order.uuid } });
    }
  } catch (err) {
    actionError.value = err.response?.data?.message || err.message || 'Failed to place seat hold.';
    // Refresh event to sync occupancy status
    await eventsStore.fetchEvent(event.value.slug);
  } finally {
    isSubmitting.value = false;
  }
}

async function handleJoinWaitlist() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  isSubmitting.value = true;
  actionError.value = null;

  try {
    await eventsStore.joinWaitlist(event.value.slug, selectedBookingType.value);
    waitlistJoined.value = true;
  } catch (err) {
    actionError.value = err.response?.data?.message || err.message || 'Failed to join waitlist.';
  } finally {
    isSubmitting.value = false;
  }
}

function formatCurrency(cents) {
  return (cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDateRange(startStr, endStr) {
  if (!startStr) return '';
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : null;

  const startFormatted = start.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  if (!end) return startFormatted;
  const endFormatted = end.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startFormatted} - ${endFormatted}`;
}
</script>
