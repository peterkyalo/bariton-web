<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const auth = useAuthStore()
const dashboardStore = useDashboardStore()

onMounted(async () => {
  await dashboardStore.fetchCoordinatorMetrics()
})

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Hero Banner -->
    <div class="glass p-6 sm:p-8 border-brass-400/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Physical Events & Bootcamps Coordination
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Events Command Center: {{ auth.user?.name }}
        </h1>
        <p class="text-xs text-ink-300 mt-1 max-w-xl">
          Supervise physical masterclasses, track real-time venue seat capacities, monitor campus accommodation packages, and check in attendees at venue reception.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <RouterLink
          to="/coordinator/events"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
        >
          <span>Attendee Check-In Roster</span>
          <span>📋</span>
        </RouterLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="dashboardStore.loading" class="py-16 text-center text-ink-400">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400 mx-auto mb-3"></div>
      Loading event capacity registries and attendee rosters...
    </div>

    <div v-else-if="dashboardStore.coordinatorMetrics" class="space-y-8">
      <!-- 3 Key Events KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="glass p-6 rounded-2xl border-blue-500/30">
          <p class="text-xs font-bold text-blue-400 uppercase tracking-wider">Scheduled Events</p>
          <p class="text-3xl font-extrabold text-white my-2">
            {{ dashboardStore.coordinatorMetrics.events_count }}
          </p>
          <p class="text-xs text-ink-400">
            Active masterclasses, intensives, and bootcamps on the academy calendar.
          </p>
        </div>

        <div class="glass p-6 rounded-2xl border-emerald-500/30">
          <p class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Confirmed Attendees</p>
          <p class="text-3xl font-extrabold text-emerald-400 my-2">
            {{ dashboardStore.coordinatorMetrics.total_active_bookings }}
          </p>
          <p class="text-xs text-ink-400">
            Fully paid confirmed seats across all upcoming physical events.
          </p>
        </div>

        <div class="glass p-6 rounded-2xl border-amber-500/30">
          <p class="text-xs font-bold text-amber-400 uppercase tracking-wider">Checked In On-Site</p>
          <p class="text-3xl font-extrabold text-amber-400 my-2">
            {{ dashboardStore.coordinatorMetrics.total_attendees_checked_in }}
          </p>
          <p class="text-xs text-ink-400">
            Physical attendees marked present at venue check-in desks.
          </p>
        </div>
      </div>

      <!-- Events List Cards with Capacity Meters -->
      <div class="glass p-6 rounded-2xl space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Physical Events Occupancy & Logistics</h3>
          <RouterLink to="/events" class="text-xs text-brass-400 hover:underline">Public Schedule</RouterLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="ev in dashboardStore.coordinatorMetrics.events"
            :key="ev.id"
            class="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between"
          >
            <div>
              <div class="flex justify-between items-start gap-2 mb-2">
                <div>
                  <h4 class="font-bold text-white text-base">{{ ev.title }}</h4>
                  <p class="text-xs text-ink-400">{{ ev.venue }}</p>
                </div>
                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-brass-300 capitalize border border-slate-700">
                  {{ ev.type }}
                </span>
              </div>

              <div class="text-xs text-ink-300 font-mono mb-3">
                📅 {{ formatDate(ev.start_date) }} — {{ formatDate(ev.end_date) }}
              </div>

              <!-- Capacity Progress Bar -->
              <div class="space-y-1.5">
                <div class="flex justify-between text-xs font-medium">
                  <span class="text-ink-300">Seat Occupancy:</span>
                  <span class="font-mono text-white font-bold">{{ ev.confirmed_count }} / {{ ev.capacity }} seats</span>
                </div>
                <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                    :style="{ width: `${Math.min(100, Math.round((ev.confirmed_count / (ev.capacity || 1)) * 100))}%` }"
                  ></div>
                </div>
              </div>

              <!-- Accommodation and Check-In Badges -->
              <div class="grid grid-cols-2 gap-3 pt-3 text-xs text-ink-400">
                <div class="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                  <span class="block text-[11px] text-ink-500">Accommodation:</span>
                  <span class="font-bold text-white">{{ ev.accommodation_count }} reserved</span>
                </div>
                <div class="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                  <span class="block text-[11px] text-ink-500">Venue Check-In:</span>
                  <span class="font-bold text-emerald-400">{{ ev.attended_count }} present</span>
                </div>
              </div>
            </div>

            <RouterLink
              to="/coordinator/events"
              class="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center transition-colors block"
            >
              Open Attendee Check-In Desk
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
