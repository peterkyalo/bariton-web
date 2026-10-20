<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamsStore } from '@/stores/exams'
import { useOrdersStore } from '@/stores/orders'
import ChunkedUploader from '@/components/ui/ChunkedUploader.vue'

const route = useRoute()
const router = useRouter()
const examsStore = useExamsStore()
const ordersStore = useOrdersStore()

const courseSlug = computed(() => route.params.slug)
const autoSaveTimeout = ref(null)
const timerInterval = ref(null)
const remainingSeconds = ref(0)
const submitModalOpen = ref(false)
const retakePurchasing = ref(false)

// Student input state keyed by question UUID
const studentAnswers = ref({})

onMounted(async () => {
  await loadExamData()
})

onUnmounted(() => {
  clearInterval(timerInterval.value)
  clearTimeout(autoSaveTimeout.value)
})

async function loadExamData() {
  const data = await examsStore.fetchCourseExam(courseSlug.value)
  if (data?.eligibility?.active_attempt) {
    initAttempt(data.eligibility.active_attempt)
  }
}

function initAttempt(attempt) {
  examsStore.activeAttempt = attempt
  remainingSeconds.value = attempt.remaining_seconds || 0

  // Populate local answer state from attempt
  if (examsStore.questions?.length) {
    examsStore.questions.forEach((q) => {
      studentAnswers.value[q.uuid] = {
        question_uuid: q.uuid,
        selected_option: q.user_answer?.selected_option || '',
        text_answer: q.user_answer?.text_answer || '',
        media_path: q.user_answer?.media_path || '',
      }
    })
  }

  startCountdown()
}

function startCountdown() {
  clearInterval(timerInterval.value)
  timerInterval.value = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
    } else if (examsStore.activeAttempt?.status === 'in_progress') {
      clearInterval(timerInterval.value)
      // Auto-submit on timer expiry
      handleAutoSubmit()
    }
  }, 1000)
}

const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

async function handleStart() {
  if (!examsStore.examInfo?.exam?.uuid) return
  try {
    const data = await examsStore.startExam(examsStore.examInfo.exam.uuid)
    initAttempt(data.attempt)
  } catch (err) {
    console.error('Failed to start exam:', err)
  }
}

function queueDebouncedAutoSave() {
  clearTimeout(autoSaveTimeout.value)
  autoSaveTimeout.value = setTimeout(async () => {
    if (!examsStore.activeAttempt?.uuid || examsStore.activeAttempt.status !== 'in_progress') return
    const payload = Object.values(studentAnswers.value)
    await examsStore.saveAnswers(examsStore.activeAttempt.uuid, payload)
  }, 800)
}

function onOptionChange(questionUuid, optionId) {
  if (!studentAnswers.value[questionUuid]) {
    studentAnswers.value[questionUuid] = { question_uuid: questionUuid }
  }
  studentAnswers.value[questionUuid].selected_option = optionId
  queueDebouncedAutoSave()
}

function onTheoryTextChange(questionUuid, text) {
  if (!studentAnswers.value[questionUuid]) {
    studentAnswers.value[questionUuid] = { question_uuid: questionUuid }
  }
  studentAnswers.value[questionUuid].text_answer = text
  queueDebouncedAutoSave()
}

async function handleStopRecordingTimer(questionUuid) {
  if (!examsStore.activeAttempt?.uuid) return
  const current = studentAnswers.value[questionUuid]
  const res = await examsStore.stopRecording(examsStore.activeAttempt.uuid, {
    question_uuid: questionUuid,
    media_path: current?.media_path,
    media_mime: 'video/mp4',
  })
  remainingSeconds.value = res.attempt.remaining_seconds || 900
}

function onPerformanceUploadComplete(questionUuid, fileData) {
  if (!studentAnswers.value[questionUuid]) {
    studentAnswers.value[questionUuid] = { question_uuid: questionUuid }
  }
  studentAnswers.value[questionUuid].media_path = fileData.file_path
  queueDebouncedAutoSave()
}

