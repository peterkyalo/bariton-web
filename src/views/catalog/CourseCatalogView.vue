<template>
  <div class="courses-catalog-page bg-slate-50 min-h-screen text-slate-800 pb-20">
    <!-- Header Banner (matches courses.html template) -->
    <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 py-16 sm:py-20 text-center relative overflow-hidden">
      <div class="max-w-4xl mx-auto px-4 relative z-10">
        <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 border border-amber-500/30 px-3.5 py-1 rounded-full mb-3">
          Conservatory Curriculum
        </span>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Explore Our Courses
        </h1>
        <p class="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-4">
          Master classical conservatory rigor, East African gospel harmony, strings, voice, and modern jazz with distinguished concert soloists.
        </p>
        <nav class="flex justify-center items-center text-xs font-medium text-slate-400 gap-2 uppercase tracking-widest">
          <RouterLink to="/" class="hover:text-amber-400 transition-colors">Home</RouterLink>
          <span>/</span>
          <span class="text-slate-400">Pages</span>
          <span>/</span>
          <span class="text-amber-400 font-semibold">Courses</span>
        </nav>
      </div>

      <!-- Luxury Glows -->
      <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 -top-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
      <!-- Search & Filter Bar Card -->
      <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-12">
        <div class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <!-- Search Input -->
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search courses, instruments, repertoire, instructors..."
              class="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
              @keyup.enter="applyFilters"
            />
            <svg class="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              v-if="searchQuery"
              @click="searchQuery = ''; applyFilters()"
              class="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Level Pills -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              v-for="lvl in levels"
              :key="lvl.id"
              @click="setLevel(lvl.id)"
              :class="[
                'px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                selectedLevel === lvl.id
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/25'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-500 hover:text-amber-600'
              ]"
            >
              {{ lvl.label }}
            </button>
          </div>

          <!-- Live Result Count -->
          <div class="text-xs font-semibold text-slate-500 px-2 flex items-center justify-between lg:justify-end gap-2">
            <span>{{ coursesStore.catalog.length }} Courses Found</span>
            <button
              v-if="selectedLevel !== 'all' || searchQuery"
              @click="resetFilters"
              class="text-amber-600 hover:underline font-bold text-xs"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="coursesStore.loading" class="flex flex-col items-center justify-center py-24">
        <div class="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm font-semibold text-slate-500">Loading conservatory courses...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="coursesStore.catalog.length === 0" class="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm max-w-xl mx-auto px-6">
        <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 text-3xl flex items-center justify-center mx-auto mb-4 font-bold">
          🎵
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">No Courses Found</h3>
        <p class="text-sm text-slate-500 mb-6">
          We couldn't find any courses matching your search or level filters. Try clearing your filters.
        </p>
        <button
          @click="resetFilters"
          class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all"
        >
          Reset All Filters
        </button>
      </div>

      <!-- Course Cards Grid (matches courses.html) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="course in coursesStore.catalog"
          :key="course.id"
          class="course-card bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group"
        >
          <div>
            <!-- Thumbnail Visual Header -->
            <div class="relative aspect-[16/10] overflow-hidden bg-slate-900">
              <img
                :src="course.thumbnail_path || getCourseFallbackImage(course.slug)"
                :alt="course.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

              <!-- Top Left: Level Badge -->
              <div class="absolute top-3.5 left-3.5">
                <span :class="['px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm', getLevelBadgeClass(course)]">
                  {{ getCourseLevelLabel(course) }}
                </span>
              </div>

              <!-- Top Right: Savings / Discount Badge -->
              <div
                v-if="course.pricing && course.pricing.bundle_savings_kes > 0"
                class="absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md uppercase tracking-wider"
              >
                Save KES {{ course.pricing.bundle_savings_formatted }}
              </div>

              <!-- Hover Slide-Up Actions (matches courses.html template) -->
              <div class="absolute inset-x-0 bottom-3.5 flex justify-center gap-2 px-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <RouterLink
                  :to="`/courses/${course.slug}`"
                  class="px-4 py-2 rounded-full bg-white/95 hover:bg-white text-slate-900 text-xs font-bold shadow-md hover:text-amber-600 transition-colors"
                >
                  View Syllabus
                </RouterLink>
                <RouterLink
                  :to="`/courses/${course.slug}`"
                  class="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md transition-colors"
                >
                  Join Now
                </RouterLink>
              </div>
            </div>

            <!-- Card Body -->
            <div class="p-6">
              <!-- Pricing & Stars Row -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-extrabold text-slate-900 tracking-tight">
                    KES {{ course.pricing?.bundle_price_formatted || '—' }}
                  </span>
                  <span v-if="course.pricing?.bundle_price_usd_formatted" class="text-xs font-medium text-slate-400">
                    (${{ course.pricing.bundle_price_usd_formatted }})
                  </span>
                </div>
                <!-- 5 Stars Rating -->
                <div class="flex items-center gap-1 text-amber-500 text-xs">
                  <span>★★★★★</span>
                  <span class="text-slate-400 text-[11px] font-semibold">(128)</span>
                </div>
              </div>

              <!-- Title -->
              <h3 class="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors mb-2 line-clamp-1">
                <RouterLink :to="`/courses/${course.slug}`">
                  {{ course.title }}
                </RouterLink>
              </h3>

              <!-- Short Description -->
              <p class="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                {{ course.short_description || course.description }}
              </p>
            </div>
          </div>

          <!-- Card Bottom Meta Bar (matches courses.html template) -->
          <div class="border-t border-slate-100 bg-slate-50/70 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
            <!-- Instructor -->
            <div class="flex items-center gap-2 truncate pr-2">
              <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="font-medium truncate text-slate-700">
                {{ course.instructors && course.instructors[0] ? course.instructors[0].name : 'Bariton Faculty' }}
              </span>
            </div>

            <!-- Modules Count & Duration -->
            <div class="flex items-center gap-1 text-slate-500 font-medium flex-shrink-0">
              <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{{ course.modules_count || 1 }} Modules</span>
            </div>

            <!-- Credential Badge -->
            <div class="hidden sm:flex items-center gap-1 text-emerald-600 font-semibold flex-shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Diploma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'

