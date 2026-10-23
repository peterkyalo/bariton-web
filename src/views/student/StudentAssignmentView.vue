<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentsStore } from '@/stores/assignments'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ChunkedUploader from '@/components/ui/ChunkedUploader.vue'

const route = useRoute()
const router = useRouter()
const assignmentsStore = useAssignmentsStore()

const uploadPayload = ref(null)
const studentNotes = ref('')
const submitError = ref('')
const isSubmitting = ref(false)
const showResubmitForm = ref(false)

onMounted(async () => {
  await loadAssignment()
})

async function loadAssignment() {
  const assignmentUuid = route.params.uuid
  if (assignmentUuid) {
    try {
      await assignmentsStore.fetchAssignment(assignmentUuid)
    } catch {
      // Handled in store
    }
  }
}

const assignment = computed(() => assignmentsStore.currentAssignment)
const submissions = computed(() => assignmentsStore.submissions)
const latestSubmission = computed(() => submissions.value?.[0] || null)

const rubric = computed(() => assignment.value?.rubric)

function handleUploadCompleted(result) {
  uploadPayload.value = result
}

function handleUploadReset() {
  uploadPayload.value = null
}

async function handleSubmitAssignment() {
  submitError.value = ''
  if (!uploadPayload.value?.chunked_upload_uuid) {
    submitError.value = 'Please select and upload your performance recording first.'
    return
  }

  isSubmitting.value = true
  try {
    await assignmentsStore.submitAssignment(assignment.value.uuid, {
      chunked_upload_uuid: uploadPayload.value.chunked_upload_uuid,
      notes: studentNotes.value,
    })
    uploadPayload.value = null
    studentNotes.value = ''
    showResubmitForm.value = false
    await loadAssignment()
  } catch (err) {
    submitError.value = err.response?.data?.message || 'Failed to submit assignment.'
  } finally {
    isSubmitting.value = false
  }
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
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Breadcrumb & Header -->
    <div class="space-y-3 border-b border-white/10 pb-6">
      <router-link to="/student/courses" class="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-brass-300 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Enrolled Courses
      </router-link>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="badge badge-brass text-[10px] uppercase font-bold tracking-wider">
              Module Assignment
            </span>
            <span v-if="assignment?.submission_type" class="badge text-[10px] uppercase bg-ink-800 text-ink-300">
              {{ assignment.submission_type }} Submission
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            {{ assignment?.title || 'Assignment Assessment' }}
          </h1>
          <p class="text-xs text-ink-400 mt-0.5">
            {{ assignment?.course?.title }} • {{ assignment?.module?.title }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="assignmentsStore.loading && !assignment" class="py-20 flex justify-center">
      <LoadingSpinner text="Loading assignment details..." />
    </div>

    <div v-else-if="assignment" class="space-y-8">
      <!-- 1. Assignment Instructions Card -->
      <div class="glass p-6 sm:p-8 rounded-2xl space-y-4">
        <h2 class="text-base font-display font-bold text-white flex items-center gap-2">
          <svg class="w-5 h-5 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Instructions & Requirements
        </h2>

        <div class="text-sm text-ink-200 leading-relaxed whitespace-pre-line bg-ink-950/60 p-5 rounded-xl border border-white/5 font-sans">
          {{ assignment.instructions }}
        </div>
      </div>

      <!-- 2. Submission Evaluation & Feedback Card (if submitted) -->
      <div v-if="latestSubmission" class="glass p-6 sm:p-8 rounded-2xl space-y-6 border-brass-400/30">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-display font-bold text-white">
                Attempt #{{ latestSubmission.attempt_number }}
              </h3>
              <span
                :class="[
                  'badge text-xs font-bold uppercase',
                  latestSubmission.status === 'graded' && latestSubmission.passed ? 'badge-success' : '',
                  latestSubmission.status === 'resubmission_required' ? 'badge-danger' : '',
                  latestSubmission.status === 'submitted' || latestSubmission.status === 'grading' ? 'badge-brass' : '',
                ]"
              >
                {{ latestSubmission.status === 'resubmission_required' ? 'Revision Required' : latestSubmission.status }}
              </span>
            </div>
            <p class="text-xs text-ink-400 mt-1">
              Submitted on {{ formatDate(latestSubmission.created_at) }} • {{ latestSubmission.original_filename }}
            </p>
          </div>

          <div v-if="latestSubmission.score_percent !== null" class="text-right">
            <div class="text-2xl font-display font-bold font-mono" :class="latestSubmission.passed ? 'text-emerald-400' : 'text-danger-400'">
              {{ latestSubmission.score_percent }}%
            </div>
            <div class="text-[11px] text-ink-400">
              Pass mark: {{ assignment.pass_mark_percent || 70 }}%
            </div>
          </div>
        </div>

        <!-- Instructor Feedback Note -->
        <div v-if="latestSubmission.feedback" class="p-5 rounded-xl bg-ink-950/80 border border-white/10 space-y-2">
          <div class="flex items-center gap-2 text-xs font-bold text-brass-300">
            <svg class="w-4 h-4 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Evaluator Feedback:
          </div>
          <p class="text-xs text-ink-200 leading-relaxed whitespace-pre-line">
            {{ latestSubmission.feedback }}
          </p>
        </div>

        <!-- Rubric Criteria Breakdown -->
        <div v-if="latestSubmission.rubric_scores?.length" class="space-y-3">
          <h4 class="text-xs font-bold text-white uppercase tracking-wider">
            Rubric Criteria Assessment Breakdown
          </h4>

          <div class="space-y-2">
            <div
              v-for="score in latestSubmission.rubric_scores"
              :key="score.id"
              class="p-4 rounded-xl bg-ink-950/60 border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs"
            >
              <div class="space-y-1 max-w-lg">
                <span class="font-semibold text-white block">{{ score.criterion?.title }}</span>
                <span class="text-brass-400 font-medium text-[11px] block">
                  Level achieved: {{ score.level?.title }}
                </span>
                <p v-if="score.criterion_feedback" class="text-ink-300 italic text-[11px]">
                  "{{ score.criterion_feedback }}"
                </p>
              </div>

              <div class="font-mono text-sm font-bold text-white bg-ink-900 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                {{ score.points_awarded }} / {{ score.criterion?.max_points }} pts
              </div>
            </div>
          </div>
        </div>

        <!-- Resubmit Prompt if required -->
        <div v-if="latestSubmission.status === 'resubmission_required'" class="pt-2">
          <button
            v-if="!showResubmitForm"
            @click="showResubmitForm = true"
            class="btn btn-primary text-xs"
          >
            Resubmit Assignment (Attempt #{{ latestSubmission.attempt_number + 1 }})
          </button>
        </div>
      </div>

      <!-- 3. Rubric Evaluation Preview (Guidelines) -->
      <div v-if="rubric" class="glass p-6 sm:p-8 rounded-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 class="text-base font-display font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Assessment Rubric Guidelines: {{ rubric.title }}
            </h3>
            <p class="text-xs text-ink-400 mt-0.5">
              Review how your performance will be evaluated across conservatory criteria.
            </p>
          </div>
          <span class="font-mono text-xs text-brass-300 font-bold">
            Total: {{ rubric.total_points }} pts
          </span>
        </div>

        <div class="space-y-4">
          <div
            v-for="crit in rubric.criteria"
            :key="crit.id"
            class="p-4 rounded-xl bg-ink-950/60 border border-white/5 space-y-3"
          >
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-white">{{ crit.title }}</span>
              <span class="text-brass-400 font-mono">Max {{ crit.max_points }} pts</span>
            </div>
            <p v-if="crit.description" class="text-xs text-ink-300">{{ crit.description }}</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              <div
                v-for="lvl in crit.levels"
                :key="lvl.id"
                class="p-2.5 rounded-lg bg-ink-900/80 border border-white/5 text-[11px] space-y-1"
              >
                <div class="flex justify-between text-white font-medium">
                  <span>{{ lvl.title }}</span>
                  <span class="text-brass-300 font-mono">{{ lvl.points }} pts</span>
                </div>
                <p v-if="lvl.description" class="text-ink-400 text-[10px] leading-snug">
                  {{ lvl.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Submission Upload Form (Initial or Resubmission) -->
      <div v-if="!latestSubmission || showResubmitForm" class="glass p-6 sm:p-8 rounded-2xl space-y-6 border-brass-400/40">
        <div class="border-b border-white/10 pb-4">
          <h3 class="text-lg font-display font-bold text-white">
            Upload & Submit Performance
          </h3>
          <p class="text-xs text-ink-400 mt-0.5">
            Audio or video recording will be reviewed by conservatory faculty using the standard rubric.
          </p>
        </div>

        <!-- Resumable Uploader Component -->
        <ChunkedUploader
          :accepted-formats="assignment.accepted_formats || ['mp4', 'webm', 'mp3', 'wav']"
          :max-size-mb="assignment.max_file_size_mb || 200"
          :submission-type="assignment.submission_type || 'video'"
          @completed="handleUploadCompleted"
          @reset="handleUploadReset"
        />

        <!-- Student Performance Notes -->
        <div class="space-y-1.5">
          <label class="field-label" for="notes">Performance Notes for Instructor (Optional)</label>
          <textarea
            id="notes"
            v-model="studentNotes"
            rows="3"
            placeholder="Mention your instrument setup, tempo chosen, or specific measures you focused on..."
            class="field-input text-xs"
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <div v-if="submitError" class="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-300">
          {{ submitError }}
        </div>

        <div class="flex gap-3 pt-2">
          <button
            @click="handleSubmitAssignment"
            :disabled="isSubmitting || !uploadPayload"
            class="btn btn-primary text-xs flex-1"
          >
            <span v-if="isSubmitting">Submitting Assignment...</span>
            <span v-else>Submit Assignment for Evaluation</span>
          </button>

          <button
            v-if="showResubmitForm"
            @click="showResubmitForm = false"
            class="btn btn-secondary text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
