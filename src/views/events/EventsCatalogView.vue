<template>
  <div class="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header Hero -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-950 p-8 sm:p-12 border border-gold-500/20 shadow-2xl">
      <div class="relative z-10 max-w-3xl">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/30 mb-4">
          In-Person Intensives & Workshops
        </span>
        <h1 class="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
          Experience Live Music Mastery at Bariton
        </h1>
        <p class="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          Accelerate your musicianship through hands-on, in-person bootcamps, masterclasses, and vocal workshops held at BMAS campus studios in Nairobi. Strict seat limits with optional residential lodging.
        </p>
      </div>

      <!-- Luxury Decorative Glow -->
      <div class="absolute -right-16 -bottom-16 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute right-1/3 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- Events List -->
    <div v-if="eventsStore.loading" class="flex justify-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
        <p class="text-slate-400 text-sm">Loading upcoming bootcamps and workshops...</p>
      </div>
    </div>

    <div v-else-if="eventsStore.events.length === 0" class="py-16 text-center bg-navy-900/40 rounded-2xl border border-slate-800 p-12">
      <div class="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="text-xl font-serif font-semibold text-white">No Upcoming Events Published</h3>
      <p class="text-slate-400 text-sm mt-2 max-w-md mx-auto">
        New bootcamps and workshops are announced quarterly. Check back soon or join our community newsletter.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="event in eventsStore.events"
        :key="event.id"
        class="flex flex-col rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-gold-500/40 transition-all duration-300 shadow-xl overflow-hidden group hover:-translate-y-1"
      >
        <!-- Top Status Banner -->
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span
                class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
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
                class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30"
              >
                Sold Out
              </span>
              <span
                v-else-if="event.available_seats_count <= 5"
                class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
              >
                Only {{ event.available_seats_count }} seats left!
              </span>
              <span
                v-else
                class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700"
              >
                {{ event.available_seats_count }} seats open
              </span>
            </div>

            <h3 class="text-xl font-serif font-bold text-white group-hover:text-gold-400 transition-colors line-clamp-2">
              {{ event.title }}
            </h3>

            <p class="mt-3 text-sm text-slate-300 line-clamp-3 leading-relaxed">
              {{ event.description }}
            </p>
          </div>

          <!-- Metadata & Logistics -->
          <div class="mt-6 space-y-3 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ formatDateRange(event.start_date, event.end_date) }}</span>
            </div>

            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="truncate">{{ event.venue }}</span>
            </div>

            <div v-if="event.has_accommodation" class="flex items-center gap-2.5 text-indigo-300 font-medium">
              <svg class="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Lodging & Meals Package Available</span>
            </div>

            <!-- Seat Occupancy Progress -->
            <div class="pt-2">
              <div class="flex justify-between text-xs text-slate-400 mb-1">
                <span>Capacity</span>
                <span>{{ event.occupied_seats_count }} / {{ event.capacity }} booked</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  class="h-1.5 rounded-full transition-all duration-500"
                  :class="event.is_full ? 'bg-rose-500' : 'bg-gold-500'"
                  :style="{ width: `${Math.min(100, (event.occupied_seats_count / event.capacity) * 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Action & Pricing Footer -->
        <div class="p-6 bg-navy-950/80 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-400 block font-medium">Starting from</span>
            <span class="text-lg font-bold text-white">KES {{ formatCurrency(event.training_fee_kes) }}</span>
          </div>

          <RouterLink
            :to="{ name: 'event-detail', params: { slug: event.slug } }"
            class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            :class="event.is_full
              ? 'bg-navy-900 border border-slate-700 text-slate-200 hover:border-gold-500 hover:text-white'
              : 'bg-gold-500 hover:bg-gold-400 text-navy-950 shadow-lg shadow-gold-500/20'"
          >
            <span>{{ event.is_full ? 'Join Waitlist' : 'Reserve Seat' }}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useEventsStore } from '../../stores/events';

const eventsStore = useEventsStore();

onMounted(async () => {
  await eventsStore.fetchEvents();
});

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
