<template>
  <div class="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-serif font-bold text-white tracking-tight">
          Courses & Curriculum Management
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Publish conservatory courses, configure levels, module pricing, and bundle discounts.
        </p>
      </div>

      <router-link to="/admin/courses/create" class="btn btn-primary text-xs flex items-center gap-2 self-start sm:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Create New Course</span>
      </router-link>
    </div>

    <!-- Filters -->
    <div class="card p-4 bg-navy-900/60 border border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
      <div class="relative w-full sm:w-80">
        <input
          v-model="search"
          type="text"
          placeholder="Search by title..."
          class="w-full pl-9 pr-4 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-gold-500"
          @keyup.enter="loadCourses"
        />
        <svg class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <select
          v-model="statusFilter"
          @change="loadCourses"
          class="px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-gold-500"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden bg-navy-900/60 border border-slate-800 rounded-2xl">
      <div v-if="coursesStore.loading" class="py-16 flex justify-center">
        <LoadingSpinner text="Loading courses..." />
      </div>

      <div v-else-if="coursesStore.adminCourses.length === 0" class="py-12">
        <EmptyState
          title="No courses configured"
          description="Create your first conservatory course to begin populating the catalog."
        />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-navy-950/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
            <tr>
              <th class="p-4">Course</th>
              <th class="p-4">Status</th>
              <th class="p-4">Instructors</th>
              <th class="p-4">Modules</th>
              <th class="p-4">Bundle Price</th>
              <th class="p-4">Discount</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="course in coursesStore.adminCourses"
              :key="course.id"
              class="hover:bg-slate-800/30 transition-colors"
            >
              <td class="p-4 font-medium text-white">
                <div class="font-serif font-bold text-sm text-gold-400">{{ course.title }}</div>
                <div class="text-[11px] text-slate-400">{{ course.slug }}</div>
              </td>
              <td class="p-4">
                <span :class="['badge text-[10px] uppercase font-bold', statusBadgeClass(course.status)]">
                  {{ course.status }}
                </span>
              </td>
              <td class="p-4 text-slate-300">
                <span v-if="course.instructors?.length">
                  {{ course.instructors.map(i => i.name).join(', ') }}
                </span>
                <span v-else class="text-slate-500 italic">None assigned</span>
              </td>
              <td class="p-4 text-slate-300">
                {{ course.modules?.length || 0 }} modules
              </td>
              <td class="p-4 font-bold text-white">
                <div>KES {{ course.pricing.bundle_price_formatted }}</div>
                <div class="text-[10px] text-slate-400 font-normal">${{ course.pricing.bundle_price_usd_formatted }} USD</div>
              </td>
              <td class="p-4 text-slate-300">
                <span v-if="course.pricing.bundle_savings_kes > 0" class="text-emerald-400 font-bold">
                  Save {{ course.pricing.bundle_savings_formatted }} KES
                </span>
                <span v-else class="text-slate-500">None</span>
              </td>
              <td class="p-4 text-right space-x-2">
                <router-link
                  :to="`/courses/${course.slug}`"
                  target="_blank"
                  class="btn btn-secondary text-[11px] px-2.5 py-1"
                >
                  Preview
                </router-link>
                <router-link
                  :to="`/admin/courses/${course.id}/edit`"
                  class="btn btn-primary text-[11px] px-2.5 py-1"
                >
                  Edit
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCoursesStore } from '../../../stores/courses';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../../components/ui/EmptyState.vue';

const coursesStore = useCoursesStore();
const search = ref('');
const statusFilter = ref('');

function statusBadgeClass(status) {
  if (status === 'published') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (status === 'draft') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  return 'bg-slate-800 text-slate-400';
}

function loadCourses() {
  const params = {};
  if (search.value.trim()) params.search = search.value.trim();
  if (statusFilter.value) params.status = statusFilter.value;
  coursesStore.fetchAdminCourses(params);
}

onMounted(() => {
  loadCourses();
});
</script>
