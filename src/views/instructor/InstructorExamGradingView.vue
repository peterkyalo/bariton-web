<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamsStore } from '@/stores/exams'

const route = useRoute()
const router = useRouter()
const examsStore = useExamsStore()

const attemptUuid = computed(() => route.params.uuid)
const overallFeedback = ref('')
const evaluations = ref({})
const submitting = ref(false)

onMounted(async () => {
  const data = await examsStore.fetchExamGradingDetail(attemptUuid.value)
  if (data?.attempt?.overall_feedback) {
    overallFeedback.value = data.attempt.overall_feedback
  }

  // Initialize evaluation state for manual grading questions
  if (data?.questions?.length) {
    data.questions.forEach((q) => {
      if (q.question_type !== 'multiple_choice' && q.answer) {
        evaluations.value[q.answer.uuid] = {
          answer_uuid: q.answer.uuid,
          score_awarded: q.answer.score_awarded ?? null,
          feedback: q.answer.feedback || '',
          rubric_scores: q.answer.rubric_scores || [],
        }
      }
    })
  }
})

// Calculate live total score
const calculatedTotalScore = computed(() => {
  if (!examsStore.currentAttemptToGrade?.questions) return 0
  let total = 0
  examsStore.currentAttemptToGrade.questions.forEach((q) => {
    if (q.question_type === 'multiple_choice') {
      total += Number(q.answer?.score_awarded || 0)
    } else if (q.answer && evaluations.value[q.answer.uuid]) {
      total += Number(evaluations.value[q.answer.uuid].score_awarded || 0)
    }
  })
  return total
})

const maxPossibleScore = computed(() => {
  if (!examsStore.currentAttemptToGrade?.questions) return 100
  return examsStore.currentAttemptToGrade.questions.reduce((sum, q) => sum + Number(q.points || 0), 0)
})

const calculatedPercent = computed(() => {
  if (maxPossibleScore.value === 0) return 0
  return Math.round((calculatedTotalScore.value / maxPossibleScore.value) * 100)
})

const willPass = computed(() => {
  const passMark = examsStore.currentAttemptToGrade?.attempt?.exam_pass_mark_percent || 70
  return calculatedPercent.value >= passMark
})

function selectRubricLevel(answerUuid, criterionId, level) {
  if (!evaluations.value[answerUuid]) return
  const currentScores = evaluations.value[answerUuid].rubric_scores || []
  const existingIdx = currentScores.findIndex((s) => s.rubric_criterion_id === criterionId)

  const newScore = {
    rubric_criterion_id: criterionId,
    rubric_level_id: level.id,
    points: level.points,
    comments: level.title,
  }

  if (existingIdx >= 0) {
    currentScores[existingIdx] = newScore
  } else {
    currentScores.push(newScore)
  }

  evaluations.value[answerUuid].rubric_scores = currentScores

  // Automatically update score_awarded from rubric levels sum
  const sum = currentScores.reduce((acc, curr) => acc + Number(curr.points || 0), 0)
  evaluations.value[answerUuid].score_awarded = sum
}

