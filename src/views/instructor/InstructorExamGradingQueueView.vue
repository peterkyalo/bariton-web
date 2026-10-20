<script setup>
import { onMounted } from 'vue'
import { useExamsStore } from '@/stores/exams'

const examsStore = useExamsStore()

onMounted(async () => {
  await examsStore.fetchExamGradingQueue()
})

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
      <div>
        <h1 class="text-2xl font-black text-white tracking-tight">Final Exam Grading Studio</h1>
        <p class="text-xs text-slate-400 mt-1">
          Review, annotate, and grade student theory analysis and recorded performances with conservatory rubrics.
        </p>
      </div>
      <button
        @click="examsStore.fetchExamGradingQueue()"
        class="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
      >
        Refresh Queue
      </button>
    </div>

    <!-- Loading / Empty -->
    <div v-if="examsStore.loading" class="text-center py-16 text-slate-400">
      Loading submissions awaiting faculty grading...
    </div>

    <div
      v-else-if="examsStore.examGradingQueue.length === 0"
      class="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3"
    >
      <div class="text-slate-600 text-4xl">✓</div>
      <h3 class="text-lg font-bold text-white">Grading Queue Clear</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        All submitted final examinations have been evaluated and graded.
      </p>
    </div>

    <!-- Table -->
    <div v-else class="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th class="px-6 py-4">Student</th>
              <th class="px-6 py-4">Course / Exam</th>
              <th class="px-6 py-4">Attempt</th>
              <th class="px-6 py-4">Submitted At</th>
              <th class="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="item in examsStore.examGradingQueue"
              :key="item.uuid"
              class="hover:bg-slate-800/30 transition"
            >
              <td class="px-6 py-4">
                <div class="font-bold text-white">{{ item.student_name }}</div>
                <div class="text-xs text-slate-500 font-mono">{{ item.student_email }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-slate-200">{{ item.course_title }}</div>
                <div class="text-xs text-amber-500 font-medium">{{ item.exam_title }}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded bg-slate-800 text-xs font-bold text-slate-300">
                  Attempt #{{ item.attempt_number }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-slate-400 font-mono">
                {{ formatDate(item.submitted_at) }}
              </td>
              <td class="px-6 py-4 text-right">
                <router-link
                  :to="{ name: 'instructor.exam-grading.detail', params: { uuid: item.uuid } }"
                  class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition inline-block"
                >
                  Grade Exam →
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
