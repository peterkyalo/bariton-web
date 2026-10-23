<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentsStore } from '@/stores/assignments'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const assignmentsStore = useAssignmentsStore()

const generalFeedback = ref('')
const selectedLevels = ref({}) // { [criterion_id]: level_id }
const criterionComments = ref({}) // { [criterion_id]: comment_string }
const isGrading = ref(false)
const gradeError = ref('')
const gradeSuccess = ref('')

onMounted(async () => {
  await loadSubmission()
})

async function loadSubmission() {
  const uuid = route.params.uuid
  if (uuid) {
    try {
      const data = await assignmentsStore.fetchSubmissionForGrading(uuid)
      generalFeedback.value = data.submission?.feedback || ''

      // Preload previous rubric scores if already graded
      if (data.submission?.rubric_scores) {
        data.submission.rubric_scores.forEach((score) => {
          selectedLevels.value[score.rubric_criterion_id] = score.rubric_level_id
          if (score.criterion_feedback) {
            criterionComments.value[score.rubric_criterion_id] = score.criterion_feedback
          }
        })
      }
    } catch {
      // Handled in store
    }
  }
}

const payload = computed(() => assignmentsStore.currentSubmissionToGrade)
const submission = computed(() => payload.value?.submission)
const rubric = computed(() => payload.value?.rubric)
const streamUrl = computed(() => payload.value?.stream_url)
const passMark = computed(() => payload.value?.pass_mark_percent || 70)

function selectLevel(criterionId, levelId) {
  selectedLevels.value[criterionId] = levelId
}

// Live Score Calculation
const scoreBreakdown = computed(() => {
  if (!rubric.value?.criteria?.length) {
    return { earned: 0, possible: 100, percent: 0, passed: false }
  }

  let earned = 0
  let possible = 0

  rubric.value.criteria.forEach((crit) => {
    possible += crit.max_points
    const selectedLevelId = selectedLevels.value[crit.id]
    if (selectedLevelId) {
      const lvl = crit.levels.find((l) => l.id === selectedLevelId)
      if (lvl) earned += lvl.points
    }
  })

  if (possible === 0) possible = 100
  const percent = Math.round((earned / possible) * 100 * 100) / 100
  const passed = percent >= passMark.value

  return { earned, possible, percent, passed }
})