async function handleAutoSubmit() {
  if (!examsStore.activeAttempt?.uuid) return
  await examsStore.submitExam(examsStore.activeAttempt.uuid, {
    answers: Object.values(studentAnswers.value),
  })
  await loadExamData()
}

async function confirmManualSubmit() {
  submitModalOpen.value = false
  clearInterval(timerInterval.value)
  if (!examsStore.activeAttempt?.uuid) return
  await examsStore.submitExam(examsStore.activeAttempt.uuid, {
    answers: Object.values(studentAnswers.value),
  })
  await loadExamData()
}

async function buyRetakePackage() {
  retakePurchasing.value = true
  try {
    const courseId = examsStore.examInfo?.course?.id || examsStore.examInfo?.eligibility?.enrollment?.course_id
    const orderRes = await ordersStore.createOrder({
      item_type: 'exam_retake_package',
      item_id: courseId,
    })
    router.push({ name: 'checkout', query: { order: orderRes.order.uuid } })
  } catch (err) {
    console.error('Failed to initiate retake package purchase:', err)
  } finally {
    retakePurchasing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Breadcrumb / Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <button
            @click="router.back()"
            class="text-xs uppercase tracking-wider text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1.5 transition mb-1"
          >
            ← Back to Syllabus
          </button>
          <h1 class="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>{{ examsStore.examInfo?.exam?.title || 'Course Final Examination' }}</span>
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            Conservatory Assessment & Credential Certification • {{ examsStore.examInfo?.course?.title }}
          </p>
        </div>

        <div v-if="examsStore.activeAttempt?.status === 'in_progress'" class="text-right">
          <div
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border"
            :class="remainingSeconds < 300 ? 'bg-red-950/60 border-red-500/50 text-red-400 animate-pulse' : 'bg-slate-900 border-amber-500/40 text-amber-400'"
          >
            <span class="text-xs uppercase tracking-wider font-semibold">Time Remaining:</span>
            <span class="font-mono text-xl font-black">{{ formattedTime }}</span>
          </div>
          <div v-if="examsStore.autoSaveStatus" class="text-xs text-slate-400 mt-1">
            {{ examsStore.autoSaveStatus }}
          </div>
        </div>
      </div>

      <!-- Grace Period Alert -->
      <div
        v-if="examsStore.activeAttempt?.is_grace_period && examsStore.activeAttempt.status === 'in_progress'"
        class="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3"
      >
        <span class="text-amber-400 text-xl font-bold">⏱</span>
        <div>
          <h4 class="font-bold text-amber-300 text-sm">Performance Recording Upload Grace Period</h4>
          <p class="text-xs text-slate-300 mt-0.5">
            Your examination timer was paused upon recital capture. You have an active 15-minute grace period to upload your performance recording and submit.
          </p>
        </div>
      </div>

      <!-- State 1: Exam Overview & Eligibility (Before Start) -->
      <div
        v-if="!examsStore.activeAttempt || examsStore.activeAttempt.status !== 'in_progress'"
        class="space-y-6"
      >
        <!-- Graded Result Card -->
        <div
          v-if="examsStore.examInfo?.certificate || examsStore.examInfo?.past_attempts?.some(a => a.passed)"
          class="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl p-8 text-center space-y-4"
        >
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl font-black">
            ✓
          </div>
          <h2 class="text-2xl font-black text-white">Examination Passed with Distinction!</h2>
          <p class="text-sm text-slate-300 max-w-xl mx-auto">
            Congratulations! You have satisfied all conservatory examination criteria and earned your official Bariton Music Academy Certificate of Mastery.
          </p>
          <div v-if="examsStore.examInfo?.certificate" class="pt-2 flex justify-center gap-4">
            <button
              @click="examsStore.downloadCertificate(examsStore.examInfo.certificate.uuid)"
              class="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold hover:brightness-110 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              Download Certificate (PDF)
            </button>
            <router-link
              :to="{ name: 'certificate.verify', params: { code: examsStore.examInfo.certificate.certificate_code } }"
              class="px-5 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-bold transition flex items-center gap-2"
            >
              Verify Credential Online
            </router-link>
          </div>
        </div>

        <!-- In-Review / Grading Pending Card -->
        <div
          v-else-if="examsStore.activeAttempt?.status === 'grading' || examsStore.examInfo?.past_attempts?.some(a => a.status === 'grading')"
          class="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-8 text-center space-y-4"
        >
          <div class="text-amber-400 text-4xl">⏳</div>
          <h3 class="text-xl font-bold text-white">Examination Submitted & Awaiting Faculty Review</h3>
          <p class="text-sm text-slate-300 max-w-lg mx-auto">
            Your multiple-choice responses have been processed. Your written theory analysis and recorded recital are currently being evaluated by the lead conservatory instructor with the assessment rubric.
          </p>
        </div>

        <!-- Exam Overview Card -->
        <div class="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-800">
            <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Duration</span>
              <span class="text-lg font-bold text-white mt-1 block">{{ examsStore.examInfo?.exam?.duration_minutes }} Minutes</span>
            </div>
            <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Questions</span>
              <span class="text-lg font-bold text-white mt-1 block">{{ examsStore.examInfo?.exam?.questions_count }} Assessment Tasks</span>
            </div>
            <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Pass Mark</span>
              <span class="text-lg font-bold text-emerald-400 mt-1 block">{{ examsStore.examInfo?.exam?.pass_mark_percent }}%</span>
            </div>
            <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Attempts Allowed</span>
              <span class="text-lg font-bold text-amber-400 mt-1 block">
                {{ examsStore.examInfo?.eligibility?.attempts_used || 0 }} / {{ examsStore.examInfo?.eligibility?.attempt_limit || 3 }}
              </span>
            </div>
          </div>

          <div>
            <h3 class="text-base font-bold text-white mb-2">Examination Instructions</h3>
            <div class="prose prose-invert text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {{ examsStore.examInfo?.exam?.instructions }}
            </div>
          </div>

          <!-- Eligibility Blocking: Limit Reached / Buy Retake Package -->
          <div
            v-if="examsStore.examInfo?.eligibility?.limit_reached"
            class="bg-red-950/30 border border-red-500/40 rounded-xl p-6 text-center space-y-3"
          >
            <h4 class="text-base font-bold text-red-400">Attempt Limit Reached (3 of 3 Failed)</h4>
            <p class="text-xs text-slate-300 max-w-md mx-auto">
              You have exhausted all 3 examination attempts allocated to this enrollment. To unlock an additional set of 3 attempts, purchase an Exam Retake Package.
            </p>
            <button
              @click="buyRetakePackage"
              :disabled="retakePurchasing"
              class="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {{ retakePurchasing ? 'Initiating Checkout...' : 'Purchase Retake Package (KES 5,000)' }}
            </button>
          </div>

          <!-- Eligibility Blocking: Cooling Off Wait Period -->
          <div
            v-else-if="examsStore.examInfo?.eligibility?.cooling_off"
            class="bg-amber-950/30 border border-amber-500/40 rounded-xl p-6 text-center space-y-2"
          >
            <h4 class="text-base font-bold text-amber-400">Mandatory Cooling-Off Study Period Active</h4>
            <p class="text-xs text-slate-300 max-w-md mx-auto">
              {{ examsStore.examInfo.eligibility.reason }}
            </p>
          </div>

          <!-- Start Attempt Button -->
          <div
            v-else-if="examsStore.examInfo?.eligibility?.allowed && !examsStore.examInfo?.past_attempts?.some(a => a.passed)"
            class="pt-4 flex justify-end"
          >
            <button
              @click="handleStart"
              class="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-base hover:brightness-110 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              Begin Examination Now →
            </button>
          </div>
        </div>
      </div>

      <!-- State 2: Active Exam In-Progress Tasks -->
      <div v-else class="space-y-8">
        <div
          v-for="(q, idx) in examsStore.questions"
          :key="q.uuid"
          class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <!-- Task Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <span class="text-xs uppercase tracking-wider font-bold text-amber-500">
              Task {{ idx + 1 }} of {{ examsStore.questions.length }} • {{ q.question_type.replace('_', ' ') }}
            </span>
            <span class="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300">
              {{ q.points }} Points
            </span>
          </div>

          <!-- Prompt -->
          <p class="text-base font-medium text-slate-100 whitespace-pre-line leading-relaxed">
            {{ q.prompt }}
          </p>

          <!-- Type A: Multiple Choice -->
          <div v-if="q.question_type === 'multiple_choice'" class="space-y-3 pt-2">
            <label
              v-for="opt in q.options"
              :key="opt.id"
              class="flex items-center gap-3.5 p-4 rounded-xl border transition cursor-pointer"
              :class="studentAnswers[q.uuid]?.selected_option === opt.id
                ? 'bg-amber-500/10 border-amber-500 text-white'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700'"
            >
              <input
                type="radio"
                :name="`question_${q.uuid}`"
                :value="opt.id"
                :checked="studentAnswers[q.uuid]?.selected_option === opt.id"
                @change="onOptionChange(q.uuid, opt.id)"
                class="w-4 h-4 text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500"
              />
              <span class="text-sm font-medium">{{ opt.text }}</span>
            </label>
          </div>

          <!-- Type B: Theory (Debounced text area) -->
          <div v-else-if="q.question_type === 'theory'" class="space-y-2 pt-2">
            <textarea
              v-model="studentAnswers[q.uuid].text_answer"
              @input="onTheoryTextChange(q.uuid, $event.target.value)"
              rows="6"
              placeholder="Type your comprehensive written answer here. Changes are automatically saved..."
              class="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:border-amber-500 focus:outline-none transition resize-y font-mono"
            ></textarea>
            <div class="text-xs text-slate-500 text-right">
              Auto-saves continuously while you write
            </div>
          </div>

          <!-- Type C: Recorded Performance Recital -->
          <div v-else-if="q.question_type === 'recorded_performance'" class="space-y-4 pt-2">
            <div class="flex items-center justify-between bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div>
                <h5 class="text-sm font-bold text-white">Continuous Video Recital</h5>
                <p class="text-xs text-slate-400 mt-0.5">
                  Ensure hands, posture, and keyboard are visible in your recording.
                </p>
              </div>
              <button
                v-if="!examsStore.activeAttempt?.is_grace_period"
                @click="handleStopRecordingTimer(q.uuid)"
                class="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition cursor-pointer"
              >
                Pause Timer to Upload (15-Min Grace)
              </button>
            </div>

            <!-- Chunked Uploader -->
            <ChunkedUploader
              label="Select or Drag Performance Recording (MP4/WebM up to 200MB)"
              @uploaded="(data) => onPerformanceUploadComplete(q.uuid, data)"
            />

            <div v-if="studentAnswers[q.uuid]?.media_path" class="text-xs text-emerald-400 font-semibold">
              ✓ Performance recording file attached and saved.
            </div>
          </div>
        </div>

        <!-- Submit Button Bar -->
        <div class="flex items-center justify-between pt-6 border-t border-slate-800">
          <div class="text-xs text-slate-400">
            Please review all answers before submitting. Multiple choice tasks are graded instantly.
          </div>
          <button
            @click="submitModalOpen = true"
            class="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            Submit Examination Final
          </button>
        </div>
      </div>

      <!-- Submission Confirmation Modal -->
      <div
        v-if="submitModalOpen"
        class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5">
          <h3 class="text-xl font-bold text-white">Confirm Examination Submission</h3>
          <p class="text-sm text-slate-300 leading-relaxed">
            Are you sure you are ready to submit your final examination? Once submitted, your answers will be locked and sent for faculty rubric evaluation.
          </p>
          <div class="flex justify-end gap-3 pt-3">
            <button
              @click="submitModalOpen = false"
              class="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
            >
              Continue Working
            </button>
            <button
              @click="confirmManualSubmit"
              class="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition shadow"
            >
              Confirm & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
