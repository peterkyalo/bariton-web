<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTutoringStore } from '../../stores/tutoring'
import http from '../../lib/http'

const router = useRouter()
const tutoringStore = useTutoringStore()

const activeTab = ref('sessions') // 'sessions' | 'book' | 'packages'
const loading = ref(false)
const bookingLoading = ref(false)
const rescheduleLoading = ref(false)
const notification = ref(null)

// Booking form state
const selectedPackageId = ref('')
const selectedInstructorId = ref('')
const selectedDate = ref('')
const selectedSlot = ref(null)
const selectedMode = ref('zoom')
const instructorsList = ref([])

// Reschedule modal state
const showRescheduleModal = ref(false)
const sessionToReschedule = ref(null)
const rescheduleDate = ref('')
const rescheduleSlot = ref(null)
const noticeWaived = ref(false)
const waiverReason = ref('')

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  notification.value = null
  try {
    await Promise.all([
      tutoringStore.fetchStudentPackages(),
      tutoringStore.fetchStudentSessions(),
      fetchInstructors(),
    ])
  } catch (err) {
    // handled in store
  } finally {
    loading.value = false
  }
}

async function fetchInstructors() {
  try {
    const res = await http.get('/tutoring/instructors')
    instructorsList.value = res.data.data || []
  } catch (e) {
    instructorsList.value = []
  }
}

const activePackages = computed(() => {
  return tutoringStore.studentPackages.filter(p => p.status === 'active' && p.remaining_credits > 0)
})

const totalAvailableCredits = computed(() => {
  return activePackages.value.reduce((acc, p) => acc + (p.remaining_credits || 0), 0)
})

const upcomingSessions = computed(() => {
  return tutoringStore.studentSessions.filter(s => s.status === 'scheduled' || s.status === 'rescheduled')
})

const pastSessions = computed(() => {
  return tutoringStore.studentSessions.filter(s => s.status !== 'scheduled' && s.status !== 'rescheduled')
})

// Auto-fill instructor when package is selected
watch(selectedPackageId, (newVal) => {
  const pkg = activePackages.value.find(p => p.id === Number(newVal))
  if (pkg?.package?.instructor_id) {
    selectedInstructorId.value = pkg.package.instructor_id
  }
})

// Trigger slot fetching when instructor or date changes
watch([selectedInstructorId, selectedDate], async ([newInstr, newDate]) => {
  selectedSlot.value = null
  if (newInstr && newDate) {
    await tutoringStore.fetchAvailableSlots(newInstr, { date: newDate })
  }
})

// Trigger slot fetching for reschedule modal
watch([rescheduleDate], async ([newDate]) => {
  rescheduleSlot.value = null
  if (sessionToReschedule.value && newDate) {
    await tutoringStore.fetchAvailableSlots(sessionToReschedule.value.instructor_id, { date: newDate })
  }
})

async function handleBookSession() {
  if (!selectedPackageId.value || !selectedSlot.value) {
    notification.value = { type: 'error', message: 'Please select a package, date, and time slot.' }
    return
  }

  const pkg = activePackages.value.find(p => p.id === Number(selectedPackageId.value))

  bookingLoading.value = true
  notification.value = null
  try {
    await tutoringStore.bookSession({
      student_tutoring_package_id: selectedPackageId.value,
      instructor_id: selectedInstructorId.value || pkg?.package?.instructor_id,
      course_id: pkg?.package?.course_id || null,
      scheduled_start: selectedSlot.value.start,
      scheduled_end: selectedSlot.value.end,
      mode: selectedMode.value,
    })

    notification.value = { type: 'success', message: 'Tutoring session successfully booked! Calendar invitations sent.' }
    selectedSlot.value = null
    activeTab.value = 'sessions'
    await loadData()
  } catch (err) {
    notification.value = {
      type: 'error',
      message: err.response?.data?.message || 'Could not complete booking. Please choose another slot.',
    }
  } finally {
    bookingLoading.value = false
  }
}

function openReschedule(session) {
  sessionToReschedule.value = session
  rescheduleDate.value = ''
  rescheduleSlot.value = null
  noticeWaived.value = false
  waiverReason.value = ''
  showRescheduleModal.value = true
}

