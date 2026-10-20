<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
    <div v-if="coursesStore.loading" class="flex justify-center py-24">
      <LoadingSpinner text="Loading course details..." />
    </div>

    <div v-else-if="!course" class="py-16 text-center">
      <EmptyState
        title="Course not found"
        description="The course you are looking for does not exist or has been archived."
      >
        <router-link to="/courses" class="btn btn-primary mt-4">
          Return to Catalog
        </router-link>
      </EmptyState>
    </div>

    <div v-else class="space-y-10">
      <!-- Breadcrumb & Back -->
      <div>
        <router-link to="/courses" class="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-gold-400 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses Catalog
        </router-link>
      </div>

      <!-- Hero Banner -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/20">
            Conservatory Performance Path
          </div>

          <h1 class="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            {{ course.title }}
          </h1>

          <p class="text-base sm:text-lg text-slate-300 leading-relaxed">
            {{ course.description }}
          </p>

          <!-- Instructors & Metadata -->
          <div class="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-400 border-t border-slate-800">
            <div v-if="course.instructors?.length" class="flex items-center gap-2">
              <span class="text-slate-500">Instructor:</span>
              <span class="text-white font-medium">{{ course.instructors.map(i => i.name).join(', ') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-500">Levels:</span>
              <span class="text-gold-400 font-medium">{{ course.modules?.length || 0 }} Progressive Levels</span>
            </div>
            <div v-if="course.requires_sequential_levels" class="inline-flex items-center gap-1.5 text-xs text-aria-400 bg-aria-500/10 px-2.5 py-1 rounded-md border border-aria-500/20">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Sequential Level Progression Required
            </div>
          </div>
        </div>

        <!-- Pricing Card Sticky Panel -->
        <div class="space-y-6">
          <!-- Main Purchase Card -->
          <div class="card p-6 rounded-2xl bg-navy-900/90 border border-gold-500/30 shadow-2xl backdrop-blur-md space-y-6 relative overflow-hidden">
            <div class="absolute -right-8 -top-8 w-40 h-40 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <!-- Standard Bundle Price -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Complete Course Bundle</span>
                <span v-if="course.pricing.bundle_savings_kes > 0" class="badge badge-gold text-xs">
                  Save {{ course.pricing.bundle_savings_formatted }} KES
                </span>
              </div>

              <div class="text-3xl sm:text-4xl font-serif font-bold text-gold-400">
                KES {{ course.pricing.bundle_price_formatted }}
              </div>
              <div class="text-sm font-medium text-slate-400">
                ${{ course.pricing.bundle_price_usd_formatted }} USD
              </div>

              <!-- Module Total Breakdown -->
              <div class="pt-3 border-t border-slate-800 text-xs space-y-1 text-slate-400">
                <div class="flex justify-between">
                  <span>Sum of individual modules:</span>
                  <span class="line-through text-slate-500">
                    KES {{ course.pricing.total_modules_formatted }} (${{ course.pricing.total_modules_usd_formatted }})
                  </span>
                </div>
                <div v-if="course.pricing.bundle_savings_kes > 0" class="flex justify-between text-emerald-400 font-medium">
                  <span>Bundle discount savings:</span>
                  <span>- KES {{ course.pricing.bundle_savings_formatted }} (-${{ course.pricing.bundle_savings_usd_formatted }})</span>
                </div>
              </div>
            </div>

            <!-- Student Upgrade Pricing (When student owns one or more modules) -->
            <div
              v-if="course.upgrade_pricing?.has_owned_modules"
              class="p-4 rounded-xl bg-gold-500/10 border border-gold-500/30 space-y-2"
            >
              <div class="flex items-center gap-1.5 text-xs font-bold text-gold-400 uppercase tracking-wide">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Bundle Upgrade Credit Applied
              </div>
              <p class="text-xs text-slate-300">
                You already own module(s) in this course with <strong class="text-white">KES {{ (course.upgrade_pricing.total_paid_kes / 100).toLocaleString() }}</strong> previously paid.
              </p>
              <div class="pt-2 border-t border-gold-500/20 flex items-baseline justify-between">
                <span class="text-xs text-slate-300 font-medium">Your Upgrade Price:</span>
                <div class="text-right">
                  <span class="text-xl font-serif font-bold text-white">
                    KES {{ course.upgrade_pricing.upgrade_price_formatted }}
                  </span>
                  <span class="block text-xs text-gold-400">
                    ${{ course.upgrade_pricing.upgrade_price_usd_formatted }} USD
                  </span>
                </div>
              </div>
            </div>

            <!-- CTA Actions -->
            <div class="space-y-3 pt-2">
              <button
                v-if="authStore.isAuthenticated"
                @click="openPurchaseModal"
                class="btn btn-primary w-full py-3 text-center font-bold text-sm shadow-lg shadow-gold-500/20"
              >
                {{ course.upgrade_pricing?.has_owned_modules ? 'Upgrade to Full Course' : 'Enroll in Full Course' }}
              </button>
              <router-link
                v-else
                to="/register"
                class="btn btn-primary w-full py-3 text-center font-bold text-sm shadow-lg shadow-gold-500/20 block"
              >
                Register to Enroll
              </router-link>

              <p class="text-[11px] text-center text-slate-400">
                Includes lifetime access to all lessons, downloadable sheet music, audio tracks and certificate upon completion.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Curriculum Breakdown by Level -->
      <div class="space-y-6 pt-6 border-t border-slate-800">
        <div>
          <h2 class="text-2xl sm:text-3xl font-serif font-bold text-white">
            Curriculum & Levels
          </h2>
          <p class="text-sm text-slate-400 mt-1">
            Explore modules by level. Each module can be taken individually or as part of the complete bundle.
          </p>
        </div>

        <div class="space-y-6">
          <div
            v-for="module in course.modules"
            :key="module.id"
            class="card p-6 rounded-2xl bg-navy-900/60 border border-slate-800 space-y-4"
          >
            <!-- Module Header with Level & Individual Price -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span :class="['badge text-xs font-bold uppercase tracking-wider', levelBadgeClass(module.level)]">
                    Level: {{ module.level }}
                  </span>
                  <span class="text-xs text-slate-500">Module {{ module.order }}</span>
                </div>
                <h3 class="text-xl font-serif font-bold text-white">
                  {{ module.title }}
                </h3>
                <p class="text-xs text-slate-400">
                  {{ module.description }}
                </p>
              </div>

              <!-- Module Pricing in KES and USD -->
              <div class="text-right sm:self-center bg-navy-950/70 p-3 sm:p-4 rounded-xl border border-slate-800/80 min-w-[180px]">
                <div class="text-xs text-slate-400">Single Module Price</div>
                <div class="text-xl font-serif font-bold text-gold-400">
                  KES {{ module.price_formatted }}
                </div>
                <div class="text-xs font-medium text-slate-400">
                  ${{ module.price_usd_formatted }} USD
                </div>
                <button
                  @click="enrollInModule(module)"
                  class="btn btn-secondary text-xs mt-2 w-full py-1.5"
                >
                  Enroll in Level
                </button>
              </div>
            </div>

            <!-- Lessons List -->
            <div class="space-y-2">
              <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Lessons in this module ({{ module.lessons?.length || 0 }})
              </div>

              <div
                v-for="lesson in module.lessons"
                :key="lesson.id"
                class="flex items-center justify-between p-3 rounded-xl bg-navy-950/50 border border-slate-800/60 hover:border-slate-700 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <!-- Type Icon -->
                  <span :class="['p-2 rounded-lg text-xs', typeBadgeClass(lesson.type)]">
                    <svg v-if="lesson.type === 'youtube'" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <svg v-else-if="lesson.type === 'audio'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </span>

                  <div>
                    <div class="text-sm font-medium text-white flex items-center gap-2">
                      <span>{{ lesson.title }}</span>
                      <span v-if="lesson.is_preview" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Free Preview
                      </span>
                    </div>
                    <div class="text-xs text-slate-400">
                      {{ formatDuration(lesson.duration_seconds) }} • {{ capitalize(lesson.type) }} Format
                    </div>
                  </div>
                </div>

                <!-- Preview / Action Button -->
                <div>
                  <button
                    v-if="lesson.is_preview"
                    @click="watchPreview(lesson)"
                    class="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch Preview
                  </button>
                  <span v-else class="text-xs text-slate-600 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Locked
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <Modal :show="showPreviewModal" @close="closePreviewModal" max-width="max-w-3xl">
      <div v-if="previewLesson" class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-xs font-bold text-gold-400 uppercase tracking-wider">Free Lesson Preview</span>
            <h3 class="text-lg font-serif font-bold text-white">{{ previewLesson.title }}</h3>
          </div>
          <button @click="closePreviewModal" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="previewLesson.type === 'youtube'" class="aspect-video w-full rounded-xl overflow-hidden bg-black">
          <iframe
            :src="`https://www.youtube.com/embed/${previewLesson.youtube_video_id}?autoplay=1&rel=0`"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>

        <p class="text-sm text-slate-300">
          {{ previewLesson.summary }}
        </p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCoursesStore } from '../../stores/courses';
import { useAuthStore } from '../../stores/auth';
import { useUiStore } from '../../stores/ui';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Modal from '../../components/ui/Modal.vue';

const route = useRoute();
const router = useRouter();
const coursesStore = useCoursesStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const course = computed(() => coursesStore.currentCourse);
const showPreviewModal = ref(false);
const previewLesson = ref(null);

function levelBadgeClass(level) {
  if (level === 'beginner') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
  if (level === 'intermediate') return 'bg-aria-500/10 text-aria-400 border border-aria-500/30';
  return 'bg-gold-500/10 text-gold-400 border border-gold-500/30';
}

function typeBadgeClass(type) {
  if (type === 'youtube') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (type === 'audio') return 'bg-aria-500/10 text-aria-400 border border-aria-500/20';
  return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
}

function formatDuration(seconds) {
  if (!seconds) return 'Self-paced';
  const mins = Math.floor(seconds / 60);
  return `${mins} mins`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function watchPreview(lesson) {
  previewLesson.value = lesson;
  showPreviewModal.value = true;
}

function closePreviewModal() {
  showPreviewModal.value = false;
  previewLesson.value = null;
}

function openPurchaseModal() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  if (course.value?.upgrade_pricing?.has_owned_modules) {
    router.push({ path: '/checkout', query: { type: 'bundle_upgrade', id: course.value.id } });
  } else {
    router.push({ path: '/checkout', query: { type: 'course_bundle', id: course.value.id } });
  }
}

function enrollInModule(module) {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  router.push({ path: '/checkout', query: { type: 'module', id: module.id } });
}

onMounted(async () => {
  const slug = route.params.slug;
  if (slug) {
    await coursesStore.fetchCourse(slug);
  }
});
</script>
