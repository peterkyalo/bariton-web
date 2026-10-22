<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http, { parseError } from '@/lib/http'
import { useUiStore } from '@/stores/ui'
import Modal from '@/components/ui/Modal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const router = useRouter()
const ui = useUiStore()

const loading = ref(true)
const events = ref([])
const saving = ref(false)
const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')

// Modal state
const showModal = ref(false)
const editId = ref(null)
const formError = ref('')

const form = reactive({
  title: '',
  type: 'bootcamp',
  description: '',
  venue: '',
  start_date: '',
  end_date: '',
  capacity: 30,
  training_fee_kes_major: 25000,
  has_accommodation: false,
  accommodation_fee_kes_major: 15000,
  status: 'published',
})

const filteredEvents = computed(() => {
  return events.value.filter((evt) => {
    if (typeFilter.value !== 'all' && evt.type !== typeFilter.value) return false
    if (statusFilter.value !== 'all' && evt.status !== statusFilter.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return (
        evt.title?.toLowerCase().includes(q) ||
        evt.venue?.toLowerCase().includes(q) ||
        evt.description?.toLowerCase().includes(q)
      )
    }
    return true
  })
})

const stats = computed(() => {
  const total = events.value.length
  const published = events.value.filter((e) => e.status === 'published').length
  const draft = events.value.filter((e) => e.status === 'draft').length
  const totalBookings = events.value.reduce((acc, e) => acc + (e.confirmed_count || 0), 0)
  return { total, published, draft, totalBookings }
})

async function loadEvents() {
  loading.value = true
  try {
    const { data } = await http.get('/coordinator/events')
    events.value = data.data || []
  } catch (err) {
    ui.notify({ type: 'error', title: 'Failed to load events', message: parseError(err).message })
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editId.value = null
  formError.value = ''
  form.title = ''
  form.type = 'bootcamp'
  form.description = ''
  form.venue = 'Bariton Conservatory Main Hall, Nairobi'
  // Default dates: tomorrow and 3 days later
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const threeDays = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  form.start_date = tomorrow
  form.end_date = threeDays
  form.capacity = 30
  form.training_fee_kes_major = 25000
  form.has_accommodation = false
  form.accommodation_fee_kes_major = 15000
  form.status = 'published'
  showModal.value = true
}

function openEditModal(evt) {
  editId.value = evt.id
  formError.value = ''
  form.title = evt.title || ''
  form.type = evt.type || 'bootcamp'
  form.description = evt.description || ''
  form.venue = evt.venue || ''
  form.start_date = evt.start_date ? evt.start_date.slice(0, 10) : ''
  form.end_date = evt.end_date ? evt.end_date.slice(0, 10) : ''
  form.capacity = evt.capacity || 30
  form.training_fee_kes_major = evt.training_fee_kes ? Math.round(evt.training_fee_kes / 100) : 0
  form.has_accommodation = Boolean(evt.has_accommodation)
  form.accommodation_fee_kes_major = evt.accommodation_fee_kes ? Math.round(evt.accommodation_fee_kes / 100) : 0
  form.status = evt.status || 'published'
  showModal.value = true
}

async function saveEvent() {
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      title: form.title,
      type: form.type,
      description: form.description,
      venue: form.venue,
      start_date: form.start_date,
      end_date: form.end_date,
      capacity: Number(form.capacity),
      training_fee_kes: Math.round(Number(form.training_fee_kes_major) * 100),
      has_accommodation: form.has_accommodation,
      accommodation_fee_kes: form.has_accommodation
        ? Math.round(Number(form.accommodation_fee_kes_major) * 100)
        : 0,
      status: form.status,
    }

    if (editId.value) {
      await http.put(`/coordinator/events/${editId.value}`, payload)
      ui.notify({ type: 'success', title: 'Event Updated', message: `${form.title} updated successfully.` })
    } else {
      await http.post('/coordinator/events', payload)
      ui.notify({ type: 'success', title: 'Event Created', message: `${form.title} created successfully.` })
    }

    showModal.value = false
    await loadEvents()
  } catch (err) {
    const { message, errors } = parseError(err)
    formError.value = Object.values(errors)[0] || message
  } finally {
    saving.value = false
  }
}

async function quickToggleStatus(evt, newStatus) {
  try {
    await http.put(`/coordinator/events/${evt.id}`, { status: newStatus })
    evt.status = newStatus
    ui.notify({
      type: 'success',
      title: 'Status Updated',
      message: `${evt.title} is now ${newStatus}.`,
    })
  } catch (err) {
    ui.notify({ type: 'error', title: 'Update Failed', message: parseError(err).message })
  }
}

