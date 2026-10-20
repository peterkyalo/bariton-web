<template>
  <div class="cms-editor-view space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <router-link to="/admin/cms/pages" class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        </router-link>
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">
            {{ form.title || 'Edit Page' }}
          </h1>
          <p class="text-xs font-mono text-slate-500 mt-0.5">Slug: /{{ form.slug }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <a :href="publicUrl" target="_blank" class="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-1.5">
          <span>Preview Live</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
        <button @click="handleSave" :disabled="saving" class="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold shadow-sm transition-all flex items-center gap-2">
          <span v-if="saving">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
      </div>
    </div>

    <!-- Feedback Alerts -->
    <div v-if="successToast" class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
      <span>{{ successToast }}</span>
      <button @click="successToast = ''" class="text-emerald-600 font-bold">×</button>
    </div>

    <div v-if="errorToast" class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
      <span>{{ errorToast }}</span>
      <button @click="errorToast = ''" class="text-rose-600 font-bold">×</button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 gap-6 text-sm font-bold">
      <button @click="activeTab = 'settings'" class="pb-3 border-b-2 transition-colors" :class="activeTab === 'settings' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'">
        General & SEO
      </button>
      <button @click="activeTab = 'hero'" class="pb-3 border-b-2 transition-colors" :class="activeTab === 'hero' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'">
        Hero Banner
      </button>
      <button @click="activeTab = 'content'" class="pb-3 border-b-2 transition-colors" :class="activeTab === 'content' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'">
        {{ form.slug === 'home' ? 'Homepage Sections' : 'Page Content' }}
      </button>
    </div>

    <!-- Tab 1: General & SEO -->
    <div v-show="activeTab === 'settings'" class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Page Title</label>
          <input v-model="form.title" type="text" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">URL Slug</label>
          <input v-model="form.slug" :disabled="form.slug === 'home'" type="text" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 disabled:bg-slate-100" />
          <p v-if="form.slug === 'home'" class="text-xs text-slate-400 mt-1">The home page slug cannot be changed.</p>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Category</label>
          <select v-model="form.category" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-amber-500">
            <option value="landing">Landing</option>
            <option value="company">Company</option>
            <option value="legal">Legal</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Display Order</label>
          <input v-model.number="form.order" type="number" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100 flex items-center gap-3">
        <input v-model="form.is_published" type="checkbox" id="published-checkbox" class="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300" />
        <label for="published-checkbox" class="text-sm font-bold text-slate-800">Page is Published & Live</label>
      </div>

      <!-- SEO Meta Section -->
      <div class="pt-6 border-t border-slate-100 space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700">Search Engine Optimization (SEO)</h3>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Meta Title</label>
          <input v-model="form.meta_title" type="text" placeholder="Title tag for search engines..." class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Meta Description</label>
          <textarea v-model="form.meta_description" rows="2" placeholder="Brief summary of the page for search results..." class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"></textarea>
        </div>
      </div>
    </div>

    <!-- Tab 2: Hero Banner -->
    <div v-show="activeTab === 'hero'" class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Hero Pill Badge</label>
          <input v-model="form.hero_badge" type="text" placeholder="e.g. Conservatory Excellence" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Hero Main Heading</label>
          <input v-model="form.hero_title" type="text" placeholder="e.g. The Best Online Learning Platform" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Hero Subheading</label>
        <textarea v-model="form.hero_subtitle" rows="3" placeholder="Compelling descriptive subtitle..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Primary CTA Button Text</label>
          <input v-model="form.hero_cta_text" type="text" placeholder="e.g. Explore Courses" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Primary CTA Button Link</label>
          <input v-model="form.hero_cta_link" type="text" placeholder="e.g. /courses" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Hero Background Image URL</label>
        <input v-model="form.hero_image_url" type="url" placeholder="https://..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500" />
      </div>
    </div>

    <!-- Tab 3: Content / Sections -->
    <div v-show="activeTab === 'content'" class="space-y-6">
      <!-- Special Sections for Homepage -->
      <div v-if="form.slug === 'home'" class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900">Homepage Interactive Sections Editor</h3>
            <p class="text-xs text-slate-500">Edit slides, services, about story, categories, and testimonials.</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Sections Config (Structured JSON)</label>
          <textarea v-model="sectionsJson" rows="18" class="w-full font-mono text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500"></textarea>
          <p class="text-xs text-slate-500 mt-2">You can modify the slide titles, badges, images, value propositions, and student testimonials directly in this structured configuration.</p>
        </div>
      </div>

      <!-- General Page Content Editor -->
      <div v-else class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <label class="text-xs font-bold uppercase tracking-wider text-slate-700">Page Body Content (Markdown & HTML Supported)</label>
        </div>
        <textarea v-model="form.content" rows="16" placeholder="Write your page content using markdown (## Headings, - Bullets, **bold**, etc.)..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCmsStore } from '@/stores/cms'

const route = useRoute()
const cmsStore = useCmsStore()

const activeTab = ref('settings')
const saving = ref(false)
const successToast = ref('')
const errorToast = ref('')

const form = reactive({
  id: null,
  title: '',
  slug: '',
  category: 'company',
  order: 0,
  is_published: true,
  meta_title: '',
  meta_description: '',
  hero_badge: '',
  hero_title: '',
  hero_subtitle: '',
  hero_cta_text: '',
  hero_cta_link: '',
  hero_image_url: '',
  content: '',
  sections: {},
})

const sectionsJson = ref('{}')

const publicUrl = computed(() => {
  if (form.slug === 'home') return '/'
  if (['about', 'contact', 'team', 'testimonials'].includes(form.slug)) return '/' + form.slug
  return '/p/' + form.slug
})

async function loadPage() {
  try {
    const pageData = await cmsStore.fetchAdminPage(route.params.id)
    Object.assign(form, pageData)
    sectionsJson.value = JSON.stringify(pageData.sections || {}, null, 2)
  } catch (err) {
    errorToast.value = 'Failed to load page details.'
  }
}

async function handleSave() {
  saving.value = true
  successToast.value = ''
  errorToast.value = ''

  try {
    let parsedSections = form.sections
    if (form.slug === 'home') {
      try {
        parsedSections = JSON.parse(sectionsJson.value)
      } catch (e) {
        errorToast.value = 'Invalid JSON in Homepage Sections config. Please correct syntax before saving.'
        saving.value = false
        return
      }
    }

    const payload = {
      ...form,
      sections: parsedSections,
    }

    await cmsStore.updatePage(form.id, payload)
    successToast.value = 'Page changes saved successfully!'
  } catch (err) {
    errorToast.value = err.response?.data?.message || 'Failed to save changes.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPage()
})
</script>
