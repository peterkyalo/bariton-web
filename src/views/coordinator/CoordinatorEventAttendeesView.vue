<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/30">
            Coordinator Operations
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mt-1">
          Event Attendance & Check-In Roster
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Manage physical cohort attendance, check in participants at the door, and broadcast email/SMS reminders.
        </p>
      </div>

      <!-- Action: Dispatch Reminders -->
      <div class="flex items-center gap-3">
        <button
          v-if="selectedEventId"
          @click="handleSendReminders"
          :disabled="sendingReminders"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span v-if="sendingReminders">Dispatching...</span>
          <span v-else>Broadcast Reminders</span>
        </button>
      </div>
    </div>

    <!-- Event Selector Dropdown -->
    <div class="p-6 rounded-2xl bg-navy-900/60 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div class="w-full sm:max-w-md">
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Select Event / Bootcamp
        </label>
        <select
          v-model="selectedEventId"
          @change="loadAttendees"
          class="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-gold-500"
        >
          <option v-for="evt in eventsStore.coordinatorEvents" :key="evt.id" :value="evt.id">
            {{ evt.title }} ({{ formatDate(evt.start_date) }})
          </option>
        </select>
      </div>

      <!-- Reminder Toast -->
      <div v-if="reminderMessage" class="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
        {{ reminderMessage }}
      </div>
    </div>

    <!-- Statistics Cards -->
    <div v-if="eventsStore.coordinatorStats" class="grid grid-cols-2 sm:grid-cols-5 gap-4">
      <div class="p-4 rounded-xl bg-navy-900 border border-slate-800">
        <div class="text-xs text-slate-400 font-medium">Total Registrations</div>
        <div class="text-2xl font-bold font-serif text-white mt-1">{{ eventsStore.coordinatorStats.total_bookings }}</div>
      </div>

      <div class="p-4 rounded-xl bg-navy-900 border border-slate-800">
        <div class="text-xs text-slate-400 font-medium">Confirmed Seats</div>
        <div class="text-2xl font-bold font-serif text-emerald-400 mt-1">{{ eventsStore.coordinatorStats.confirmed }}</div>
      </div>

      <div class="p-4 rounded-xl bg-navy-900 border border-slate-800">
        <div class="text-xs text-slate-400 font-medium">Checked In</div>
        <div class="text-2xl font-bold font-serif text-gold-400 mt-1">{{ eventsStore.coordinatorStats.attended }}</div>
      </div>

      <div class="p-4 rounded-xl bg-navy-900 border border-slate-800">
        <div class="text-xs text-slate-400 font-medium">Training Only</div>
        <div class="text-2xl font-bold font-serif text-slate-300 mt-1">{{ eventsStore.coordinatorStats.training_only }}</div>
      </div>

      <div class="p-4 rounded-xl bg-navy-900 border border-slate-800">
        <div class="text-xs text-slate-400 font-medium">With Lodging</div>
        <div class="text-2xl font-bold font-serif text-indigo-400 mt-1">{{ eventsStore.coordinatorStats.with_accommodation }}</div>
      </div>
    </div>

    <!-- Filters & Table -->
    <div class="rounded-2xl bg-navy-900/60 border border-slate-800 overflow-hidden shadow-2xl">
      <!-- Table Controls -->
      <div class="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <!-- Search -->
        <div class="relative flex-1 sm:max-w-xs">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search attendee by name, email..."
            class="w-full pl-9 pr-4 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
          <svg class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Filter Options -->
        <div class="flex items-center gap-3">
          <select
            v-model="accommodationFilter"
            @change="loadAttendees"
            class="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white text-xs focus:outline-none"
          >
            <option value="">All Packages</option>
            <option value="training_only">Training Only</option>
            <option value="training_and_accommodation">With Lodging</option>
          </select>

          <select
            v-model="statusFilter"
            @change="loadAttendees"
            class="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white text-xs focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="attended">Attended</option>
            <option value="held">Held (Pending)</option>
          </select>
        </div>
      </div>

      <!-- Attendees Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-navy-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th class="py-3.5 px-6">Attendee</th>
              <th class="py-3.5 px-6">Contact</th>
              <th class="py-3.5 px-6">Package</th>
              <th class="py-3.5 px-6">Fee Paid</th>
              <th class="py-3.5 px-6">Status</th>
              <th class="py-3.5 px-6 text-right">Door Check-In</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80 text-slate-300">
            <tr v-if="filteredAttendees.length === 0">
              <td colspan="6" class="py-12 text-center text-slate-400">
                No attendees match current criteria.
              </td>
            </tr>

            <tr
              v-for="att in filteredAttendees"
              :key="att.id"
              class="hover:bg-navy-800/40 transition-colors"
            >
              <td class="py-4 px-6">
                <div class="font-bold text-white text-sm">{{ att.user?.name || 'Attendee' }}</div>
                <div class="text-slate-400 font-mono text-[10px]">#{{ att.uuid.substring(0, 8) }}</div>
              </td>

              <td class="py-4 px-6 space-y-0.5">
                <div>{{ att.user?.email }}</div>
                <div class="text-slate-400 font-mono text-[11px]">{{ att.user?.phone || 'No phone' }}</div>
              </td>

              <td class="py-4 px-6">
                <span
                  class="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                  :class="att.booking_type === 'training_and_accommodation'
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'"
                >
                  {{ att.booking_type === 'training_and_accommodation' ? 'Training + Lodging' : 'Training Only' }}
                </span>
              </td>

              <td class="py-4 px-6 font-semibold text-white">
                KES {{ formatCurrency(att.total_fee_kes) }}
              </td>

              <td class="py-4 px-6">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  :class="{
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': att.status === 'confirmed',
                    'bg-gold-500/10 text-gold-400 border border-gold-500/30': att.status === 'attended',
                    'bg-amber-500/10 text-amber-400 border border-amber-500/30': att.status === 'held'
                  }"
                >
                  {{ att.status }}
                </span>
              </td>

              <td class="py-4 px-6 text-right">
                <button
                  v-if="att.status === 'confirmed'"
                  @click="handleCheckIn(att.uuid)"
                  class="px-3.5 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs shadow-md transition-all"
                >
                  Check In
                </button>
                <span
                  v-else-if="att.status === 'attended'"
                  class="inline-flex items-center gap-1 text-gold-400 font-semibold text-xs"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Checked In
                </span>
                <span v-else class="text-slate-500 text-xs italic">
                  Not Confirmed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useEventsStore } from '../../stores/events';