const isWithinNoticePeriod = computed(() => {
  if (!sessionToReschedule.value) return false
  const sessionTime = new Date(sessionToReschedule.value.scheduled_start).getTime()
  const now = Date.now()
  const hoursUntilSession = (sessionTime - now) / (1000 * 60 * 60)
  return hoursUntilSession < 24
})

async function submitReschedule() {
  if (!rescheduleSlot.value) {
    alert('Please select a new time slot.')
    return
  }
  if (isWithinNoticePeriod.value && !noticeWaived.value) {
    alert('This session starts in under 24 hours. Please check the emergency waiver box and provide a reason.')
    return
  }

  rescheduleLoading.value = true
  try {
    await tutoringStore.rescheduleSession(sessionToReschedule.value.uuid, {
      scheduled_start: rescheduleSlot.value.start,
      scheduled_end: rescheduleSlot.value.end,
      waive_notice: noticeWaived.value,
      waiver_reason: noticeWaived.value ? waiverReason.value : null,
    })
    showRescheduleModal.value = false
    notification.value = { type: 'success', message: 'Session successfully rescheduled!' }
    await loadData()
  } catch (err) {
    alert(err.response?.data?.message || 'Rescheduling failed. Slot may no longer be available.')
  } finally {
    rescheduleLoading.value = false
  }
}

function formatDatetime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  }) + ' (EAT)'
}

function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  })
}
</script>

