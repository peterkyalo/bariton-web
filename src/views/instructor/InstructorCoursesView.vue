<template>
  <div class="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-serif font-bold text-white tracking-tight">
          Instructor Courses & Curriculum
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Manage your assigned conservatory courses, levels, modules, video masterclasses, audio tracks and sheet music.
        </p>
      </div>
      <button
        v-if="auth.can('courses.create')"
        id="new-course-btn"
        class="btn btn-primary text-xs font-bold"
        @click="showCreate = true"
      >
        + New Course
      </button>
    </div>

    <div v-if="coursesStore.loading" class="flex justify-center py-20">
      <LoadingSpinner text="Loading courses..." />
    </div>

    <div v-else-if="coursesStore.instructorCourses.length === 0" class="py-16">
      <EmptyState
        title="No assigned courses"
        description="You have not been assigned to any courses yet. Academy administrators assign instructors to courses."
      />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="course in coursesStore.instructorCourses"
        :key="course.id"
        class="card p-6 rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-gold-500/40 transition-all flex flex-col justify-between space-y-6"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span :class="['badge text-xs uppercase font-bold', course.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400']">
              {{ course.status }}
            </span>
            <span class="text-xs text-slate-400">
              {{ course.modules?.length || 0 }} Modules
            </span>
          </div>

          <div>
            <h3 class="text-xl font-serif font-bold text-white">
              {{ course.title }}
            </h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">
              {{ course.short_description || course.description }}
            </p>
          </div>

          <div class="text-xs text-slate-400 space-y-1 bg-navy-950/60 p-3 rounded-xl border border-slate-800">
            <div class="flex justify-between">
              <span>Bundle Price:</span>
              <span class="font-bold text-gold-400">KES {{ course.pricing.bundle_price_formatted }} (${{ course.pricing.bundle_price_usd_formatted }})</span>
            </div>
            <div class="flex justify-between">
              <span>Total Module Value:</span>
              <span>KES {{ course.pricing.total_modules_formatted }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <router-link
            :to="`/instructor/courses/${course.id}`"
            class="btn btn-primary w-full text-center py-2.5 font-bold text-xs"
          >
            Manage Modules &amp; Lessons
          </router-link>
          <router-link
            :to="`/courses/${course.slug}`"
            class="btn btn-secondary w-full text-center py-2.5 font-bold text-xs flex items-center justify-center gap-2"
          >
            <span>View Public Course Page</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>

    <Modal :open="showCreate" title="Create New Course" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="createCourse">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Course Title *</label>
          <input id="new-course-title" v-model="newCourse.title" type="text" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" placeholder="e.g. Classical Piano Foundations" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Short Description</label>
          <textarea id="new-course-short" v-model="newCourse.short_description" rows="3" maxlength="500" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"></textarea>
        </div>
        <p class="text-[11px] text-slate-500">The course is created as a private draft. You can add modules and lessons next, then publish.</p>
        <p v-if="createError" class="text-xs text-red-400">{{ createError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-secondary text-xs" @click="showCreate = false">Cancel</button>
          <button id="create-course-submit" type="submit" class="btn btn-primary text-xs font-bold" :disabled="creating">
            {{ creating ? 'Creating...' : 'Create Course' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCoursesStore } from '../../stores/courses';
import { useAuthStore } from '../../stores/auth';
import { parseError } from '../../lib/http';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Modal from '../../components/ui/Modal.vue';

const coursesStore = useCoursesStore();
const auth = useAuthStore();
const router = useRouter();

const showCreate = ref(false);
const creating = ref(false);
const createError = ref('');
const newCourse = reactive({ title: '', short_description: '' });

async function createCourse() {
  creating.value = true;
  createError.value = '';
  try {
    const res = await coursesStore.saveCourse({
      title: newCourse.title,
      short_description: newCourse.short_description,
      status: 'draft',
      bundle_discount_type: 'none',
      bundle_discount_value: 0,
    });
    showCreate.value = false;
    router.push(`/instructor/courses/${res.course.id}`);
  } catch (err) {
    const { message, errors } = parseError(err);
    createError.value = Object.values(errors)[0] || message;
  } finally {
    creating.value = false;
  }
}

onMounted(() => {
  coursesStore.fetchInstructorCourses();
});
</script>
