<template>
  <div class="cms-page bg-white text-slate-800">
    <!-- Loading State -->
    <div v-if="loading" class="py-32 text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      <p class="mt-4 text-sm text-slate-500">Loading page...</p>
    </div>

    <!-- Error / 404 State -->
    <div v-else-if="error || !page" class="py-24 text-center max-w-lg mx-auto px-4">
      <div class="w-16 h-16 rounded-full bg-amber-50 text-amber-600 text-2xl flex items-center justify-center mx-auto mb-4 font-bold">404</div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p class="text-sm text-slate-600 mb-6">{{ error || 'The requested page could not be found or is not published yet.' }}</p>
      <router-link to="/" class="inline-flex items-center px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm">
        Return to Home
      </router-link>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Page Header -->
      <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 py-20 text-center relative overflow-hidden">
        <div class="max-w-4xl mx-auto px-4 relative z-10">
          <span v-if="page.hero_badge" class="inline-block text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 border border-amber-500/30 px-3.5 py-1 rounded-full mb-4">
            {{ page.hero_badge }}
          </span>
          <h1 class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            {{ page.hero_title || page.title }}
          </h1>
          <p v-if="page.hero_subtitle" class="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto mb-6">
            {{ page.hero_subtitle }}
          </p>
          <nav class="flex justify-center items-center text-sm font-medium text-slate-400 gap-2">
            <router-link to="/" class="hover:text-amber-400">Home</router-link>
            <span>/</span>
            <span class="text-amber-400">{{ page.title }}</span>
          </nav>
        </div>
      </div>

      <!-- Article Body -->
      <section class="py-16 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="prose prose-slate lg:prose-lg max-w-none prose-headings:font-extrabold prose-headings:text-slate-900 prose-a:text-amber-600 hover:prose-a:text-amber-700">
            <div v-html="formattedContent"></div>
          </div>
        </div>
      </section>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCmsStore } from '@/stores/cms'

const route = useRoute()
const auth = useAuthStore()
const cmsStore = useCmsStore()

const page = ref(null)
const loading = ref(true)
const error = ref(null)

const slug = computed(() => {
  return route.params.slug || route.meta.slug || 'home'
})

const formattedContent = computed(() => {
  if (!page.value || !page.value.content) return ''
  // Convert markdown-style headers & lines into basic formatted HTML if no renderer
  let html = page.value.content
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-100">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold text-slate-900 mt-10 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-600 my-1">$1</li>')
    .replace(/\n\n/gim, '</p><p class="text-slate-600 leading-relaxed my-4">')

  return `<p class="text-slate-600 leading-relaxed my-4">${html}</p>`
})

async function loadPage() {
  loading.value = true
  error.value = null
  try {
    page.value = await cmsStore.fetchPage(slug.value)
  } catch (err) {
    error.value = err.response?.data?.message || 'Page not found'
    page.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.slug,
  () => {
    loadPage()
  }
)

onMounted(() => {
  loadPage()
})
</script>
