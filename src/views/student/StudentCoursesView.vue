<template>
  <div class="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-serif font-bold text-white tracking-tight">
          My Enrolled Courses
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Continue your study, review sheet music, practice with masterclasses, and complete assignments.
        </p>
      </div>

      <router-link to="/courses" class="btn btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto">
        <span>Browse Course Catalog</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </router-link>
    </div>

    <div v-if="coursesStore.loading" class="flex justify-center py-20">
      <LoadingSpinner text="Loading your courses..." />
    </div>

    <div v-else-if="coursesStore.studentEnrollments.length === 0" class="py-16">
      <EmptyState
        title="No enrollments yet"
        description="You have not enrolled in any courses yet. Discover our conservatory offerings in the catalog."
      >
        <router-link to="/courses" class="btn btn-primary mt-4">
          Explore Courses
        </router-link>
      </EmptyState>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="enrollment in coursesStore.studentEnrollments"
        :key="enrollment.id"
        class="card rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-gold-500/40 transition-all flex flex-col justify-between overflow-hidden"
      >
        <div>
          <!-- Course Cover Thumbnail -->
          <div class="h-40 bg-slate-950 relative overflow-hidden border-b border-slate-800/80">
            <img
              v-if="resolveEnrollmentCover(enrollment)"
              :src="resolveEnrollmentCover(enrollment)"
              :alt="enrollment.course?.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-900 to-slate-950 text-gold-400/40 text-4xl">
              🎼
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent"></div>

            <div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span class="badge badge-gold text-[10px] font-bold uppercase tracking-wider">
                {{ enrollment.path_type === 'validation' ? 'Skills Validation Track' : 'Conservatory Track' }}
              </span>
              <span :class="['text-[11px] font-semibold px-2.5 py-0.5 rounded-full border', enrollment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-900/90 text-slate-200 border-slate-700']">
                {{ enrollment.status === 'completed' ? '✓ Completed' : 'In Progress' }}
              </span>
            </div>

            <div class="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-[11px] text-slate-300 font-medium">
              <span>{{ getUnlockedModulesCount(enrollment) }}/{{ enrollment.modules?.length || 0 }} Modules Unlocked</span>
              <span>{{ getCompletedLessonsCount(enrollment) }}/{{ getTotalLessonsCount(enrollment) }} Lessons Completed</span>
            </div>
          </div>

          <div class="p-5 space-y-4">
            <div>
              <h3 class="text-xl font-serif font-bold text-white">
                {{ enrollment.course?.title }}
              </h3>
              <p class="text-xs text-slate-400 mt-1 line-clamp-2">
                {{ enrollment.course?.short_description || stripRichTextToPlain(enrollment.course?.description) }}
              </p>
            </div>

            <!-- Unlocked Module Pills -->
            <div v-if="enrollment.modules?.length" class="space-y-1.5 pt-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Enrolled Curriculum Modules
              </span>
              <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
                <router-link
                  v-for="mod in enrollment.modules"
                  :key="mod.id"
                  :to="mod.is_unlocked ? `/student/courses/${enrollment.uuid}/player?module=${mod.id}` : `/courses/${enrollment.course?.slug}`"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-colors"
                  :class="mod.is_unlocked ? 'bg-navy-950/70 border-slate-800 hover:border-gold-500/40 text-slate-200' : 'bg-navy-950/30 border-slate-800/40 text-slate-500'"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-[10px] font-bold uppercase text-gold-400 shrink-0">{{ mod.level }}</span>
                    <span class="truncate">{{ mod.title }}</span>
                  </div>
                  <span v-if="mod.is_unlocked" class="text-[11px] font-bold text-emerald-400 shrink-0 ml-2">
                    {{ mod.progress_percent || 0 }}%
                  </span>
                  <span v-else class="text-[10px] text-slate-500 shrink-0 ml-2">Locked</span>
                </router-link>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-1.5 pt-1">
              <div class="flex justify-between text-xs">
                <span class="text-slate-400">Overall Course Progress</span>
                <span class="text-gold-400 font-bold">{{ Math.round(Number(enrollment.progress_percent || 0)) }}%</span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-gold-500 to-amber-300 transition-all duration-500"
                  :style="{ width: `${enrollment.progress_percent || 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 pt-0 flex items-center gap-2">
          <router-link
            :to="`/student/courses/${enrollment.uuid}/player`"
            class="btn btn-primary flex-1 text-center py-2.5 font-bold text-xs flex items-center justify-center gap-2"
          >
            <span>{{ enrollment.path_type === 'validation' ? 'Go to Assessment Studio' : 'Continue Learning' }}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCoursesStore } from '../../stores/courses';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import { resolveMediaUrl, extractFirstImageUrl, stripRichTextToPlain } from '../../lib/richText';

const coursesStore = useCoursesStore();

function resolveEnrollmentCover(enrollment) {
  const c = enrollment?.course;
  if (!c) return '';
  const explicit = resolveMediaUrl(c.thumbnail_url || c.thumbnail_path || '');
  if (explicit) return explicit;
  const fromDesc = extractFirstImageUrl(c.description || '');
  if (fromDesc) return fromDesc;
  if (Array.isArray(enrollment.modules)) {
    for (const m of enrollment.modules) {
      const mCover = resolveMediaUrl(m.image_url || m.image_path || '') || extractFirstImageUrl(m.description || '');
      if (mCover) return mCover;
    }
  }
  return '';
}

function getUnlockedModulesCount(enrollment) {
  if (!Array.isArray(enrollment?.modules)) return 0;
  return enrollment.modules.filter(m => m.is_unlocked).length;
}

function getTotalLessonsCount(enrollment) {
  if (!Array.isArray(enrollment?.modules)) return 0;
  return enrollment.modules
    .filter(m => m.is_unlocked)
    .reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
}

function getCompletedLessonsCount(enrollment) {
  if (!Array.isArray(enrollment?.modules)) return 0;
  let done = 0;
  for (const m of enrollment.modules) {
    if (!m.is_unlocked || !Array.isArray(m.lessons)) continue;
    for (const l of m.lessons) {
      if ((enrollment.progress_map?.[l.id]?.status || l.progress?.status) === 'completed') {
        done++;
      }
    }
  }
  return done;
}

onMounted(() => {
  coursesStore.fetchStudentEnrollments();
});
</script>
