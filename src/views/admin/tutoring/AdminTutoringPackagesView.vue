<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import http, { parseError } from '@/lib/http'
import { useUiStore } from '@/stores/ui'
import Modal from '@/components/ui/Modal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const ui = useUiStore()

const loading = ref(true)
const packages = ref([])
const courses = ref([])
const instructors = ref([])
const saving = ref(false)
const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const editId = ref(null)
const formError = ref('')

const form = reactive({
  title: '',
  description: '',
  course_id: null,
  instructor_id: null,
  session_count: 4,
  price_kes_major: 12000,
  price_usd_major: 95,
  validity_days: 60,
  is_active: true,
})

const filteredPackages = computed(() => {
  if (!searchQuery.value) return packages.value
  const q = searchQuery.value.toLowerCase()
  return packages.value.filter(
    (p) =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.instructor?.name?.toLowerCase().includes(q) ||
      p.course?.title?.toLowerCase().includes(q)
  )
})

const stats = computed(() => {
  const total = packages.value.length
  const active = packages.value.filter((p) => p.is_active).length
  return { total, active, inactive: total - active }
})

async function loadData() {
  loading.value = true
  try {
    const [pkgRes, coursesRes, usersRes] = await Promise.all([
      http.get('/tutoring/packages?all=true'),
      http.get('/admin/courses').catch(() => ({ data: { data: [] } })),
      http.get('/admin/users?per_page=100').catch(() => ({ data: { data: [] } })),
    ])

    packages.value = pkgRes.data.data || []
    courses.value = coursesRes.data.data || []
    instructors.value = (usersRes.data.data || []).filter(
      (u) => u.roles?.some((r) => r.name === 'instructor') || u.role === 'instructor'
    )
  } catch (err) {
    ui.notify({ type: 'error', title: 'Failed to load packages', message: parseError(err).message })
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editId.value = null
  formError.value = ''
  form.title = ''
  form.description = ''
  form.course_id = null
  form.instructor_id = null
  form.session_count = 4
  form.price_kes_major = 12000
  form.price_usd_major = 95
  form.validity_days = 60
  form.is_active = true
  showModal.value = true
}

function openEditModal(pkg) {
  editId.value = pkg.id
  formError.value = ''
  form.title = pkg.title || ''
  form.description = pkg.description || ''
  form.course_id = pkg.course?.id || pkg.course_id || null
  form.instructor_id = pkg.instructor?.id || pkg.instructor_id || null
  form.session_count = pkg.session_count || 4
  form.price_kes_major = pkg.price_kes ? Math.round(pkg.price_kes / 100) : 0
  form.price_usd_major = pkg.price_usd_cents ? Math.round(pkg.price_usd_cents / 100) : 0
  form.validity_days = pkg.validity_days || 60
  form.is_active = Boolean(pkg.is_active)
  showModal.value = true
}

async function savePackage() {
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      title: form.title,
      description: form.description || null,
      course_id: form.course_id || null,
      instructor_id: form.instructor_id || null,
      session_count: Number(form.session_count),
      price_kes: Math.round(Number(form.price_kes_major) * 100),
      price_usd_cents: form.price_usd_major ? Math.round(Number(form.price_usd_major) * 100) : null,
      validity_days: Number(form.validity_days),
      is_active: form.is_active,
    }

    if (editId.value) {
      await http.put(`/admin/tutoring/packages/${editId.value}`, payload)
      ui.notify({ type: 'success', title: 'Package Updated', message: `${form.title} has been updated.` })
    } else {
      await http.post('/admin/tutoring/packages', payload)
      ui.notify({ type: 'success', title: 'Package Created', message: `${form.title} is now available.` })
    }

    showModal.value = false
    await loadData()
  } catch (err) {
    const { message, errors } = parseError(err)
    formError.value = Object.values(errors)[0] || message
  } finally {
    saving.value = false
  }
}

async function toggleActive(pkg) {
  try {
    const newStatus = !pkg.is_active
    await http.put(`/admin/tutoring/packages/${pkg.id}`, { is_active: newStatus })
    pkg.is_active = newStatus
    ui.notify({
      type: 'success',
      title: newStatus ? 'Package Activated' : 'Package Deactivated',
      message: `${pkg.title} is now ${newStatus ? 'active' : 'inactive'}.`,
    })
  } catch (err) {
    ui.notify({ type: 'error', title: 'Status Update Failed', message: parseError(err).message })
  }
}

