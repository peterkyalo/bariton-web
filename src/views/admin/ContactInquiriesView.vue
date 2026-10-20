<template>
  <div class="contact-inquiries-view space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Prospective Student Inquiries</h1>
        <p class="text-sm text-slate-500 mt-1">Review and respond to messages submitted via the website contact form.</p>
      </div>
      <router-link to="/admin/cms/pages" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
        Back to CMS Pages
      </router-link>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <input v-model="searchQuery" @input="debouncedSearch" type="text" placeholder="Search sender or subject..." class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select v-model="statusFilter" @change="loadInquiries" class="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:border-amber-500">
          <option value="">All Statuses</option>
          <option value="new">New (Unread)</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div class="text-xs text-slate-500 font-semibold">
        Total: {{ cmsStore.inquiriesPagination.total }} Inquiries
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div v-if="cmsStore.loading" class="py-16 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
        <p class="mt-2 text-xs text-slate-500">Loading inquiries...</p>
      </div>

      <div v-else-if="cmsStore.inquiries.length === 0" class="py-16 text-center">
        <p class="text-sm font-bold text-slate-700">No contact inquiries found.</p>
        <p class="text-xs text-slate-400 mt-1">Inquiries submitted on the website will appear here.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
            <tr>
              <th class="py-3.5 px-6">Sender Details</th>
              <th class="py-3.5 px-4">Subject</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4">Received</th>
              <th class="py-3.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="inq in cmsStore.inquiries" :key="inq.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-4 px-6">
                <div class="font-bold text-slate-900">{{ inq.name }}</div>
                <div class="text-xs text-slate-500">{{ inq.email }}</div>
                <div v-if="inq.phone" class="text-xs text-amber-600 font-mono">{{ inq.phone }}</div>
              </td>
              <td class="py-4 px-4 max-w-xs">
                <div class="font-semibold text-slate-800 truncate">{{ inq.subject }}</div>
                <div class="text-xs text-slate-500 truncate mt-0.5">{{ inq.message }}</div>
              </td>
              <td class="py-4 px-4">
                <span :class="statusBadgeClass(inq.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  {{ inq.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="py-4 px-4 text-xs text-slate-500">
                {{ formatDate(inq.created_at) }}
              </td>
              <td class="py-4 px-6 text-right">
                <button @click="openInquiry(inq)" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors">
                  View & Respond
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inquiry Detail Modal -->
    <div v-if="selectedInquiry" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-900">{{ selectedInquiry.subject }}</h3>
            <p class="text-xs text-slate-500">From: {{ selectedInquiry.name }} ({{ selectedInquiry.email }})</p>
          </div>
          <button @click="selectedInquiry = null" class="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
        </div>

        <!-- Message Body -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {{ selectedInquiry.message }}
        </div>

        <div class="flex items-center gap-3 text-xs">
          <a :href="'mailto:' + selectedInquiry.email" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5">
            <span>Email Sender</span>
          </a>
          <a v-if="selectedInquiry.phone" :href="'tel:' + selectedInquiry.phone" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5">
            <span>Call / WhatsApp</span>
          </a>
        </div>

        <!-- Status & Notes Form -->
        <div class="space-y-3 pt-3 border-t border-slate-100">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Update Status</label>
            <select v-model="editStatus" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-amber-500">
              <option value="new">New (Unread)</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Internal Admin Notes</label>
            <textarea v-model="adminNotes" rows="3" placeholder="Add follow-up notes for the admissions team..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" @click="selectedInquiry = null" class="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
          <button type="button" @click="handleUpdateInquiry" :disabled="updating" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold shadow-sm">
            {{ updating ? 'Updating...' : 'Save & Update' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCmsStore } from '@/stores/cms'

const cmsStore = useCmsStore()

const searchQuery = ref('')
const statusFilter = ref('')
const selectedInquiry = ref(null)
const editStatus = ref('new')
const adminNotes = ref('')
const updating = ref(false)

let searchTimeout = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadInquiries()
  }, 300)
}

async function loadInquiries() {
  await cmsStore.fetchInquiries({
    search: searchQuery.value,
    status: statusFilter.value,
  })
}

function openInquiry(inq) {
  selectedInquiry.value = inq
  editStatus.value = inq.status
  adminNotes.value = inq.admin_notes || ''
}

async function handleUpdateInquiry() {
  if (!selectedInquiry.value) return
  updating.value = true
  try {
    await cmsStore.updateInquiry(selectedInquiry.value.id, {
      status: editStatus.value,
      admin_notes: adminNotes.value,
    })
    selectedInquiry.value = null
    await loadInquiries()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update inquiry.')
  } finally {
    updating.value = false
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case 'new':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'resolved':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'archived':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadInquiries()
})
</script>