<template>
  <div class="space-y-8">
    <!-- Top Stats Bar -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <p class="text-xs font-display font-semibold uppercase tracking-wider text-slate-400">Available Credits</p>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-display font-extrabold text-amber-400">{{ totalAvailableCredits }}</span>
          <span class="text-xs text-slate-500">hours</span>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <p class="text-xs font-display font-semibold uppercase tracking-wider text-slate-400">Active Packages</p>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-display font-extrabold text-white">{{ activePackages.length }}</span>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <p class="text-xs font-display font-semibold uppercase tracking-wider text-slate-400">Upcoming Sessions</p>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-display font-extrabold text-emerald-400">{{ upcomingSessions.length }}</span>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <p class="text-xs font-display font-semibold uppercase tracking-wider text-slate-400">Completed Sessions</p>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-display font-extrabold text-slate-300">{{ pastSessions.filter(s => s.status === 'attended').length }}</span>
        </div>
      </div>
    </div>

    <!-- Alert / Notification -->
    <div
      v-if="notification"
      :class="notification.type === 'success' ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300' : 'bg-rose-950/50 border-rose-800 text-rose-300'"
      class="border rounded-xl p-4 text-sm flex items-center justify-between"
    >
      <span>{{ notification.message }}</span>
      <button @click="notification = null" class="text-slate-400 hover:text-white">&times;</button>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-slate-800 flex items-center justify-between">
      <nav class="flex gap-6 -mb-px">
        <button
          @click="activeTab = 'sessions'"
          :class="activeTab === 'sessions' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="py-3 px-1 border-b-2 text-sm transition-all"
        >
          My Booked Sessions ({{ upcomingSessions.length }})
        </button>
        <button
          @click="activeTab = 'book'"
          :class="activeTab === 'book' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="py-3 px-1 border-b-2 text-sm transition-all flex items-center gap-2"
        >
          <span>Book a Session</span>
          <span v-if="totalAvailableCredits > 0" class="px-1.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 font-semibold">
            {{ totalAvailableCredits }} credit{{ totalAvailableCredits > 1 ? 's' : '' }}
          </span>
        </button>
        <button
          @click="activeTab = 'packages'"
          :class="activeTab === 'packages' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="py-3 px-1 border-b-2 text-sm transition-all"
        >
          Package Credits Ledger
        </button>
      </nav>

      <router-link
        :to="{ name: 'tutoring-packages' }"
        class="text-xs font-semibold text-amber-400 hover:text-amber-300 py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
      >
        + Buy Tutoring Package
      </router-link>
    </div>

    <!-- Tab 1: Booked Sessions -->
    <div v-if="activeTab === 'sessions'" class="space-y-6">
      <div v-if="loading" class="py-12 text-center text-slate-500">Loading your sessions...</div>

      <div v-else-if="upcomingSessions.length === 0 && pastSessions.length === 0" class="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl p-8">
        <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-slate-400 font-medium">You have no booked tutoring sessions yet.</p>
        <p class="text-xs text-slate-500 mt-1">Purchase credits or book a slot from your active package credits.</p>
        <button
          @click="activeTab = totalAvailableCredits > 0 ? 'book' : 'packages'"
          class="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
        >
          {{ totalAvailableCredits > 0 ? 'Book a Session Now' : 'View Tutoring Packages' }}
        </button>
      </div>

      <!-- Upcoming Sessions Cards -->
      <div v-if="upcomingSessions.length > 0" class="space-y-4">
        <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Upcoming Sessions</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="s in upcomingSessions"
            :key="s.id"
            class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div class="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h4 class="font-bold text-white text-base">
                    {{ s.course ? s.course.title : 'General Technique Mentorship' }}
                  </h4>
                  <p class="text-xs text-slate-400">
                    Instructor: <span class="text-slate-200 font-medium">{{ s.instructor ? s.instructor.name : 'Academy Master' }}</span>
                  </p>
                </div>
                <span
                  :class="s.status === 'rescheduled' ? 'bg-amber-950/60 text-amber-300 border-amber-800' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'"
                  class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded border"
                >
                  {{ s.status }}
                </span>
              </div>

              <!-- Time & Date -->
              <div class="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1 mb-4">
                <div class="flex items-center gap-2 text-slate-300">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{{ formatDatetime(s.scheduled_start) }}</span>
                </div>
                <div class="flex items-center gap-2 text-slate-400">
                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Duration: 60 minutes (End: {{ formatTime(s.scheduled_end) }})</span>
                </div>
                <div class="flex items-center gap-2 text-slate-400">
                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>Mode: <strong class="text-slate-200 capitalize">{{ s.mode ? s.mode.replace('_', ' ') : 'Online' }}</strong></span>
                </div>
              </div>

              <!-- Meeting Link / Location Info -->
              <div v-if="s.meeting_link" class="mb-4">
                <a
                  :href="s.meeting_link"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Launch {{ s.mode === 'zoom' ? 'Zoom' : 'Google Meet' }} Link
                </a>
              </div>
              <div v-else-if="s.location" class="mb-4 text-xs text-slate-400">
                <span class="font-medium text-slate-300">Studio Venue:</span> {{ s.location }}
              </div>
              <div v-else class="mb-4 text-xs text-slate-500 italic">
                Instructor will publish meeting link / room before start time.
              </div>
            </div>

            <!-- Card Actions -->
            <div class="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                @click="openReschedule(s)"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Reschedule Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Past Sessions -->
      <div v-if="pastSessions.length > 0" class="space-y-4 pt-6">
        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Past / Cancelled Sessions</h3>
        <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/60 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Date & Time</th>
                <th class="py-3 px-4">Instructor</th>
                <th class="py-3 px-4">Mode</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Instructor Feedback</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-for="s in pastSessions" :key="s.id" class="hover:bg-slate-800/40">
                <td class="py-3 px-4 font-mono">{{ formatDatetime(s.scheduled_start) }}</td>
                <td class="py-3 px-4">{{ s.instructor ? s.instructor.name : '—' }}</td>
                <td class="py-3 px-4 capitalize">{{ s.mode ? s.mode.replace('_', ' ') : '—' }}</td>
                <td class="py-3 px-4">
                  <span
                    :class="{
                      'text-emerald-400': s.status === 'attended',
                      'text-rose-400': s.status === 'missed',
                      'text-slate-400': s.status.includes('cancelled')
                    }"
                    class="font-semibold capitalize"
                  >
                    {{ s.status.replace(/_/g, ' ') }}
                  </span>
                </td>
                <td class="py-3 px-4 text-slate-400 italic">
                  {{ s.instructor_notes || 'No notes provided' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 2: Book a Session -->
    <div v-if="activeTab === 'book'" class="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div class="border-b border-slate-800 pb-4">
        <h3 class="text-xl font-bold text-white">Book Your 1-on-1 Studio Slot</h3>
        <p class="text-xs text-slate-400 mt-1">
          Pick an instructor, choose an open calendar slot, and select your preferred session delivery mode.
        </p>
      </div>

      <div v-if="totalAvailableCredits === 0" class="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-amber-300 text-xs flex items-center justify-between">
        <span>You have 0 available session credits. Please purchase a package first.</span>
        <router-link :to="{ name: 'tutoring-packages' }" class="underline font-bold">Browse Packages</router-link>
      </div>

      <div v-else class="space-y-6">
        <!-- 1. Select Active Package -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-2">1. Select Package Credit</label>
          <select
            v-model="selectedPackageId"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="" disabled>-- Select a purchased package --</option>
            <option v-for="pkg in activePackages" :key="pkg.id" :value="pkg.id">
              {{ pkg.package ? pkg.package.title : 'Tutoring Package' }} ({{ pkg.remaining_credits }} credits remaining — expires {{ pkg.expires_at ? new Date(pkg.expires_at).toLocaleDateString() : 'N/A' }})
            </option>
          </select>
        </div>

        <!-- 2. Select Instructor -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-2">2. Select Instructor</label>
          <select
            v-model="selectedInstructorId"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="" disabled>-- Choose an instructor --</option>
            <option v-for="instr in instructorsList" :key="instr.id" :value="instr.id">
              {{ instr.name }} ({{ instr.email }})
            </option>
          </select>
        </div>

        <!-- 3. Select Date -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-2">3. Lesson Date (Africa/Nairobi)</label>
          <input
            type="date"
            v-model="selectedDate"
            :min="new Date().toISOString().split('T')[0]"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <!-- 4. Available Slots Grid -->
        <div v-if="selectedInstructorId && selectedDate">
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-2">4. Open 60-Minute Slots</label>

          <div v-if="tutoringStore.loading" class="py-6 text-center text-xs text-slate-500">
            Checking instructor calendar and buffer times...
          </div>

          <div v-else-if="tutoringStore.availableSlots.length === 0" class="p-4 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-400">
            No open slots found on this date. The instructor may be off, booked, or outside weekly availability.
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              v-for="slot in tutoringStore.availableSlots"
              :key="slot.start"
              type="button"
              @click="selectedSlot = slot"
              :class="selectedSlot?.start === slot.start ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 ring-2 ring-amber-400/50' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'"
              class="p-3 text-xs rounded-lg border text-center transition-all"
            >
              <div class="font-mono text-sm">{{ formatTime(slot.start) }} - {{ formatTime(slot.end) }}</div>
              <div class="text-[10px] opacity-75 mt-0.5">EAT Nairobi</div>
            </button>
          </div>
        </div>

        <!-- 5. Mode Selection -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-2">5. Session Delivery Mode</label>
          <div class="grid grid-cols-3 gap-3">
            <label
              :class="selectedMode === 'zoom' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400'"
              class="flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer text-xs font-medium text-center transition-all"
            >
              <input type="radio" v-model="selectedMode" value="zoom" class="sr-only" />
              <span>Zoom Meeting</span>
            </label>
            <label
              :class="selectedMode === 'google_meet' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400'"
              class="flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer text-xs font-medium text-center transition-all"
            >
              <input type="radio" v-model="selectedMode" value="google_meet" class="sr-only" />
              <span>Google Meet</span>
            </label>
            <label
              :class="selectedMode === 'in_person' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400'"
              class="flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer text-xs font-medium text-center transition-all"
            >
              <input type="radio" v-model="selectedMode" value="in_person" class="sr-only" />
              <span>Nairobi Studio</span>
            </label>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-4 border-t border-slate-800">
          <button
            type="button"
            @click="handleBookSession"
            :disabled="bookingLoading || !selectedSlot"
            class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span v-if="bookingLoading">Locking Slot & Booking...</span>
            <span v-else>Confirm & Deduct 1 Credit</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 3: Package Credits Ledger -->
    <div v-if="activeTab === 'packages'" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Purchased Tutoring Packages</h3>
        <router-link :to="{ name: 'tutoring-packages' }" class="text-xs text-amber-400 font-semibold hover:underline">
          Purchase New Package
        </router-link>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-950/60 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th class="py-3 px-4">Package</th>
              <th class="py-3 px-4">Total Credits</th>
              <th class="py-3 px-4">Used</th>
              <th class="py-3 px-4">Remaining</th>
              <th class="py-3 px-4">Expiry Date</th>
              <th class="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-if="tutoringStore.studentPackages.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-500">
                You have not purchased any tutoring packages.
              </td>
            </tr>
            <tr v-for="pkg in tutoringStore.studentPackages" :key="pkg.id" class="hover:bg-slate-800/40">
              <td class="py-3 px-4 font-bold text-white">
                {{ pkg.package ? pkg.package.title : 'Tutoring Package' }}
              </td>
              <td class="py-3 px-4">{{ pkg.total_credits }}</td>
              <td class="py-3 px-4">{{ pkg.used_credits }}</td>
              <td class="py-3 px-4 font-bold text-amber-400">{{ pkg.remaining_credits }}</td>
              <td class="py-3 px-4 font-mono">{{ pkg.expires_at ? new Date(pkg.expires_at).toLocaleDateString() : 'N/A' }}</td>
              <td class="py-3 px-4">
                <span
                  :class="{
                    'bg-emerald-950/60 text-emerald-300 border-emerald-800': pkg.status === 'active',
                    'bg-slate-800 text-slate-400 border-slate-700': pkg.status === 'exhausted',
                    'bg-rose-950/60 text-rose-300 border-rose-800': pkg.status === 'expired'
                  }"
                  class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded border"
                >
                  {{ pkg.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reschedule Modal -->
    <div
      v-if="showRescheduleModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h4 class="font-bold text-white text-base">Reschedule Session</h4>
          <button @click="showRescheduleModal = false" class="text-slate-400 hover:text-white text-lg">&times;</button>
        </div>

        <div v-if="isWithinNoticePeriod" class="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-xs text-amber-200 space-y-2">
          <div class="font-bold flex items-center gap-1 text-amber-300">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Notice Period Policy (< 24 Hours)
          </div>
          <p>
            Standard policy requires at least 24 hours advance notice. If you are experiencing unavoidable emergency circumstances (such as illness), you may request a policy waiver.
          </p>
          <div class="pt-2 flex items-center gap-2">
            <input type="checkbox" id="waiveNotice" v-model="noticeWaived" class="rounded border-slate-700 text-amber-500 focus:ring-amber-500" />
            <label for="waiveNotice" class="font-semibold text-white">I request an emergency notice waiver</label>
          </div>
          <div v-if="noticeWaived" class="pt-1">
            <textarea
              v-model="waiverReason"
              placeholder="State unavoidable emergency reason (e.g. sudden illness, hospitalisation)..."
              class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
              rows="2"
            ></textarea>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Pick New Date</label>
            <input
              type="date"
              v-model="rescheduleDate"
              :min="new Date().toISOString().split('T')[0]"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
            />
          </div>

          <div v-if="rescheduleDate">
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Available Slots</label>
            <div v-if="tutoringStore.availableSlots.length === 0" class="text-xs text-slate-500 py-2">
              No slots available on this date.
            </div>
            <div v-else class="grid grid-cols-2 gap-2">
              <button
                v-for="slot in tutoringStore.availableSlots"
                :key="slot.start"
                type="button"
                @click="rescheduleSlot = slot"
                :class="rescheduleSlot?.start === slot.start ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'"
                class="p-2 text-xs rounded border text-center font-mono"
              >
                {{ formatTime(slot.start) }} - {{ formatTime(slot.end) }}
              </button>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-800 pt-3 flex justify-end gap-2">
          <button
            @click="showRescheduleModal = false"
            class="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            @click="submitReschedule"
            :disabled="rescheduleLoading || !rescheduleSlot"
            class="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {{ rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