async function submitGrade() {
  submitting.value = true
  try {
    const payload = {
      evaluations: Object.values(evaluations.value),
      overall_feedback: overallFeedback.value,
    }
    await examsStore.gradeExamAttempt(attemptUuid.value, payload)
    router.push({ name: 'instructor.exam-grading' })
  } catch (err) {
    console.error('Failed to submit grades:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <button
          @click="router.back()"
          class="text-xs uppercase tracking-wider text-amber-500 hover:text-amber-400 font-semibold mb-1 cursor-pointer"
        >
          ← Back to Grading Queue
        </button>
        <h1 class="text-2xl font-black text-white tracking-tight">
          Exam Grading Studio • {{ examsStore.currentAttemptToGrade?.student?.name }}
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          {{ examsStore.currentAttemptToGrade?.course?.title }} • Attempt #{{ examsStore.currentAttemptToGrade?.attempt?.attempt_number }}
        </p>
      </div>

      <!-- Live Score Badge -->
      <div class="text-right bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl shadow-lg">
        <div class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Projected Score</div>
        <div class="text-2xl font-black flex items-center justify-end gap-2 mt-0.5" :class="willPass ? 'text-emerald-400' : 'text-red-400'">
          <span>{{ calculatedTotalScore }} / {{ maxPossibleScore }}</span>
          <span class="text-sm font-bold">({{ calculatedPercent }}%)</span>
        </div>
        <div class="text-[11px] font-bold uppercase tracking-wider" :class="willPass ? 'text-emerald-500' : 'text-red-500'">
          {{ willPass ? 'Passing Score (Pass mark: 70%)' : 'Failing Score' }}
        </div>
      </div>
    </div>

    <!-- Questions Evaluation Stack -->
    <div v-if="examsStore.loading" class="text-center py-16 text-slate-400">
      Loading student attempt...
    </div>

    <div v-else class="space-y-8">
      <div
        v-for="(q, idx) in examsStore.currentAttemptToGrade?.questions"
        :key="q.uuid"
        class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <!-- Task Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span class="text-xs uppercase tracking-widest font-extrabold text-amber-500">
              Question {{ idx + 1 }} • {{ q.question_type.replace('_', ' ') }}
            </span>
            <h3 class="text-base font-bold text-white mt-1">{{ q.prompt }}</h3>
          </div>
          <span class="text-xs font-bold px-3 py-1 rounded bg-slate-800 text-slate-300">
            Max: {{ q.points }} pts
          </span>
        </div>

        <!-- Multiple Choice Review -->
        <div v-if="q.question_type === 'multiple_choice'" class="space-y-3">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate Response:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="opt in q.options"
              :key="opt.id"
              class="p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between"
              :class="{
                'bg-emerald-950/40 border-emerald-500/50 text-emerald-300': opt.id === q.correct_answer,
                'bg-red-950/40 border-red-500/50 text-red-300': q.answer?.selected_option === opt.id && opt.id !== q.correct_answer,
                'bg-slate-950/40 border-slate-800/80 text-slate-400': opt.id !== q.correct_answer && q.answer?.selected_option !== opt.id,
              }"
            >
              <span>{{ opt.text }}</span>
              <span v-if="q.answer?.selected_option === opt.id" class="text-xs font-bold px-2 py-0.5 rounded bg-black/40">
                Selected
              </span>
            </div>
          </div>
          <div class="text-xs text-slate-400">
            Auto-graded: <span class="font-bold text-white">{{ q.answer?.score_awarded }}</span> / {{ q.points }} points awarded.
          </div>
        </div>

        <!-- Theory Answer Review -->
        <div v-else-if="q.question_type === 'theory'" class="space-y-4">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Student Written Analysis:</div>
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
            {{ q.answer?.text_answer || '(No answer provided)' }}
          </div>

          <!-- Scoring Input -->
          <div v-if="q.answer" class="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80">
            <div class="sm:col-span-1">
              <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Points Awarded</label>
              <input
                v-model.number="evaluations[q.answer.uuid].score_awarded"
                type="number"
                min="0"
                :max="q.points"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div class="sm:col-span-3">
              <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Feedback to Student</label>
              <input
                v-model="evaluations[q.answer.uuid].feedback"
                type="text"
                placeholder="Specific commentary on anatomical accuracy and contrapuntal analysis..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Recorded Performance Review -->
        <div v-else-if="q.question_type === 'recorded_performance'" class="space-y-6">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Student Recital Video:</div>

          <!-- Media Player -->
          <div v-if="q.answer?.media_stream_url" class="rounded-xl overflow-hidden bg-black border border-slate-800 max-w-2xl">
            <video
              :src="q.answer.media_stream_url"
              controls
              class="w-full h-auto max-h-[380px]"
            ></video>
          </div>
          <div v-else class="text-xs text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
            No video playback URL or submission recording attached.
          </div>

          <!-- Rubric Evaluation Buttons -->
          <div v-if="q.rubric && q.answer" class="space-y-4 pt-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-amber-400">
              Rubric Assessment: {{ q.rubric.title }}
            </h4>
            <div
              v-for="crit in q.rubric.criteria"
              :key="crit.id"
              class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="text-sm font-bold text-white">{{ crit.title }}</h5>
                  <p class="text-xs text-slate-400">{{ crit.description }}</p>
                </div>
                <span class="text-xs font-semibold text-slate-400">Max: {{ crit.max_points }} pts</span>
              </div>

              <!-- Level options buttons -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  v-for="lvl in crit.levels"
                  :key="lvl.id"
                  type="button"
                  @click="selectRubricLevel(q.answer.uuid, crit.id, lvl)"
                  class="p-2.5 rounded-lg border text-left text-xs transition cursor-pointer"
                  :class="evaluations[q.answer.uuid]?.rubric_scores?.some(s => s.rubric_criterion_id === crit.id && s.rubric_level_id === lvl.id)
                    ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'"
                >
                  <div class="font-bold">{{ lvl.title }}</div>
                  <div class="text-[11px] opacity-80 mt-0.5">{{ lvl.points }} pts</div>
                </button>
              </div>
            </div>

            <!-- Performance Score & Feedback -->
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div class="sm:col-span-1">
                <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Performance Score</label>
                <input
                  v-model.number="evaluations[q.answer.uuid].score_awarded"
                  type="number"
                  min="0"
                  :max="q.points"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div class="sm:col-span-3">
                <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Performance Written Critique</label>
                <input
                  v-model="evaluations[q.answer.uuid].feedback"
                  type="text"
                  placeholder="Critique on tempo stability, dynamic shading, and hand arch posture..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Feedback & Action -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <h3 class="text-base font-bold text-white">Overall Faculty Commentary</h3>
        <textarea
          v-model="overallFeedback"
          rows="3"
          placeholder="Comprehensive commentary displayed to student on final grading release..."
          class="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:border-amber-500 focus:outline-none transition resize-y"
        ></textarea>

        <div class="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <div class="text-xs text-slate-400">
            Releasing grades will finalize the exam and automatically generate a verified Certificate of Mastery if passing criteria are satisfied.
          </div>
          <button
            @click="submitGrade"
            :disabled="submitting"
            class="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
          >
            {{ submitting ? 'Releasing Grades...' : 'Release Final Grades →' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
