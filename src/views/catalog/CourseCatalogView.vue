<template>
  <div class="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header Hero -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-950 p-8 sm:p-12 border border-gold-500/20 shadow-2xl">
      <div class="relative z-10 max-w-3xl">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/30 mb-4">
          Bariton Conservatory Curriculum
        </span>
        <h1 class="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
          Master Musical Artistry with Elite Instruction
        </h1>
        <p class="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          Structured, conservatory-grade progressive learning paths from foundational technique to virtuoso performance. Learn online at your own pace with downloadable scores, audio ear-training and video masterclasses.
        </p>

        <!-- Search & Filter Controls -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search courses, instruments, repertoire..."
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-900/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all text-sm"
              @keyup.enter="applyFilters"
            />
            <svg class="w-5 h-5 absolute left-3 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              v-for="lvl in levels"
              :key="lvl.id"
              @click="setLevel(lvl.id)"
              :class="[
                'px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border',
                selectedLevel === lvl.id
                  ? 'bg-gold-500 text-navy-950 font-bold border-gold-400 shadow-lg shadow-gold-500/20'
                  : 'bg-navy-900/60 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
              ]"
            >
              {{ lvl.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Luxury Decorative Glow -->
      <div class="absolute -right-16 -bottom-16 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute right-1/3 -top-16 w-80 h-80 bg-aria-500/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- Course Grid -->
    <div v-if="coursesStore.loading" class="flex justify-center py-20">
      <LoadingSpinner text="Loading courses..." />
    </div>

    <div v-else-if="coursesStore.catalog.length === 0" class="py-16">
      <EmptyState
        title="No courses found"
        description="Try adjusting your search terms or filter selection to find courses."
      >
        <button @click="resetFilters" class="btn btn-secondary text-sm mt-4">
          Reset Filters
        </button>
      </EmptyState>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="course in coursesStore.catalog"
        :key="course.id"
        class="card group flex flex-col justify-between overflow-hidden border border-slate-800 bg-navy-900/60 backdrop-blur-md hover:border-gold-500/50 hover:shadow-2xl hover:shadow-gold-500/10 transition-all duration-300 rounded-2xl"
      >
        <div>
          <!-- Thumbnail / Visual Banner -->
          <div class="relative h-48 bg-gradient-to-br from-navy-950 via-slate-900 to-indigo-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
            <div class="text-center p-6">
              <span class="inline-block p-3 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </span>
              <h3 class="font-serif text-lg font-bold text-white tracking-wide line-clamp-1">
                {{ course.title }}
              </h3>
            </div>

            <!-- Discount Savings Badge -->
            <div
              v-if="course.pricing.bundle_savings_kes > 0"
              class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-gold-500 text-navy-950 shadow-md uppercase tracking-wider"
            >
              Save {{ course.pricing.bundle_savings_formatted }} KES
            </div>

            <!-- Module Count Badge -->
            <div class="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md text-xs font-medium bg-navy-950/80 text-slate-300 border border-slate-700 backdrop-blur-sm">
              {{ course.modules_count }} Modules Available
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-6 space-y-4">
            <h2 class="text-xl font-serif font-bold text-white group-hover:text-gold-400 transition-colors">
              {{ course.title }}
            </h2>

            <p class="text-sm text-slate-400 line-clamp-3 leading-relaxed">
              {{ course.short_description || course.description }}
            </p>

            <!-- Instructors -->
            <div v-if="course.instructors && course.instructors.length" class="flex items-center gap-2 text-xs text-slate-400">
              <svg class="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{{ course.instructors.map(i => i.name).join(', ') }}</span>
            </div>
          </div>
        </div>

        <!-- Card Footer with Dual Pricing -->
        <div class="p-6 pt-0 border-t border-slate-800/80 mt-4 space-y-4">
          <div class="pt-4 flex items-end justify-between">
            <div>
              <div class="text-xs text-slate-400">Complete Bundle</div>
              <div class="text-2xl font-serif font-bold text-gold-400">
                KES {{ course.pricing.bundle_price_formatted }}
              </div>
              <div class="text-xs font-medium text-slate-400">
                ${{ course.pricing.bundle_price_usd_formatted }} USD
              </div>
            </div>

            <div v-if="course.pricing.bundle_savings_kes > 0" class="text-right">
              <span class="text-xs text-slate-500 line-through block">
                KES {{ course.pricing.total_modules_formatted }}
              </span>
              <span class="text-xs text-emerald-400 font-medium">
                Save ${{ course.pricing.bundle_savings_usd_formatted }}
              </span>
            </div>
          </div>

          <!-- Action Button -->
          <router-link
            :to="`/courses/${course.slug}`"
            class="btn btn-primary w-full text-center flex items-center justify-center gap-2 text-sm font-semibold py-2.5"
          >
            <span>Explore Curriculum</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCoursesStore } from '../../stores/courses';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';

const coursesStore = useCoursesStore();
const searchQuery = ref('');
const selectedLevel = ref('all');

const levels = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

function setLevel(lvl) {
  selectedLevel.value = lvl;
  applyFilters();
}

function applyFilters() {
  const params = {};
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim();
  }
  if (selectedLevel.value !== 'all') {
    params.level = selectedLevel.value;
  }
  coursesStore.fetchCatalog(params);
}

function resetFilters() {
  searchQuery.value = '';
  selectedLevel.value = 'all';
  coursesStore.fetchCatalog();
}

onMounted(() => {
  coursesStore.fetchCatalog();
});
</script>
