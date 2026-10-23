<script setup>
import { ref, onMounted } from 'vue'
import { useTutoringStore } from '../../stores/tutoring'

const tutoringStore = useTutoringStore()

const activeTab = ref('shifts') // 'shifts' | 'blackouts' | 'roster'
const loading = ref(false)
const saveLoading = ref(false)
const message = ref(null)

// Weekly schedule shifts state
// Days 0 (Sunday) to 6 (Saturday) or Mon(1) to Sun(0)
const daysOfWeek = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' },
  { day: 0, name: 'Sunday' },
]

const shifts = ref([
  { day_of_week: 1, start_time: '09:00', end_time: '17:00', is_active: true },
  { day_of_week: 2, start_time: '09:00', end_time: '17:00', is_active: true },
  { day_of_week: 3, start_time: '09:00', end_time: '17:00', is_active: true },
  { day_of_week: 4, start_time: '09:00', end_time: '17:00', is_active: true },
  { day_of_week: 5, start_time: '09:00', end_time: '17:00', is_active: true },
  { day_of_week: 6, start_time: '10:00', end_time: '14:00', is_active: false },
  { day_of_week: 0, start_time: '10:00', end_time: '14:00', is_active: false },
])

// Blocked dates form
const newBlocked = ref({
  start_date: '',
  end_date: '',
  reason: '',
})

// Attendance modal state
const showAttendanceModal = ref(false)
const attendanceSession = ref(null)
const attendanceStatus = ref('attended')
const attendanceNotes = ref('')

// Cancel modal state
const showCancelModal = ref(false)
const cancelSession = ref(null)
const cancelReason = ref('')

// Details editor state
const editingDetailsUuid = ref(null)
const detailsLink = ref('')
const detailsLocation = ref('')

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  message.value = null
  try {
    const [avail, blocked, sessions] = await Promise.all([
      tutoringStore.fetchInstructorAvailability(),
      tutoringStore.fetchInstructorBlockedDates(),
      tutoringStore.fetchInstructorSessions(),
    ])

    // Hydrate weekly shifts if existing
    if (avail && avail.length > 0) {
      shifts.value = daysOfWeek.map(d => {
        const found = avail.find(a => a.day_of_week === d.day)
        if (found) {
          return {
            day_of_week: d.day,
            start_time: found.start_time.substring(0, 5),
            end_time: found.end_time.substring(0, 5),
            is_active: Boolean(found.is_active),
          }
        }
        return {
          day_of_week: d.day,
          start_time: '09:00',
          end_time: '17:00',
          is_active: false,
        }
      })
    }
  } catch (err) {
    // handled in store
  } finally {
    loading.value = false
  }
}

async function saveWeeklyAvailability() {
  saveLoading.value = true
  message.value = null
  try {
    await tutoringStore.setInstructorAvailability(shifts.value)
    message.value = { type: 'success', text: 'Weekly teaching availability updated successfully!' }
  } catch (err) {
    message.value = { type: 'error', text: err.response?.data?.message || 'Failed to update schedule.' }
  } finally {
    saveLoading.value = false
  }
}

async function addBlockedDate() {
  if (!newBlocked.value.start_date || !newBlocked.value.end_date) {
    alert('Please specify start and end dates.')
    return
  }
  try {
    await tutoringStore.addInstructorBlockedDate(newBlocked.value)
    newBlocked.value = { start_date: '', end_date: '', reason: '' }
    message.value = { type: 'success', text: 'Blocked date range saved. No students can book during this period.' }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to add blocked dates.')
  }
}

async function removeBlockedDate(id) {
  if (!confirm('Remove this blocked date range?')) return
  try {
    await tutoringStore.deleteInstructorBlockedDate(id)
    message.value = { type: 'success', text: 'Blocked date removed.' }
  } catch (err) {
    alert('Failed to remove.')
  }
}

function openAttendance(session) {
  attendanceSession.value = session
  attendanceStatus.value = 'attended'
  attendanceNotes.value = session.instructor_notes || ''
  showAttendanceModal.value = true
}

async function submitAttendance() {
  try {
    await tutoringStore.markSessionAttendance(attendanceSession.value.uuid, {
      status: attendanceStatus.value,
      notes: attendanceNotes.value,
    })
    showAttendanceModal.value = false
    message.value = { type: 'success', text: `Session marked as ${attendanceStatus.value}.` }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to mark attendance.')
  }
}