async function broadcastReminders(evt) {
  if (!confirm(`Dispatch automated email & SMS reminders to all confirmed attendees of "${evt.title}"?`)) return
  try {
    const { data } = await http.post(`/coordinator/events/${evt.id}/reminders`)
    ui.notify({ type: 'success', title: 'Reminders Sent', message: data.message || 'Reminders broadcasted.' })
  } catch (err) {
    ui.notify({ type: 'error', title: 'Broadcast Failed', message: parseError(err).message })
  }
}

function viewAttendees(evt) {
  router.push({ path: '/coordinator/events', query: { event_id: evt.id } })
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBA'
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(() => {
  loadEvents()
})
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/30">
            Physical Conservatory Events
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mt-1">
          Events &amp; Bootcamps Management
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Create and publish conservatory bootcamps, masterclasses, and workshops with venue, ticket pricing, and accommodation options.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link
          to="/coordinator/events"
          class="btn btn-secondary text-xs font-bold flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Attendee Check-In Roster
        </router-link>

        <button
          id="btn-create-event"
          @click="openCreateModal"
          class="btn btn-primary text-xs font-bold flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New Event
        </button>
      </div>
    </div>

    <!-- Stat Badges -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card p-5 rounded-2xl bg-navy-900/60 border border-slate-800">
        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Cohorts</span>
        <p class="text-2xl font-bold font-serif text-white mt-1">{{ stats.total }}</p>
      </div>

      <div class="card p-5 rounded-2xl bg-navy-900/60 border border-slate-800">
        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Published / Live</span>
        <p class="text-2xl font-bold font-serif text-emerald-400 mt-1">{{ stats.published }}</p>
      </div>

      <div class="card p-5 rounded-2xl bg-navy-900/60 border border-slate-800">
        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Drafts</span>
        <p class="text-2xl font-bold font-serif text-amber-400 mt-1">{{ stats.draft }}</p>
      </div>

      <div class="card p-5 rounded-2xl bg-navy-900/60 border border-slate-800">
        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Registrations</span>
        <p class="text-2xl font-bold font-serif text-gold-400 mt-1">{{ stats.totalBookings }}</p>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by title, venue, or description..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-gold-500"
        />
        <svg class="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div class="flex items-center gap-3">
        <select
          v-model="typeFilter"
          class="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white"
        >
          <option value="all">All Event Types</option>
          <option value="bootcamp">Bootcamps</option>
          <option value="workshop">Workshops</option>
          <option value="masterclass">Masterclasses</option>
        </select>

        <select
          v-model="statusFilter"
          class="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Content List -->
    <div v-if="loading" class="py-16 flex justify-center">
      <LoadingSpinner text="Loading events..." />
    </div>

    <div v-else-if="!filteredEvents.length" class="py-12">
      <EmptyState
        title="No Events Found"
        description="Schedule your first physical workshop or bootcamp cohort to start admitting students."
      >
        <button @click="openCreateModal" class="btn btn-primary text-xs font-bold mt-4">
          + Create New Event
        </button>
      </EmptyState>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="evt in filteredEvents"
        :key="evt.id"
        class="card p-6 rounded-2xl bg-navy-900/80 border border-slate-800 flex flex-col justify-between hover:border-gold-500/40 transition-all shadow-xl group"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="badge badge-gold text-[10px] font-bold uppercase tracking-wider">
                  {{ evt.type }}
                </span>
                <span
                  :class="[
                    'badge text-[10px] font-bold uppercase tracking-wider',
                    evt.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                    evt.status === 'draft' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-800 text-slate-400'
                  ]"
                >
                  {{ evt.status }}
                </span>
              </div>
              <h2 class="text-lg font-serif font-bold text-white mt-2 group-hover:text-gold-300 transition-colors">
                {{ evt.title }}
              </h2>
            </div>

            <div class="text-right">
              <span class="text-base font-serif font-bold text-gold-400 block">
                KES {{ Number(evt.training_fee_kes / 100).toLocaleString() }}
              </span>
              <span v-if="evt.has_accommodation" class="text-[10px] text-indigo-400 block">
                + Lodging: KES {{ Number(evt.accommodation_fee_kes / 100).toLocaleString() }}
              </span>
            </div>
          </div>

          <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {{ evt.description }}
          </p>

          <div class="p-3 rounded-xl bg-navy-950/70 border border-slate-800/80 space-y-2 text-xs">
            <div class="flex items-center justify-between text-slate-300">
              <span class="text-slate-500">Dates</span>
              <span class="font-medium text-white">{{ formatDate(evt.start_date) }} – {{ formatDate(evt.end_date) }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-300">
              <span class="text-slate-500">Venue</span>
              <span class="font-medium text-white truncate max-w-[160px]">{{ evt.venue }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-300">
              <span class="text-slate-500">Enrollment</span>
              <span class="font-bold text-emerald-400">
                {{ evt.confirmed_count || 0 }} / {{ evt.capacity }} Seats
                <span v-if="evt.waiting_count" class="text-amber-400 ml-1">({{ evt.waiting_count }} waitlisted)</span>
              </span>
            </div>
          </div>
        </div>

        <div class="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <button
              @click="viewAttendees(evt)"
              class="flex-1 py-1.5 px-3 rounded-lg bg-navy-950 border border-slate-700 hover:border-gold-500/50 text-slate-300 hover:text-white text-xs font-bold text-center transition"
            >
              Attendees ({{ evt.confirmed_count || 0 }})
            </button>

            <button
              @click="broadcastReminders(evt)"
              class="py-1.5 px-3 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold transition"
              title="Broadcast reminders"
            >
              🔔 Remind
            </button>
          </div>

          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <button
                v-if="evt.status === 'draft'"
                @click="quickToggleStatus(evt, 'published')"
                class="text-[11px] text-emerald-400 hover:underline"
              >
                Publish
              </button>
              <button
                v-else-if="evt.status === 'published'"
                @click="quickToggleStatus(evt, 'completed')"
                class="text-[11px] text-slate-400 hover:underline"
              >
                Mark Completed
              </button>
            </div>

            <button
              @click="openEditModal(evt)"
              class="px-3 py-1 rounded-lg bg-navy-950 border border-slate-700 text-gold-400 hover:text-gold-300 text-xs font-bold"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Event Modal -->
    <Modal
      :open="showModal"
      :show="showModal"
      :title="editId ? 'Edit Event Details' : 'Create Physical Conservatory Event'"
      @close="showModal = false"
      max-width="max-w-2xl"
    >
      <form @submit.prevent="saveEvent" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Event Title *</label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="e.g. Nairobi Strings & Chamber Orchestra Bootcamp"
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Format *</label>
            <select
              v-model="form.type"
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            >
              <option value="bootcamp">Bootcamp</option>
              <option value="workshop">Workshop</option>
              <option value="masterclass">Masterclass</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Description *</label>
          <textarea
            v-model="form.description"
            rows="3"
            required
            placeholder="Comprehensive description of the curriculum, faculty conductors, schedule, and repertoire..."
            class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Venue / Physical Location *</label>
          <input
            v-model="form.venue"
            type="text"
            required
            placeholder="e.g. Kenya National Theatre Recital Hall, Harry Thuku Rd, Nairobi"
            class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Date *</label>
            <input
              v-model="form.start_date"
              type="date"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">End Date *</label>
            <input
              v-model="form.end_date"
              type="date"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Capacity (Seats) *</label>
            <input
              v-model.number="form.capacity"
              type="number"
              min="1"
              max="1000"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Training Fee (KES) *</label>
            <input
              v-model.number="form.training_fee_kes_major"
              type="number"
              min="0"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Publication Status *</label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            >
              <option value="published">Published (Accepting Bookings)</option>
              <option value="draft">Draft (Private)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-navy-950/80 border border-slate-800 space-y-3">
          <div class="flex items-center gap-2">
            <input
              id="evt-accommodation"
              v-model="form.has_accommodation"
              type="checkbox"
              class="rounded bg-navy-900 border-slate-700 text-gold-500 focus:ring-gold-500 h-4 w-4"
            />
            <label for="evt-accommodation" class="text-xs font-semibold text-slate-300">
              Provide optional conservatory boarding / accommodation
            </label>
          </div>

          <div v-if="form.has_accommodation">
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Accommodation Add-on Fee (KES) *
            </label>
            <input
              v-model.number="form.accommodation_fee_kes_major"
              type="number"
              min="0"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-900 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>

        <p v-if="formError" class="text-xs text-red-400">{{ formError }}</p>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            class="btn btn-secondary text-xs"
            @click="showModal = false"
          >
            Cancel
          </button>
          <button
            id="btn-save-event"
            type="submit"
            class="btn btn-primary text-xs font-bold"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Event' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>