const coursesStore = useCoursesStore()
const searchQuery = ref('')
const selectedLevel = ref('all')

const levels = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

function getCourseFallbackImage(slug) {
  const map = {
    'classical-piano-mastery': 'https://images.unsplash.com/photo-1520523839898-507127b31130?auto=format&fit=crop&w=800&q=80',
    'african-contemporary-gospel-keyboard': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    'conservatory-cello-performance': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
    'vocal-artistry-opera-performance': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
    'jazz-improvisation-harmony': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80',
    'acoustic-guitar-african-fingerstyle': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  }
  return map[slug] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
}

function getCourseLevelLabel(course) {
  if (course.modules && course.modules.length > 0) {
    const lvls = course.modules.map(m => m.level)
    if (lvls.includes('beginner') && lvls.includes('advanced')) return 'All Levels'
    if (lvls.includes('advanced')) return 'Advanced'
    if (lvls.includes('intermediate')) return 'Intermediate'
    if (lvls.includes('beginner')) return 'Beginner'
  }
  return 'All Levels'
}

function getLevelBadgeClass(course) {
  const lvl = getCourseLevelLabel(course).toLowerCase()
  if (lvl === 'beginner') return 'bg-emerald-500 text-white'
  if (lvl === 'intermediate') return 'bg-amber-500 text-slate-950 font-bold'
  if (lvl === 'advanced') return 'bg-indigo-600 text-white'
  return 'bg-slate-900 text-white'
}

function setLevel(lvl) {
  selectedLevel.value = lvl
  applyFilters()
}

function applyFilters() {
  const params = {}
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim()
  }
  if (selectedLevel.value !== 'all') {
    params.level = selectedLevel.value
  }
  coursesStore.fetchCatalog(params).catch(() => {})
}

function resetFilters() {
  searchQuery.value = ''
  selectedLevel.value = 'all'
  coursesStore.fetchCatalog().catch(() => {})
}

onMounted(() => {
  coursesStore.fetchCatalog().catch(() => {})
})
</script>