async function deletePackage(pkg) {
  if (!confirm(`Are you sure you want to delete "${pkg.title}"?`)) return

  try {
    await http.delete(`/admin/tutoring/packages/${pkg.id}`)
    ui.notify({ type: 'success', title: 'Package Deleted', message: `${pkg.title} has been removed.` })
    packages.value = packages.value.filter((p) => p.id !== pkg.id)
  } catch (err) {
    ui.notify({ type: 'error', title: 'Delete Failed', message: parseError(err).message })
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/30">
            Academy Private Tutoring
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mt-1">
          Tutoring Packages &amp; Mentorship
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Configure 1-on-1 instrument instruction bundles, credit counts, student validity windows, and instructor assignments.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          id="btn-create-package"
          @click="openCreateModal"
          class="btn btn-primary text-xs font-bold flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Tutoring Package
        </button>
      </div>
    </div>

    <!-- Stat Badges -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card p-5 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Packages</span>
          <p class="text-2xl font-bold font-serif text-white mt-1">{{ stats.total }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 flex items-center justify-center font-bold">
          📦
        </div>
      </div>

      <div class="card p-5 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Active in Catalog</span>
          <p class="text-2xl font-bold font-serif text-emerald-400 mt-1">{{ stats.active }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
          ✓
        </div>
      </div>

      <div class="card p-5 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Archived / Draft</span>
          <p class="text-2xl font-bold font-serif text-slate-400 mt-1">{{ stats.inactive }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-bold">
          ✕
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="flex items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search package by title, mentor, or course..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-gold-500"
        />
        <svg class="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Content Table -->
    <div v-if="loading" class="py-16 flex justify-center">
      <LoadingSpinner text="Loading tutoring catalog..." />
    </div>

    <div v-else-if="!filteredPackages.length" class="py-12">
      <EmptyState
        title="No Tutoring Packages Found"
        description="Create your first 1-on-1 private instruction package to start offering personalized lessons."
      >
        <button @click="openCreateModal" class="btn btn-primary text-xs font-bold mt-4">
          + Create Tutoring Package
        </button>
      </EmptyState>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="pkg in filteredPackages"
        :key="pkg.id"
        class="card p-6 rounded-2xl bg-navy-900/80 border border-slate-800 flex flex-col justify-between hover:border-gold-500/40 transition-all shadow-xl group"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span
                :class="[
                  'badge text-[10px] font-bold uppercase tracking-wider',
                  pkg.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                ]"
              >
                {{ pkg.is_active ? 'Active' : 'Inactive' }}
              </span>
              <h2 class="text-lg font-serif font-bold text-white mt-2 group-hover:text-gold-300 transition-colors">
                {{ pkg.title }}
              </h2>
            </div>
            <div class="text-right">
              <span class="text-base font-serif font-bold text-gold-400 block">
                KES {{ Number(pkg.price_kes / 100).toLocaleString() }}
              </span>
              <span v-if="pkg.price_usd_cents" class="text-xs text-slate-500">
                ${{ Number(pkg.price_usd_cents / 100).toFixed(2) }} USD
              </span>
            </div>
          </div>

          <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {{ pkg.description || 'No detailed description provided.' }}
          </p>

          <div class="p-3 rounded-xl bg-navy-950/70 border border-slate-800/80 space-y-2 text-xs">
            <div class="flex items-center justify-between text-slate-300">
              <span class="text-slate-500">Sessions</span>
              <span class="font-bold text-white">{{ pkg.session_count }} Private Lessons</span>
            </div>
            <div class="flex items-center justify-between text-slate-300">
              <span class="text-slate-500">Validity</span>
              <span class="font-medium text-white">{{ pkg.validity_days }} Days to Schedule</span>
            </div>
            <div v-if="pkg.course" class="flex items-center justify-between text-slate-300">
              <span class="text-slate-500">Course Link</span>
              <span class="font-medium text-gold-400 truncate max-w-[150px]">{{ pkg.course.title }}</span>
            </div>
            <div v-if="pkg.instructor" class="flex items-center justify-between text-slate-300">
              <span class="text-slate-500">Assigned Mentor</span>
              <span class="font-medium text-white">{{ pkg.instructor.name }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800/80">
          <button
            @click="toggleActive(pkg)"
            :class="[
              'text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition',
              pkg.is_active
                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            ]"
          >
            {{ pkg.is_active ? 'Deactivate' : 'Activate' }}
          </button>

          <div class="flex items-center gap-2">
            <button
              @click="openEditModal(pkg)"
              class="px-3 py-1.5 rounded-lg bg-navy-950 border border-slate-700 text-gold-400 hover:text-gold-300 text-xs font-bold"
            >
              Edit
            </button>
            <button
              @click="deletePackage(pkg)"
              class="px-3 py-1.5 rounded-lg bg-navy-950 border border-slate-700 text-red-400 hover:text-red-300 text-xs font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Modal
      :open="showModal"
      :show="showModal"
      :title="editId ? 'Edit Tutoring Package' : 'Create Tutoring Package'"
      @close="showModal = false"
      max-width="max-w-xl"
    >
      <form @submit.prevent="savePackage" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Package Title *</label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="e.g. Masterclass Mentorship (4 Sessions)"
            class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Key highlights of what students will accomplish in these sessions..."
            class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Associated Course (Optional)</label>
            <select
              v-model="form.course_id"
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            >
              <option :value="null">Any Course / General Mentorship</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.title }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Specific Instructor (Optional)</label>
            <select
              v-model="form.instructor_id"
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            >
              <option :value="null">Any Available Faculty Member</option>
              <option v-for="ins in instructors" :key="ins.id" :value="ins.id">{{ ins.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Session Count *</label>
            <input
              v-model.number="form.session_count"
              type="number"
              min="1"
              max="50"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Validity (Days) *</label>
            <input
              v-model.number="form.validity_days"
              type="number"
              min="7"
              max="365"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Price (KES) *</label>
            <input
              v-model.number="form.price_kes_major"
              type="number"
              min="0"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Price (USD)</label>
            <input
              v-model.number="form.price_usd_major"
              type="number"
              min="0"
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <input
            id="pkg-is-active"
            v-model="form.is_active"
            type="checkbox"
            class="rounded bg-navy-950 border-slate-700 text-gold-500 focus:ring-gold-500 h-4 w-4"
          />
          <label for="pkg-is-active" class="text-xs font-semibold text-slate-300">
            Publish immediately in public tutoring catalog
          </label>
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
            id="btn-save-package"
            type="submit"
            class="btn btn-primary text-xs font-bold"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Package' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>
