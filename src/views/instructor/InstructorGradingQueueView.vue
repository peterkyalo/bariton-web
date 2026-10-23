<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAssignmentsStore } from '@/stores/assignments'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const assignmentsStore = useAssignmentsStore()

const statusFilter = ref('')

onMounted(async () => {
  await loadQueue()
})

async function loadQueue() {
  await assignmentsStore.fetchGradingQueue({
    status: statusFilter.value || undefined,
  })
}

function handleFilterChange() {
  loadQueue()
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const queue = computed(() => assignmentsStore.gradingQueue)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white">
          Instructor Grading Queue
        </h1>
        <p class="text-sm text-ink-300 mt-1">
          Review, listen to performance recordings, and evaluate student module assignments using conservatory rubrics.
        </p>
      </div>

      <router-link to="/instructor/courses" class="btn btn-secondary text-xs">
        My Teaching Courses
      </router-link>
    </div>

    <!-- Filters & Refresh -->
    <div class="glass p-4 rounded-xl flex flex-wrap gap-4 items-center">
      <div class="flex items-center gap-2 text-xs">
        <label class="text-ink-400 font-medium">Status Filter:</label>
        <select
          v-model="statusFilter"
          @change="handleFilterChange"
          class="field-input py-1.5 px-3 text-xs w-48"
        >
          <option value="">All Submissions</option>
          <option value="submitted">Pending Evaluation</option>
          <option value="grading">Currently In Review</option>
          <option value="graded">Graded (Passed)</option>
          <option value="resubmission_required">Revision Required</option>
        </select>
      </div>

      <button @click="loadQueue" class="btn btn-secondary text-xs ml-auto">
        Refresh Queue
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="assignmentsStore.loading && !queue.length" class="py-20 flex justify-center">
      <LoadingSpinner text="Loading grading queue..." />
    </div>

    <!-- Empty State -->
    <div v-else-if="!queue.length" class="py-12">
      <EmptyState
        title="No assignment submissions found"
        description="There are currently no student performance submissions matching your filter criteria."
      />
    </div>

    <!-- Table -->
    <div v-else class="glass rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-ink-200">
          <thead class="bg-ink-950/80 text-ink-400 uppercase tracking-wider text-[10px] border-b border-white/10">
            <tr>
              <th class="py-3.5 px-4 font-semibold">Student</th>
              <th class="py-3.5 px-4 font-semibold">Assignment / Module</th>
              <th class="py-3.5 px-4 font-semibold">Attempt</th>
              <th class="py-3.5 px-4 font-semibold">Submitted Date</th>
              <th class="py-3.5 px-4 font-semibold">Status</th>
              <th class="py-3.5 px-4 font-semibold">Score</th>
              <th class="py-3.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="sub in queue"
              :key="sub.id"
              class="hover:bg-white/[0.02] transition-colors"
            >
              <td class="py-4 px-4">
                <div class="font-semibold text-white">{{ sub.student?.name || 'Student' }}</div>
                <div class="text-[11px] text-ink-400">{{ sub.student?.email }}</div>
              </td>

              <td class="py-4 px-4">
                <div class="font-medium text-white max-w-xs truncate">
                  {{ sub.assignment?.title }}
                </div>
                <div class="text-[11px] text-brass-400">
                  {{ sub.assignment?.module?.course?.title }} • {{ sub.assignment?.module?.title }}
                </div>
              </td>

              <td class="py-4 px-4 font-mono font-medium text-ink-300">
                Attempt #{{ sub.attempt_number }}
              </td>

              <td class="py-4 px-4 text-ink-300">
                {{ formatDate(sub.created_at) }}
              </td>

              <td class="py-4 px-4">
                <span
                  :class="[
                    'badge text-[10px] font-bold uppercase',
                    sub.status === 'graded' && sub.passed ? 'badge-success' : '',
                    sub.status === 'resubmission_required' ? 'badge-danger' : '',
                    sub.status === 'submitted' || sub.status === 'grading' ? 'badge-brass' : '',
                  ]"
                >
                  {{ sub.status === 'resubmission_required' ? 'Revision Needed' : sub.status }}
                </span>
              </td>

              <td class="py-4 px-4 font-mono font-bold">
                <span v-if="sub.score_percent !== null" :class="sub.passed ? 'text-emerald-400' : 'text-danger-400'">
                  {{ sub.score_percent }}%
                </span>
                <span v-else class="text-ink-500 font-normal italic">
                  Not graded
                </span>
              </td>

              <td class="py-4 px-4 text-right">
                <router-link
                  :to="`/instructor/grading/${sub.uuid}`"
                  class="btn btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5"
                >
                  <span>{{ sub.status === 'graded' ? 'View Evaluation' : 'Evaluate & Grade' }}</span>
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