function openCancel(session) {
  cancelSession.value = session
  cancelReason.value = ''
  showCancelModal.value = true
}

async function submitCancel() {
  if (!cancelReason.value) {
    alert('Please state a reason for cancelling.')
    return
  }
  try {
    await tutoringStore.cancelSessionByInstructor(cancelSession.value.uuid, cancelReason.value)
    showCancelModal.value = false
    message.value = { type: 'success', text: 'Session cancelled. 1 credit has been returned to student.' }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to cancel session.')
  }
}

function startEditingDetails(session) {
  editingDetailsUuid.value = session.uuid
  detailsLink.value = session.meeting_link || ''
  detailsLocation.value = session.location || ''
}

async function saveDetails(uuid) {
  try {
    await tutoringStore.updateSessionDetails(uuid, {
      meeting_link: detailsLink.value,
      location: detailsLocation.value,
    })
    editingDetailsUuid.value = null
    message.value = { type: 'success', text: 'Meeting links / room details updated.' }
    await tutoringStore.fetchInstructorSessions()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save details.')
  }
}

function formatDatetime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  }) + ' (EAT)'
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
      <div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">1-on-1 Tutoring Studio & Schedule</h1>
        <p class="text-xs text-slate-400 mt-1">
          Manage your recurring weekly teaching shifts, blackout dates, student attendance, and meeting links in <strong class="text-slate-200">Africa/Nairobi (EAT)</strong> timezone.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          60m lesson + 15m buffer
        </span>
      </div>
    </div>

    <!-- Alert / Message -->
    <div
      v-if="message"
      :class="message.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'"
      class="border rounded-xl p-4 text-xs flex items-center justify-between"
    >
      <span>{{ message.text }}</span>
      <button @click="message = null" class="text-slate-400 hover:text-white">&times;</button>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-slate-800">
      <nav class="flex gap-6 -mb-px">
        <button
          @click="activeTab = 'shifts'"
          :class="activeTab === 'shifts' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="py-3 px-1 border-b-2 text-sm transition-all"
        >
          Weekly Recurring Hours
        </button>
        <button
          @click="activeTab = 'blackouts'"
          :class="activeTab === 'blackouts' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="py-3 px-1 border-b-2 text-sm transition-all"
        >
          Time Off & Blackout Dates ({{ tutoringStore.instructorBlockedDates.length }})
        </button>
        <button
          @click="activeTab = 'roster'"
          :class="activeTab === 'roster' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="py-3 px-1 border-b-2 text-sm transition-all"
        >
          Student Bookings Roster ({{ tutoringStore.instructorSessions.length }})
        </button>
      </nav>
    </div>

    <!-- Tab 1: Weekly Hours -->
    <div v-if="activeTab === 'shifts'" class="max-w-4xl space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h3 class="text-base font-bold text-white">Weekly Teaching Availability</h3>
          <p class="text-xs text-slate-400 mt-1">
            Toggle which days you teach and set your starting/ending hours. Open slots are automatically calculated using academy 60-minute blocks with a 15-minute inter-session buffer.
          </p>
        </div>

        <div class="space-y-3">
          <div
            v-for="(shift, idx) in shifts"
            :key="shift.day_of_week"
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/70 border border-slate-800 rounded-xl gap-4"
          >
            <div class="flex items-center gap-3 w-40">
              <input
                type="checkbox"
                :id="`day-${shift.day_of_week}`"
                v-model="shift.is_active"
                class="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <label :for="`day-${shift.day_of_week}`" class="font-semibold text-sm text-slate-200">
                {{ daysOfWeek[idx].name }}
              </label>
            </div>

            <div v-if="shift.is_active" class="flex items-center gap-3 text-xs text-slate-300">
              <span>From:</span>
              <input
                type="time"
                v-model="shift.start_time"
                class="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
              <span>To:</span>
              <input
                type="time"
                v-model="shift.end_time"
                class="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
              <span class="text-slate-500 text-[11px]">EAT</span>
            </div>
            <div v-else class="text-xs text-slate-500 italic">
              Off duty / No slots offered
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-800 flex justify-end">
          <button
            @click="saveWeeklyAvailability"
            :disabled="saveLoading"
            class="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg disabled:opacity-50"
          >
            {{ saveLoading ? 'Saving Shifts...' : 'Save Weekly Schedule' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 2: Blackouts & Vacations -->
    <div v-if="activeTab === 'blackouts'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Add Blackout Form -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
        <h3 class="text-base font-bold text-white">Add Time Off / Blackout</h3>
        <p class="text-xs text-slate-400">
          Block dates for vacation, performance tours, or studio maintenance. Students will not see any slots on these dates.
        </p>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Date</label>
            <input
              type="date"
              v-model="newBlocked.start_date"
              class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">End Date</label>
            <input
              type="date"
              v-model="newBlocked.end_date"
              class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Reason (Optional)</label>
            <input
              type="text"
              v-model="newBlocked.reason"
              placeholder="e.g. Concert tour, Personal leave..."
              class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
            />
          </div>
          <button
            @click="addBlockedDate"
            class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors"
          >
            Block Dates
          </button>
        </div>
      </div>

      <!-- Blackouts List -->
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 class="text-base font-bold text-white">Active Blocked Dates</h3>
        <div v-if="tutoringStore.instructorBlockedDates.length === 0" class="py-12 text-center text-xs text-slate-500">
          No blocked dates configured.
        </div>
        <div v-else class="divide-y divide-slate-800">
          <div
            v-for="b in tutoringStore.instructorBlockedDates"
            :key="b.id"
            class="py-3 flex items-center justify-between gap-4 text-xs"
          >
            <div>
              <span class="font-mono text-white font-semibold">
                {{ new Date(b.start_date).toLocaleDateString() }} — {{ new Date(b.end_date).toLocaleDateString() }}
              </span>
              <p class="text-slate-400 mt-0.5">{{ b.reason || 'Time off' }}</p>
            </div>
            <button
              @click="removeBlockedDate(b.id)"
              class="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Student Bookings Roster -->
    <div v-if="activeTab === 'roster'" class="space-y-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-950/70 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th class="py-3.5 px-4">Session Date & Time</th>
              <th class="py-3.5 px-4">Student</th>
              <th class="py-3.5 px-4">Course</th>
              <th class="py-3.5 px-4">Mode & Links</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-if="tutoringStore.instructorSessions.length === 0">
              <td colspan="6" class="py-12 text-center text-slate-500">
                No booked student sessions on record.
              </td>
            </tr>
            <tr v-for="s in tutoringStore.instructorSessions" :key="s.id" class="hover:bg-slate-800/40">
              <td class="py-3.5 px-4 font-mono font-medium text-white">
                {{ formatDatetime(s.scheduled_start) }}
              </td>
              <td class="py-3.5 px-4">
                <div class="font-semibold text-slate-200">{{ s.student ? s.student.name : 'Student' }}</div>
                <div class="text-[11px] text-slate-400">{{ s.student ? s.student.email : '' }}</div>
              </td>
              <td class="py-3.5 px-4">
                {{ s.course ? s.course.title : 'General Tutoring' }}
              </td>
              <td class="py-3.5 px-4">
                <!-- Inline Link Editor or static display -->
                <div v-if="editingDetailsUuid === s.uuid" class="space-y-1">
                  <input
                    v-if="s.mode !== 'in_person'"
                    type="url"
                    v-model="detailsLink"
                    placeholder="https://zoom.us/j/..."
                    class="bg-slate-950 border border-slate-700 rounded p-1 text-[11px] w-full"
                  />
                  <input
                    v-else
                    type="text"
                    v-model="detailsLocation"
                    placeholder="Room 3B, Nairobi Studio"
                    class="bg-slate-950 border border-slate-700 rounded p-1 text-[11px] w-full"
                  />
                  <div class="flex gap-1">
                    <button @click="saveDetails(s.uuid)" class="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded">Save</button>
                    <button @click="editingDetailsUuid = null" class="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded">Cancel</button>
                  </div>
                </div>
                <div v-else>
                  <span class="capitalize font-semibold text-slate-300">{{ s.mode ? s.mode.replace('_', ' ') : 'Online' }}</span>
                  <div v-if="s.meeting_link" class="mt-0.5">
                    <a :href="s.meeting_link" target="_blank" class="text-blue-400 hover:underline text-[11px] truncate block max-w-xs">
                      {{ s.meeting_link }}
                    </a>
                  </div>
                  <div v-if="s.location" class="text-[11px] text-slate-400 mt-0.5">
                    {{ s.location }}
                  </div>
                  <button
                    v-if="s.status === 'scheduled' || s.status === 'rescheduled'"
                    @click="startEditingDetails(s)"
                    class="text-[10px] text-slate-500 hover:text-amber-400 mt-0.5"
                  >
                    ✏️ Edit meeting/room link
                  </button>
                </div>
              </td>
              <td class="py-3.5 px-4">
                <span
                  :class="{
                    'bg-emerald-950/60 text-emerald-300 border-emerald-800': s.status === 'scheduled',
                    'bg-amber-950/60 text-amber-300 border-amber-800': s.status === 'rescheduled',
                    'bg-blue-950/60 text-blue-300 border-blue-800': s.status === 'attended',
                    'bg-rose-950/60 text-rose-300 border-rose-800': s.status === 'missed',
                    'bg-slate-800 text-slate-400 border-slate-700': s.status.includes('cancelled')
                  }"
                  class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded border"
                >
                  {{ s.status.replace(/_/g, ' ') }}
                </span>
                <p v-if="s.notice_waived" class="text-[10px] text-amber-400 mt-1 font-medium">
                  Emergency Notice Waived: {{ s.waiver_reason }}
                </p>
              </td>
              <td class="py-3.5 px-4 text-right space-x-2">
                <!-- Mark Attendance -->
                <button
                  v-if="s.status === 'scheduled' || s.status === 'rescheduled'"
                  @click="openAttendance(s)"
                  class="px-2.5 py-1 text-xs font-medium rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                >
                  Mark Attendance
                </button>
                <!-- Instructor Cancel -->
                <button
                  v-if="s.status === 'scheduled' || s.status === 'rescheduled'"
                  @click="openCancel(s)"
                  class="px-2.5 py-1 text-xs font-medium rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors"
                >
                  Cancel (Refund Credit)
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Attendance Modal -->
    <div
      v-if="showAttendanceModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h4 class="font-bold text-white text-base">Mark Lesson Attendance</h4>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
            <div class="grid grid-cols-2 gap-3">
              <label
                :class="attendanceStatus === 'attended' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-400'"
                class="flex items-center justify-center p-2.5 rounded-lg border cursor-pointer text-xs font-bold"
              >
                <input type="radio" v-model="attendanceStatus" value="attended" class="sr-only" />
                <span>Attended</span>
              </label>
              <label
                :class="attendanceStatus === 'missed' ? 'border-rose-500 bg-rose-500/10 text-rose-300' : 'border-slate-800 bg-slate-950 text-slate-400'"
                class="flex items-center justify-center p-2.5 rounded-lg border cursor-pointer text-xs font-bold"
              >
                <input type="radio" v-model="attendanceStatus" value="missed" class="sr-only" />
                <span>Student Missed</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Instructor Feedback / Notes</label>
            <textarea
              v-model="attendanceNotes"
              rows="3"
              placeholder="Techniques covered, practice recommendations, vocal warmups..."
              class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
            ></textarea>
          </div>
        </div>
        <div class="border-t border-slate-800 pt-3 flex justify-end gap-2">
          <button @click="showAttendanceModal = false" class="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300">Cancel</button>
          <button @click="submitAttendance" class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-500 text-slate-950">Save Attendance</button>
        </div>
      </div>
    </div>

    <!-- Instructor Cancel Modal -->
    <div
      v-if="showCancelModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h4 class="font-bold text-rose-400 text-base">Cancel Session & Refund Credit</h4>
        <div class="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-200">
          Cancelling will automatically restore 1 session credit back to the student's tutoring package and send an SMS/Email notification.
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Reason for Cancellation</label>
          <textarea
            v-model="cancelReason"
            rows="3"
            placeholder="e.g. Studio emergency, instructor illness..."
            class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
          ></textarea>
        </div>
        <div class="border-t border-slate-800 pt-3 flex justify-end gap-2">
          <button @click="showCancelModal = false" class="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300">Close</button>
          <button @click="submitCancel" class="px-3 py-1.5 text-xs font-bold rounded bg-rose-500 text-slate-950">Confirm Cancel & Refund Credit</button>
        </div>
      </div>
    </div>
  </div>
</template>
