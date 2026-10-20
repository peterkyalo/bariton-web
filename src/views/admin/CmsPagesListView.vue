<template>
  <div class="cms-pages-view space-y-6">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">CMS Pages Management</h1>
        <p class="text-sm text-slate-500 mt-1">Manage public website pages, landing page sections, and custom content blocks.</p>
      </div>
      <div class="flex items-center gap-3">
        <router-link to="/admin/cms/inquiries" class="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-2">
          <span>Contact Inquiries</span>
          <span v-if="newInquiriesCount > 0" class="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs">{{ newInquiriesCount }}</span>
        </router-link>
        <button @click="openCreateModal" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold shadow-sm transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          <span>Create New Page</span>
        </button>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <input v-model="searchQuery" @input="debouncedSearch" type="text" placeholder="Search by title or slug..." class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select v-model="categoryFilter" @change="loadPages" class="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:border-amber-500">
          <option value="">All Categories</option>
          <option value="landing">Landing</option>
          <option value="company">Company</option>
          <option value="legal">Legal</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div class="text-xs text-slate-500 font-semibold">
        Showing {{ cmsStore.adminPages.length }} of {{ cmsStore.adminPagination.total }} Pages
      </div>
    </div>

    <!-- Pages Table -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div v-if="cmsStore.loading" class="py-16 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
        <p class="mt-2 text-xs text-slate-500">Loading pages...</p>
      </div>

      <div v-else-if="cmsStore.adminPages.length === 0" class="py-16 text-center">
        <p class="text-sm font-bold text-slate-700">No CMS pages found.</p>
        <p class="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new page.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
            <tr>
              <th class="py-3.5 px-6">Page Title & Slug</th>
              <th class="py-3.5 px-4">Category</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4">Hero Heading</th>
              <th class="py-3.5 px-4">Last Updated</th>
              <th class="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="page in cmsStore.adminPages" :key="page.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-4 px-6">
                <div class="font-bold text-slate-900">{{ page.title }}</div>
                <div class="text-xs font-mono text-slate-500 mt-0.5">/{{ page.slug }}</div>
              </td>
              <td class="py-4 px-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {{ page.category }}
                </span>
              </td>
              <td class="py-4 px-4">
                <span v-if="page.is_published" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Published
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Draft
                </span>
              </td>
              <td class="py-4 px-4 text-xs text-slate-600 max-w-xs truncate">
                {{ page.hero_title || '—' }}
              </td>
              <td class="py-4 px-4 text-xs text-slate-500">
                {{ formatDate(page.updated_at) }}
              </td>
              <td class="py-4 px-6 text-right space-x-2">
                <a :href="page.slug === 'home' ? '/' : (['about', 'contact', 'team', 'testimonials'].includes(page.slug) ? '/' + page.slug : '/p/' + page.slug)" target="_blank" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors inline-block">
                  View
                </a>
                <router-link :to="`/admin/cms/pages/${page.id}`" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors inline-block">
                  Edit
                </router-link>
                <button v-if="page.slug !== 'home'" @click="confirmDelete(page)" class="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Page Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <h3 class="text-lg font-bold text-slate-900 mb-1">Create New CMS Page</h3>
        <p class="text-xs text-slate-500 mb-4">Set up a new landing or custom information page.</p>

        <form @submit.prevent="handleCreatePage" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Page Title</label>
            <input v-model="newPage.title" type="text" required placeholder="e.g. Scholarship Grants 2026" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">URL Slug</label>
            <input v-model="newPage.slug" type="text" placeholder="e.g. scholarships (auto-generated if empty)" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Category</label>
            <select v-model="newPage.category" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-amber-500">
              <option value="company">Company</option>
              <option value="legal">Legal</option>
              <option value="landing">Landing</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input v-model="newPage.is_published" type="checkbox" id="published-toggle" class="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
            <label for="published-toggle" class="text-sm font-semibold text-slate-700">Publish page immediately</label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" @click="showCreateModal = false" class="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" :disabled="creating" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold shadow-sm">
              {{ creating ? 'Creating...' : 'Create & Edit' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCmsStore } from '@/stores/cms'

const router = useRouter()
const cmsStore = useCmsStore()

const searchQuery = ref('')
const categoryFilter = ref('')
const showCreateModal = ref(false)
const creating = ref(false)
const newInquiriesCount = ref(0)

const newPage = reactive({
  title: '',
  slug: '',
  category: 'company',
  is_published: true,
})

let searchTimeout = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadPages()
  }, 300)
}

async function loadPages() {
  await cmsStore.fetchAdminPages({
    search: searchQuery.value,
    category: categoryFilter.value,
  })
}

function openCreateModal() {
  newPage.title = ''
  newPage.slug = ''
  newPage.category = 'company'
  newPage.is_published = true
  showCreateModal.value = true
}

async function handleCreatePage() {
  creating.value = true
  try {
    const created = await cmsStore.createPage({ ...newPage })
    showCreateModal.value = false
    router.push(`/admin/cms/pages/${created.id}`)
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to create page.')
  } finally {
    creating.value = false
  }
}

async function confirmDelete(page) {
  if (confirm(`Are you sure you want to delete '${page.title}'? This action cannot be undone.`)) {
    try {
      await cmsStore.deletePage(page.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete page.')
    }
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(async () => {
  await loadPages()
  try {
    const inq = await cmsStore.fetchInquiries({ status: 'new' })
    newInquiriesCount.value = inq.length
  } catch (_) {}
})
</script>