const eventsStore = useEventsStore();

const selectedEventId = ref(null);
const accommodationFilter = ref('');
const statusFilter = ref('');
const searchQuery = ref('');
const sendingReminders = ref(false);
const reminderMessage = ref(null);

onMounted(async () => {
  const events = await eventsStore.fetchCoordinatorEvents();
  if (events && events.length > 0) {
    selectedEventId.value = events[0].id;
    await loadAttendees();
  }
});

async function loadAttendees() {
  if (!selectedEventId.value) return;
  const params = {};
  if (accommodationFilter.value) params.booking_type = accommodationFilter.value;
  if (statusFilter.value) params.status = statusFilter.value;

  await eventsStore.fetchCoordinatorAttendees(selectedEventId.value, params);
}

const filteredAttendees = computed(() => {
  let list = eventsStore.coordinatorAttendees || [];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter((a) => {
      const name = a.user?.name?.toLowerCase() || '';
      const email = a.user?.email?.toLowerCase() || '';
      const phone = a.user?.phone?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }
  return list;
});

async function handleCheckIn(uuid) {
  try {
    await eventsStore.checkInAttendee(uuid);
  } catch (err) {
    alert(err.response?.data?.message || 'Check-in failed');
  }
}

async function handleSendReminders() {
  if (!selectedEventId.value) return;
  sendingReminders.value = true;
  reminderMessage.value = null;

  try {
    const res = await eventsStore.sendReminders(selectedEventId.value);
    reminderMessage.value = res.message || 'Reminders dispatched successfully.';
    setTimeout(() => {
      reminderMessage.value = null;
    }, 5000);
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to dispatch reminders.');
  } finally {
    sendingReminders.value = false;
  }
}

function formatCurrency(cents) {
  return (cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
