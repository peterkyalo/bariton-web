<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    <div v-if="eventsStore.loading && !event" class="flex justify-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
        <p class="text-slate-400 text-sm">Loading event details...</p>
      </div>
    </div>

    <div v-else-if="event" class="space-y-8">
      <!-- Back Navigation -->
      <div>
        <RouterLink
          :to="{ name: 'events-catalog' }"
          class="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-gold-400 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events & Workshops
        </RouterLink>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Event Information & Description (8 cols) -->
        <div class="lg:col-span-8 space-y-8">
          <div class="rounded-2xl bg-navy-900/60 border border-slate-800 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <span
                class="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
                :class="{
                  'bg-gold-500/10 text-gold-400 border border-gold-500/30': event.type === 'masterclass',
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': event.type === 'bootcamp',
                  'bg-purple-500/10 text-purple-400 border border-purple-500/30': event.type === 'workshop'
                }"
              >
                {{ event.type }}
              </span>

              <span
                v-if="event.is_full"
                class="px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30"
              >
                Fully Booked
              </span>
              <span
                v-else
                class="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              >
                {{ event.available_seats_count }} Seats Remaining
              </span>
            </div>

            <h1 class="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              {{ event.title }}
            </h1>

            <!-- Quick Specs Row -->
            <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-slate-800/80 text-xs sm:text-sm">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div class="text-slate-400 text-xs">Dates</div>
                  <div class="text-white font-medium">{{ formatDateRange(event.start_date, event.end_date) }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-slate-400 text-xs">Venue</div>
                  <div class="text-white font-medium truncate">{{ event.venue }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-slate-400 text-xs">Cohort Limit</div>
                  <div class="text-white font-medium">{{ event.capacity }} Attendees Max</div>
                </div>
              </div>
            </div>

            <!-- Full Description -->
            <div class="mt-8 space-y-4 text-slate-300 leading-relaxed text-base">
              <h3 class="text-lg font-serif font-bold text-white">Curriculum & Intensive Overview</h3>
              <p class="whitespace-pre-line">{{ event.description }}</p>
            </div>

            <!-- Inclusions Section -->
            <div class="mt-8 pt-8 border-t border-slate-800/80">
              <h3 class="text-base font-serif font-bold text-white mb-4">What's Included in Your Registration</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">✓</span>
                  <span>Full access to daily masterclasses & clinics</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">✓</span>
                  <span>Sheet music folders & rehearsal recordings</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">✓</span>
                  <span>One-on-one clinician feedback sessions</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">✓</span>
                  <span>Certificate of attendance & final showcase</span>
                </div>
              </div>
            </div>

            <!-- Refund Policy Notice -->
            <div class="mt-8 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400 flex items-start gap-3">
              <svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span class="font-semibold text-slate-200">BMAS In-Person Refund Policy:</span>
                Due to venue arrangements and clinician scheduling, refunds must be formally requested at least 7 days prior to the start date with supporting emergency/medical documentation.
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Interactive Booking Configuration Card (4 cols) -->
        <div class="lg:col-span-4 sticky top-6 space-y-6">
          <div class="rounded-2xl bg-navy-900 border border-gold-500/30 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div class="flex items-center justify-between pb-4 border-b border-slate-800">
              <span class="text-xs uppercase tracking-wider text-gold-400 font-bold">Reserve Seat</span>
              <span class="text-xs text-slate-400">Strict Capacity</span>
            </div>

            <!-- If Not Full: Package Options -->
            <div v-if="!event.is_full" class="space-y-4">
              <label class="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Select Your Attendance Package
              </label>

              <!-- Option 1: Training Only -->
              <div
                @click="selectedBookingType = 'training_only'"
                class="p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between"
                :class="selectedBookingType === 'training_only'
                  ? 'bg-gold-500/10 border-gold-500/60 shadow-md shadow-gold-500/10'
                  : 'bg-navy-950/60 border-slate-800 hover:border-slate-700'"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="booking_package"
                      value="training_only"
                      v-model="selectedBookingType"
                      class="text-gold-500 focus:ring-gold-500"
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
                  ? 'bg-gold-500/10 border-gold-500/60 shadow-md shadow-gold-500/10'
                  : 'bg-navy-950/60 border-slate-800 hover:border-slate-700'"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="booking_package"
                      value="training_and_accommodation"
                      v-model="selectedBookingType"
                      class="text-gold-500 focus:ring-gold-500"
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
                <span class="text-sm text-slate-300">Total Registration Fee</span>
                <span class="text-2xl font-bold font-serif text-gold-400">
                  KES {{ formatCurrency(calculatedTotal) }}
                </span>
              </div>

              <!-- Hold Timer Policy Notice -->
              <div class="p-3 rounded-lg bg-navy-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Seat is placed on a <strong>15-minute exclusive hold</strong> upon proceeding.</span>
              </div>

              <!-- Action Button -->
              <button
                @click="handleHoldSeat"
                :disabled="isSubmitting"
                class="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 shadow-xl shadow-gold-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span v-if="isSubmitting">Placing Exclusive Hold...</span>
                <span v-else>Hold Seat & Pay Now</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            <!-- If Fully Booked: Waitlist Card -->
            <div v-else class="space-y-4">
              <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
                <span class="text-xs uppercase tracking-wider font-bold text-rose-400 block">All Seats Allocated</span>
                <p class="text-xs text-slate-300">
                  This cohort has reached maximum capacity. Join the waitlist to receive immediate automated seat offers if holds expire or cancellations occur.
                </p>
              </div>

              <div v-if="waitlistJoined" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <span class="text-sm font-bold text-emerald-400 block">✓ You Are on the Waitlist!</span>
                <p class="text-xs text-slate-300">
                  You will receive an instant email and SMS alert if a seat is released for your booking.
                </p>
              </div>

              <div v-else class="space-y-3">
                <label class="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Waitlist Preference
                </label>
                <select
                  v-model="selectedBookingType"
                  class="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white text-xs"
                >
                  <option value="training_only">Training Only</option>
                  <option v-if="event.has_accommodation" value="training_and_accommodation">Training + Lodging</option>
                </select>

                <button
                  @click="handleJoinWaitlist"
                  :disabled="isSubmitting"
                  class="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-navy-800 hover:bg-navy-700 text-white border border-slate-600 hover:border-gold-500 transition-all flex items-center justify-center gap-2"
                >
                  <span v-if="isSubmitting">Joining Queue...</span>
                  <span v-else>Join Priority Waitlist</span>
                </button>
              </div>
            </div>

            <div v-if="actionError" class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
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
