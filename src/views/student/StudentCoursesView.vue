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
        class="card p-6 rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-gold-500/40 transition-all flex flex-col justify-between space-y-6"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="badge badge-gold text-xs font-bold uppercase tracking-wider">
              {{ enrollment.path_type }} Path
            </span>
            <span :class="['text-xs font-semibold px-2 py-0.5 rounded', enrollment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300']">
              {{ enrollment.status === 'completed' ? 'Completed' : 'In Progress' }}
            </span>
          </div>

          <div>
            <h3 class="text-xl font-serif font-bold text-white">
              {{ enrollment.course?.title }}
            </h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">
              {{ enrollment.course?.short_description }}
            </p>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1.5 pt-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Curriculum Progress</span>
              <span class="text-gold-400 font-bold">{{ enrollment.progress_percent }}%</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-gold-500 to-amber-300 transition-all duration-500"
                :style="{ width: `${enrollment.progress_percent}%` }"
              ></div>
            </div>
          </div>
        </div>

        <router-link
          :to="`/student/courses/${enrollment.uuid}/player`"
          class="btn btn-primary w-full text-center py-2.5 font-bold text-xs flex items-center justify-center gap-2"
        >
          <span>Continue Learning</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCoursesStore } from '../../stores/courses';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';

const coursesStore = useCoursesStore();

onMounted(() => {
  coursesStore.fetchStudentEnrollments();
});
</script>