async function handleGradeSubmit() {
  gradeError.value = ''
  gradeSuccess.value = ''

  if (!generalFeedback.value || generalFeedback.value.trim().length < 5) {
    gradeError.value = 'Please provide written constructive feedback for the student.'
    return
  }

  const rubricScores = Object.entries(selectedLevels.value).map(([criterionId, levelId]) => ({
    criterion_id: parseInt(criterionId, 10),
    level_id: parseInt(levelId, 10),
    comments: criterionComments.value[criterionId] || null,
  }))

  isGrading.value = true
  try {
    const res = await assignmentsStore.submitGrade(submission.value.uuid, {
      rubric_scores: rubricScores,
      feedback: generalFeedback.value,
      total_points_earned: scoreBreakdown.value.earned,
      total_points_possible: scoreBreakdown.value.possible,
    })

    gradeSuccess.value = res.message
    setTimeout(() => {
      router.push('/instructor/grading')
    }, 1500)
  } catch (err) {
    gradeError.value = err.response?.data?.message || 'Failed to submit grade evaluation.'
  } finally {
    isGrading.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Breadcrumb & Header -->
    <div class="space-y-3 border-b border-white/10 pb-6">
      <router-link to="/instructor/grading" class="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-brass-300 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Grading Queue
      </router-link>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="badge badge-brass text-[10px] uppercase font-bold tracking-wider">
              Instructor Studio
            </span>
            <span class="badge text-[10px] uppercase bg-ink-800 text-ink-300">
              Attempt #{{ submission?.attempt_number }}
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            Grading: {{ submission?.assignment?.title || 'Assignment Evaluation' }}
          </h1>
          <p class="text-xs text-ink-400 mt-0.5">
            Student: <strong class="text-white">{{ submission?.student?.name }}</strong> ({{ submission?.student?.email }})
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="assignmentsStore.loading && !submission" class="py-20 flex justify-center">
      <LoadingSpinner text="Loading submission recording and rubric sheet..." />
    </div>

    <div v-else-if="submission" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Left Column: Media Player & Submission Details -->
      <div class="lg:col-span-6 space-y-6">
        <!-- Media Player Container -->
        <div class="glass p-5 rounded-2xl space-y-4 border-brass-400/20">
          <div class="flex justify-between items-center text-xs text-ink-400 border-b border-white/10 pb-3">
            <span class="font-semibold text-white">Student Performance Recording</span>
            <span class="font-mono text-[11px]">{{ submission.original_filename }}</span>
          </div>

          <!-- Video Player -->
          <div v-if="submission.media_type === 'video'" class="rounded-xl overflow-hidden bg-black aspect-video relative flex items-center justify-center">
            <video
              v-if="streamUrl"
              :src="streamUrl"
              controls
              class="w-full h-full object-contain"
              preload="metadata"
            >
              Your browser does not support HTML5 video playback.
            </video>
          </div>

          <!-- Audio Player -->
          <div v-else class="p-8 rounded-xl bg-ink-950 flex flex-col items-center justify-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-brass-500/10 border border-brass-400/30 flex items-center justify-center text-brass-300 animate-pulse">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <audio
              v-if="streamUrl"
              :src="streamUrl"
              controls
              class="w-full max-w-md"
            ></audio>
          </div>
        </div>

        <!-- Student Performance Notes -->
        <div v-if="submission.student_notes" class="glass p-5 rounded-2xl space-y-2">
          <h4 class="text-xs font-bold text-brass-300 uppercase tracking-wider">
            Student Submission Notes
          </h4>
          <p class="text-xs text-ink-200 leading-relaxed bg-ink-950/60 p-4 rounded-xl border border-white/5">
            {{ submission.student_notes }}
          </p>
        </div>

        <!-- Assignment Requirements Reference -->
        <div class="glass p-5 rounded-2xl space-y-2">
          <h4 class="text-xs font-bold text-ink-400 uppercase tracking-wider">
            Assignment Instructions & Prompts
          </h4>
          <div class="text-xs text-ink-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line pr-2">
            {{ submission.assignment?.instructions }}
          </div>
        </div>
      </div>

      <!-- Right Column: Interactive Rubric Scoring & Feedback -->
      <div class="lg:col-span-6 space-y-6">
        <!-- Live Score Summary Card -->
        <div class="glass p-6 rounded-2xl border-brass-400/40 space-y-4 sticky top-6 z-10 bg-ink-950/90 backdrop-blur-md">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span class="text-xs text-ink-400 uppercase tracking-wider block font-semibold">Evaluated Score</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-display font-bold font-mono" :class="scoreBreakdown.passed ? 'text-emerald-400' : 'text-danger-400'">
                  {{ scoreBreakdown.percent }}%
                </span>
                <span class="text-xs font-mono text-ink-400">
                  ({{ scoreBreakdown.earned }} / {{ scoreBreakdown.possible }} pts)
                </span>
              </div>
            </div>

            <div class="text-right">
              <span
                :class="[
                  'badge text-xs font-bold uppercase',
                  scoreBreakdown.passed ? 'badge-success' : 'badge-danger'
                ]"
              >
                {{ scoreBreakdown.passed ? 'Meets Pass Standard' : 'Revision Required' }}
              </span>
              <p class="text-[10px] text-ink-400 mt-1">
                Pass mark threshold: {{ passMark }}%
              </p>
            </div>
          </div>

          <!-- Interactive Rubric Criteria -->
          <div v-if="rubric" class="space-y-4 max-h-[460px] overflow-y-auto pr-2">
            <div
              v-for="crit in rubric.criteria"
              :key="crit.id"
              class="p-4 rounded-xl bg-ink-900/90 border border-white/5 space-y-3"
            >
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-white">{{ crit.title }}</span>
                <span class="font-mono text-brass-400 font-semibold text-[11px]">
                  Max {{ crit.max_points }} pts
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="lvl in crit.levels"
                  :key="lvl.id"
                  type="button"
                  @click="selectLevel(crit.id, lvl.id)"
                  :class="[
                    'p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col justify-between',
                    selectedLevels[crit.id] === lvl.id
                      ? 'bg-brass-500/20 border-brass-400 text-white shadow-md'
                      : 'bg-ink-950/60 border-white/5 text-ink-400 hover:text-white hover:bg-white/5'
                  ]"
                >
                  <span class="font-semibold text-[11px] leading-tight block">{{ lvl.title }}</span>
                  <span class="font-mono text-[10px] text-brass-300 mt-1 block">{{ lvl.points }} pts</span>
                </button>
              </div>

              <!-- Optional Criterion Note -->
              <div>
                <input
                  v-model="criterionComments[crit.id]"
                  type="text"
                  placeholder="Optional note for this criterion..."
                  class="field-input text-[11px] py-1.5"
                  :disabled="isGrading"
                />
              </div>
            </div>
          </div>

          <!-- Written Constructive Feedback -->
          <div class="space-y-1.5 pt-2 border-t border-white/10">
            <label class="field-label" for="feedback">
              Overall Constructive Feedback <span class="text-danger-400">*</span>
            </label>
            <textarea
              id="feedback"
              v-model="generalFeedback"
              rows="4"
              placeholder="Provide constructive assessment comments, technical praise, and practice recommendations..."
              class="field-input text-xs"
              :disabled="isGrading"
            ></textarea>
          </div>

          <div v-if="gradeError" class="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-300">
            {{ gradeError }}
          </div>

          <div v-if="gradeSuccess" class="p-3 rounded-lg bg-success-500/10 border border-success-500/20 text-xs text-success-300">
            {{ gradeSuccess }}
          </div>

          <!-- Submit Grade Action -->
          <button
            @click="handleGradeSubmit"
            :disabled="isGrading || !rubric"
            class="w-full btn btn-primary text-xs font-bold py-3 shadow-lg"
          >
            <span v-if="isGrading">Submitting Evaluation...</span>
            <span v-else>
              Finalize Evaluation ({{ scoreBreakdown.percent }}% • {{ scoreBreakdown.passed ? 'Pass' : 'Request Revision' }})
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
