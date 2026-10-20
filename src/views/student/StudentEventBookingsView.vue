<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
          My Bootcamps & Workshops
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Track your in-person workshop seat reservations, active holds, venue passes, and waitlist allocations.
        </p>
      </div>

      <div>
        <RouterLink
          :to="{ name: 'events-catalog' }"
          class="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/20 transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Browse Upcoming Events
        </RouterLink>
      </div>
    </div>

    <!-- Active Hold Alert Banner (If Any Active Holds) -->
    <div
      v-for="booking in activeHolds"
      :key="booking.id"
      class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
    >
      <div class="flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div class="text-sm font-bold text-white flex items-center gap-2">
            <span>Seat Hold Active for {{ booking.event?.title || 'Event' }}</span>
            <span class="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 font-mono">
              {{ formatSeconds(booking.seconds_remaining_on_hold) }} remaining
            </span>
          </div>
          <p class="text-xs text-slate-300 mt-0.5">
            Your seat is reserved exclusively. Complete payment before the timer expires to secure your spot.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <RouterLink
          v-if="booking.order"
          :to="{ name: 'checkout', params: { uuid: booking.order.uuid } }"
          class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs shadow-lg transition-all"
        >
          Pay KES {{ formatCurrency(booking.total_fee_kes) }} Now
        </RouterLink>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex gap-4 border-b border-slate-800 text-sm">
      <button
        @click="activeTab = 'bookings'"
        class="pb-3 font-semibold transition-all border-b-2"
        :class="activeTab === 'bookings' ? 'border-gold-500 text-gold-400' : 'border-transparent text-slate-400 hover:text-white'"
      >
        Booked Seats ({{ confirmedAndHeldBookings.length }})
      </button>

      <button
        @click="activeTab = 'waitlists'"
        class="pb-3 font-semibold transition-all border-b-2"
        :class="activeTab === 'waitlists' ? 'border-gold-500 text-gold-400' : 'border-transparent text-slate-400 hover:text-white'"
      >
        Waitlists ({{ eventsStore.studentWaitlists.length }})
      </button>

      <button
        @click="activeTab = 'history'"
        class="pb-3 font-semibold transition-all border-b-2"
        :class="activeTab === 'history' ? 'border-gold-500 text-gold-400' : 'border-transparent text-slate-400 hover:text-white'"
      >
        Past & Refunded
      </button>
    </div>

    <!-- Content: Bookings Tab -->
    <div v-if="activeTab === 'bookings'" class="space-y-6">
      <div v-if="eventsStore.loading" class="py-16 text-center text-slate-400 text-sm">
        Loading event bookings...
      </div>

      <div v-else-if="confirmedAndHeldBookings.length === 0" class="py-16 text-center bg-navy-900/40 rounded-2xl border border-slate-800 p-8">
        <h3 class="text-base font-semibold text-white">No active event bookings</h3>
        <p class="text-xs text-slate-400 mt-1">Explore our schedule of in-person bootcamps and workshops in Nairobi.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="booking in confirmedAndHeldBookings"
          :key="booking.id"
          class="rounded-2xl bg-navy-900/70 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-6"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                :class="{
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': booking.status === 'confirmed',
                  'bg-amber-500/10 text-amber-400 border border-amber-500/30': booking.status === 'held',
                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30': booking.status === 'attended'
                }"
              >
                {{ booking.status === 'attended' ? 'Checked In' : booking.status }}
              </span>

              <span class="text-xs text-slate-400 font-mono">
                Booking #{{ booking.uuid.substring(0, 8) }}
              </span>
            </div>

            <h3 class="text-lg font-serif font-bold text-white">
              {{ booking.event?.title }}
            </h3>

            <!-- Details -->
            <div class="mt-4 space-y-2 text-xs text-slate-300">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ formatDateRange(booking.event?.start_date, booking.event?.end_date) }}</span>
              </div>

              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span class="truncate">{{ booking.event?.venue }}</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-400">Package:</span>
                <span class="text-white">
                  {{ booking.booking_type === 'training_and_accommodation' ? 'Training + Lodging & Meals' : 'Training Only' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions & Bottom -->
          <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-400 block">Total Fee</span>
              <span class="text-base font-bold text-white">KES {{ formatCurrency(booking.total_fee_kes) }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="booking.status === 'confirmed'"
                @click="openRefundModal(booking)"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all"
              >
                Request Refund
              </button>

              <RouterLink
                v-if="booking.status === 'held' && booking.order"
                :to="{ name: 'checkout', params: { uuid: booking.order.uuid } }"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-navy-950 transition-all shadow-md"
              >
                Pay Now
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content: Waitlists Tab -->
    <div v-if="activeTab === 'waitlists'" class="space-y-6">
      <div v-if="eventsStore.studentWaitlists.length === 0" class="py-16 text-center bg-navy-900/40 rounded-2xl border border-slate-800 p-8">
        <h3 class="text-base font-semibold text-white">No waitlist entries</h3>
        <p class="text-xs text-slate-400 mt-1">When an event is fully booked, you can join the queue to be offered a seat as soon as one opens up.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="wl in eventsStore.studentWaitlists"
          :key="wl.id"
          class="p-5 rounded-2xl bg-navy-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                :class="{
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse': wl.status === 'offered',
                  'bg-slate-800 text-slate-300 border border-slate-700': wl.status === 'waiting'
                }"
              >
                {{ wl.status === 'offered' ? 'Seat Offered! Action Required' : 'Waiting in Queue' }}
              </span>
            </div>
            <h4 class="text-base font-serif font-bold text-white">{{ wl.event?.title }}</h4>
            <p class="text-xs text-slate-400 mt-1">
              {{ wl.booking_type === 'training_and_accommodation' ? 'Preference: Training + Lodging' : 'Preference: Training Only' }}
            </p>
          </div>

          <div v-if="wl.status === 'offered'">
            <span class="text-xs text-amber-400 font-semibold block mb-2">Offer expires in {{ formatSeconds(wl.seconds_remaining_on_offer) }}</span>
            <RouterLink
              :to="{ name: 'student-event-bookings' }"
              class="px-4 py-2 rounded-xl bg-gold-500 text-navy-950 font-bold text-xs"
            >
              Complete Seat Claim
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Content: Past & Refunded Tab -->
    <div v-if="activeTab === 'history'" class="space-y-6">
      <div v-if="pastBookings.length === 0" class="py-16 text-center bg-navy-900/40 rounded-2xl border border-slate-800 p-8">
        <h3 class="text-base font-semibold text-white">No past or refunded bookings</h3>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="b in pastBookings"
          :key="b.id"
          class="p-4 rounded-xl bg-navy-950/60 border border-slate-800 flex items-center justify-between"
        >
          <div>
            <h4 class="text-sm font-bold text-white">{{ b.event?.title }}</h4>
            <p class="text-xs text-slate-400 mt-0.5">{{ formatDateRange(b.event?.start_date, b.event?.end_date) }}</p>
          </div>
          <div>
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              :class="{
                'bg-rose-500/10 text-rose-400 border border-rose-500/30': b.status === 'refunded' || b.status === 'unseated',
                'bg-slate-800 text-slate-400': b.status === 'cancelled'
              }"
            >
              {{ b.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Refund Request Modal -->
    <div
      v-if="showRefundModal"
      class="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-navy-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 class="text-lg font-serif font-bold text-white">Request Event Refund</h3>
          <button @click="showRefundModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <!-- Policy Reminder -->
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
          <div class="font-bold">Cancellation Policy Reminder</div>
          <p>
            Per BMAS guidelines, event seat refunds must be submitted at least <strong>7 days before the start date</strong>. You must provide a valid reason and an emergency or medical document for review.
          </p>
        </div>

        <form @submit.prevent="submitRefund" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Reason for Cancellation *</label>
            <textarea
              v-model="refundReason"
              required
              rows="3"
              placeholder="Explain the emergency or circumstance preventing your attendance..."
              class="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-gold-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Supporting Document (PDF, Image, Max 10MB)</label>
            <input
              type="file"
              @change="onFileSelected"
              accept=".pdf,.png,.jpg,.jpeg"
              class="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-800 file:text-slate-200 hover:file:bg-navy-700 cursor-pointer"
            />
          </div>

          <div v-if="refundError" class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {{ refundError }}
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              @click="showRefundModal = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submittingRefund"
              class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg disabled:opacity-50"
            >
              <span v-if="submittingRefund">Submitting Request...</span>
              <span v-else>Submit Refund Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useEventsStore } from '../../stores/events';

const eventsStore = useEventsStore();
const activeTab = ref('bookings');

const showRefundModal = ref(false);
const activeRefundBooking = ref(null);
const refundReason = ref('');
const refundFile = ref(null);
const submittingRefund = ref(false);
const refundError = ref(null);

onMounted(async () => {
  await Promise.all([
    eventsStore.fetchStudentBookings(),
    eventsStore.fetchStudentWaitlists(),
  ]);
});

const activeHolds = computed(() => {
  return eventsStore.studentBookings.filter((b) => b.status === 'held' && b.seconds_remaining_on_hold > 0);
});

const confirmedAndHeldBookings = computed(() => {
  return eventsStore.studentBookings.filter((b) => ['confirmed', 'held', 'attended'].includes(b.status));
});

const pastBookings = computed(() => {
  return eventsStore.studentBookings.filter((b) => ['refunded', 'unseated', 'cancelled'].includes(b.status));
});

function openRefundModal(booking) {
  activeRefundBooking.value = booking;
  refundReason.value = '';
  refundFile.value = null;
  refundError.value = null;
  showRefundModal.value = true;
}

function onFileSelected(event) {
  const file = event.target.files[0];
  if (file) {
    refundFile.value = file;
  }
}

async function submitRefund() {
  if (!activeRefundBooking.value) return;

  submittingRefund.value = true;
  refundError.value = null;

  try {
    await eventsStore.submitRefundRequest(activeRefundBooking.value.uuid, {
      reason: refundReason.value,
      proofDocument: refundFile.value,
    });
    showRefundModal.value = false;
    await eventsStore.fetchStudentBookings();
  } catch (err) {
    refundError.value = err.response?.data?.message || err.message || 'Failed to submit refund request.';
  } finally {
    submittingRefund.value = false;
  }
}

function formatCurrency(cents) {
  return (cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatSeconds(secs) {
  if (!secs) return '00:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
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
