<template>
  <div class="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between">
      <router-link
        to="/instructor/courses"
        class="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-gold-400 transition-colors"
      >
        &larr; Back to My Courses
      </router-link>
      <router-link
        v-if="course && auth.can('courses.manage-all')"
        :to="`/admin/courses/${course.id}/edit`"
        class="text-xs text-gold-400 hover:underline"
      >
        Course settings &rarr;
      </router-link>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <LoadingSpinner text="Loading curriculum..." />
    </div>

    <div v-else-if="loadError" class="card p-8 text-center rounded-2xl bg-navy-900/70 border border-slate-800">
      <p class="text-sm text-red-400">{{ loadError }}</p>
    </div>

    <template v-else-if="course">
      <!-- Course header -->
      <div class="card p-6 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <span :class="['badge text-xs uppercase font-bold', course.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400']">
            {{ course.status }}
          </span>
          <span class="text-xs text-slate-400">{{ course.modules?.length || 0 }} modules · {{ totalLessons }} lessons</span>
        </div>
        <h1 class="text-2xl font-serif font-bold text-white">{{ course.title }}</h1>
        <p class="text-sm text-slate-400">{{ course.short_description || course.description }}</p>

        <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
          <label class="text-xs text-slate-300 font-semibold uppercase tracking-wider">Publication status</label>
          <select
            v-model="statusDraft"
            id="course-status-select"
            class="px-3 py-1.5 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
          >
            <option value="draft">Draft (Private)</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button
            v-if="statusDraft !== course.status"
            id="save-course-status"
            class="btn btn-primary text-xs font-bold"
            :disabled="savingStatus"
            @click="saveStatus"
          >
            Save status
          </button>
        </div>
      </div>

      <!-- Modules -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-serif font-bold text-white">Modules &amp; Lessons</h2>
          <p class="text-xs text-slate-400">Build levels, video masterclasses, audio tracks and sheet music.</p>
        </div>
        <button id="add-module-btn" class="btn btn-secondary text-xs font-bold" @click="openModuleModal()">
          + Add Module
        </button>
      </div>

      <div v-if="!course.modules?.length" class="card p-10 text-center bg-navy-900/60 border border-slate-800 rounded-2xl">
        <p class="text-sm text-slate-400">No modules yet. Add a Beginner, Intermediate or Advanced module to get started.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="module in course.modules"
          :key="module.id"
          class="card p-5 rounded-2xl bg-navy-900/70 border border-slate-800 space-y-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span class="badge badge-gold text-[10px] font-bold uppercase tracking-wider mr-2">{{ module.level }}</span>
              <strong class="text-white text-base font-serif">{{ module.title }}</strong>
              <span class="text-xs text-slate-400 block mt-0.5">
                KES {{ module.price_formatted }} (${{ module.price_usd_formatted }} USD)
              </span>
              <p v-if="module.description" class="text-xs text-slate-500 mt-1">{{ module.description }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button class="btn btn-secondary text-xs py-1.5 px-3" @click="openLessonModal(module)">+ Add Lesson</button>
              <button class="text-xs text-gold-400 hover:text-gold-300 px-2 py-1" @click="openModuleModal(module)">Edit</button>
              <button class="text-xs text-red-400 hover:text-red-300 px-2 py-1" @click="removeModule(module)">Delete</button>
            </div>
          </div>

          <div class="space-y-2 pt-2 border-t border-slate-800/80">
            <p v-if="!module.lessons?.length" class="text-xs text-slate-500">No lessons in this module yet.</p>
            <div
              v-for="lesson in module.lessons"
              :key="lesson.id"
              class="flex items-center justify-between p-2.5 rounded-xl bg-navy-950/60 border border-slate-800 text-xs"
            >
              <div class="flex items-center gap-2 truncate">
                <span :class="['font-bold uppercase font-mono text-[10px] px-2 py-0.5 rounded', formatBadgeClass(lesson.type)]">
                  {{ formatTypeLabel(lesson.type) }}
                </span>
                <span class="text-white font-medium truncate">{{ lesson.title }}</span>
                <span v-if="lesson.file_name" class="text-slate-500 truncate">· {{ lesson.file_name }}</span>
                <span v-else-if="lesson.youtube_video_id" class="text-slate-500 truncate">· ID: {{ lesson.youtube_video_id }}</span>
                <span v-else-if="lesson.content" class="text-slate-500 truncate">· {{ estimateReadingTime(lesson.content).words }} words</span>
                <span v-if="lesson.is_preview" class="text-[10px] text-emerald-400 font-bold ml-1">(Free Preview)</span>
              </div>
              <div class="flex items-center gap-3 ml-3 shrink-0">
                <button class="text-gold-400 hover:text-gold-300" @click="openLessonModal(module, lesson)">Edit</button>
                <button class="text-red-400 hover:text-red-300" @click="removeLesson(lesson)">Remove</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Module modal -->
    <Modal :open="showModuleModal" :title="moduleEditId ? 'Edit Module' : 'Add Module'" @close="showModuleModal = false">
      <form class="space-y-4" @submit.prevent="submitModule">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Module Title *</label>
          <input id="module-title" v-model="moduleForm.title" type="text" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Level *</label>
            <select id="module-level" v-model="moduleForm.level" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Price (KES) *</label>
            <input id="module-price" v-model.number="moduleForm.priceMajor" type="number" min="0" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
          <textarea id="module-description" v-model="moduleForm.description" rows="2" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"></textarea>
        </div>
        <p v-if="moduleError" class="text-xs text-red-400">{{ moduleError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-secondary text-xs" @click="showModuleModal = false">Cancel</button>
          <button id="save-module-btn" type="submit" class="btn btn-primary text-xs font-bold" :disabled="saving">
            {{ moduleEditId ? 'Save Module' : 'Add Module' }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Lesson modal -->
    <Modal :open="showLessonModal" :title="lessonEditId ? 'Edit Lesson' : 'Add Lesson'" :max-width="lessonForm.type === 'richtext' ? 'max-w-4xl' : 'max-w-2xl'" @close="showLessonModal = false">
      <form class="space-y-4" @submit.prevent="submitLesson">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Lesson Title *</label>
          <input id="lesson-title" v-model="lessonForm.title" type="text" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Learning Material Format *</label>
            <select id="lesson-type" v-model="lessonForm.type" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white">
              <option value="youtube">YouTube Masterclass Video</option>
              <option value="richtext">Rich Text / Article & Notation Guide</option>
              <option value="audio">Guided Audio (MP3/WAV)</option>
              <option value="pdf">Sheet Music / PDF Score</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Estimated Duration (secs)</label>
            <input id="lesson-duration" v-model.number="lessonForm.duration_seconds" type="number" min="0" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Brief Summary / Objectives</label>
          <textarea id="lesson-summary" v-model="lessonForm.summary" rows="2" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" placeholder="Key learning outcomes for this lesson..."></textarea>
        </div>

        <!-- 1. YouTube Video ID / Link -->
        <div v-if="lessonForm.type === 'youtube'" class="space-y-2">
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">YouTube Video ID or Full URL *</label>
          <input
            id="lesson-youtube"
            v-model="lessonForm.youtube_video_id"
            type="text"
            required
            class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white font-mono"
            placeholder="e.g. Mh4f9AYRCZY or https://www.youtube.com/watch?v=Mh4f9AYRCZY"
          />
          <div v-if="extractedYoutubeId" class="flex items-center gap-3 p-2.5 rounded-xl bg-navy-900 border border-slate-800">
            <img :src="getYouTubeThumbnail(extractedYoutubeId)" class="w-24 h-14 object-cover rounded-lg border border-slate-700" alt="Video thumbnail" />
            <div class="text-xs space-y-0.5">
              <span class="text-emerald-400 font-bold flex items-center gap-1.5">
                <span>✓ Valid Video ID:</span>
                <code class="px-1.5 py-0.5 rounded bg-navy-950 text-white font-mono">{{ extractedYoutubeId }}</code>
              </span>
              <a :href="`https://www.youtube.com/watch?v=${extractedYoutubeId}`" target="_blank" rel="noopener noreferrer" class="text-gold-400 hover:underline block text-[11px]">
                Verify on YouTube &rarr;
              </a>
            </div>
          </div>
        </div>

        <!-- 2. Rich Text Editor -->
        <div v-else-if="lessonForm.type === 'richtext'" class="space-y-2">
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
            Learning Material Content (Rich Text Editor) *
          </label>
          <RichTextEditor
            v-model="lessonForm.content"
            placeholder="Compose detailed instructional material, practice directives, chord sheets, or fingering diagrams here..."
          />
        </div>

        <!-- 3. Audio Upload -->
        <div v-else-if="lessonForm.type === 'audio'" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Upload Audio File (MP3, WAV, AAC, FLAC, OGG · Max 50MB){{ lessonEditId ? '' : ' *' }}
            </label>
            <input
              id="lesson-file"
              type="file"
              accept="audio/*"
              :required="!lessonEditId"
              class="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-500/20 file:text-gold-300 hover:file:bg-gold-500/30"
              @change="onFileChange"
            />
            <p v-if="lessonEditId && currentLessonFileName" class="text-[11px] text-slate-400 mt-1">
              Current file: <span class="font-mono text-gold-400">{{ currentLessonFileName }}</span> (leave empty to keep)
            </p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Supplemental Listening Notes / Transcription Guide (Optional)
            </label>
            <RichTextEditor
              v-model="lessonForm.content"
              :rows="6"
              placeholder="Add optional listening instructions, time markers, or ear-training tips to accompany the audio track..."
            />
          </div>
        </div>

        <!-- 4. PDF Score Upload -->
        <div v-else-if="lessonForm.type === 'pdf'" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Upload PDF Score / Sheet Music (Max 20MB){{ lessonEditId ? '' : ' *' }}
            </label>
            <input
              id="lesson-file"
              type="file"
              accept="application/pdf"
              :required="!lessonEditId"
              class="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 hover:file:bg-sky-500/30"
              @change="onFileChange"
            />
            <p v-if="lessonEditId && currentLessonFileName" class="text-[11px] text-slate-400 mt-1">
              Current file: <span class="font-mono text-sky-400">{{ currentLessonFileName }}</span> (leave empty to keep)
            </p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Score Analysis & Rehearsal Notes (Optional)
            </label>
            <RichTextEditor
              v-model="lessonForm.content"
              :rows="6"
              placeholder="Add performance guidance, fingering annotations, or historical context for the score..."
            />
          </div>
        </div>

        <label class="flex items-center gap-2 cursor-pointer pt-1">
          <input id="lesson-preview" v-model="lessonForm.is_preview" type="checkbox" class="w-4 h-4 rounded text-gold-500 border-slate-700 bg-navy-950" />
          <span class="text-xs text-slate-300 font-medium">Free preview lesson for public catalog</span>
        </label>

        <p v-if="lessonError" class="text-xs text-red-400">{{ lessonError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-secondary text-xs" @click="showLessonModal = false">Cancel</button>
          <button id="save-lesson-btn" type="submit" class="btn btn-primary text-xs font-bold" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Lesson' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import http, { parseError } from '@/lib/http'
import Modal from '@/components/ui/Modal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'
import { extractYouTubeId, getYouTubeThumbnail, estimateReadingTime } from '@/lib/richText'

const route = useRoute()
const coursesStore = useCoursesStore()
const ui = useUiStore()
const auth = useAuthStore()

const courseId = computed(() => route.params.id)
const course = computed(() => coursesStore.currentCourse)
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const savingStatus = ref(false)
const statusDraft = ref('draft')

const totalLessons = computed(() =>
  (course.value?.modules || []).reduce((n, m) => n + (m.lessons?.length || 0), 0),
)

async function load() {
  try {
    await coursesStore.fetchInstructorCourse(courseId.value)
    statusDraft.value = course.value?.status || 'draft'
  } catch (err) {
    loadError.value = err.response?.status === 403
      ? 'You are not assigned to this course.'
      : parseError(err).message
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await coursesStore.fetchInstructorCourse(courseId.value)
  statusDraft.value = course.value?.status || 'draft'
}

async function saveStatus() {
  savingStatus.value = true
  try {
    await http.put(`/admin/courses/${courseId.value}`, { status: statusDraft.value })
    ui.notify({ type: 'success', title: 'Status updated', message: `Course is now ${statusDraft.value}.` })
    await refresh()
  } catch (err) {
    statusDraft.value = course.value?.status || 'draft'
    ui.notify({ type: 'error', title: 'Could not update status', message: parseError(err).message })
  } finally {
    savingStatus.value = false
  }
}

/* ---------------- Modules ---------------- */
const showModuleModal = ref(false)
const moduleEditId = ref(null)
const moduleError = ref('')
const moduleForm = reactive({ title: '', level: 'beginner', description: '', priceMajor: 3000 })

function openModuleModal(module = null) {
  moduleError.value = ''
  moduleEditId.value = module?.id || null
  moduleForm.title = module?.title || ''
  moduleForm.level = module?.level || 'beginner'
  moduleForm.description = module?.description || ''
  moduleForm.priceMajor = module ? Number(module.price_kes) / 100 : 3000
  showModuleModal.value = true
}

async function submitModule() {
  saving.value = true
  moduleError.value = ''
  try {
    await coursesStore.saveModule(
      courseId.value,
      {
        title: moduleForm.title,
        level: moduleForm.level,
        description: moduleForm.description,
        price_kes: Math.round(Number(moduleForm.priceMajor) * 100),
      },
      moduleEditId.value,
    )
    ui.notify({ type: 'success', title: moduleEditId.value ? 'Module updated' : 'Module added', message: moduleForm.title })
    showModuleModal.value = false
    await refresh()
  } catch (err) {
    const { message, errors } = parseError(err)
    moduleError.value = Object.values(errors)[0] || message
  } finally {
    saving.value = false
  }
}

async function removeModule(module) {
  if (!confirm(`Delete "${module.title}" and all of its lessons?`)) return
  try {
    await coursesStore.deleteModule(module.id)
    ui.notify({ type: 'success', title: 'Module deleted', message: module.title })
    await refresh()
  } catch (err) {
    ui.notify({ type: 'error', title: 'Could not delete module', message: parseError(err).message })
  }
}

/* ---------------- Lessons ---------------- */
const showLessonModal = ref(false)
const lessonEditId = ref(null)
const lessonModuleId = ref(null)
const lessonFile = ref(null)
const lessonError = ref('')
const currentLessonFileName = ref('')

const lessonForm = reactive({
  title: '',
  type: 'youtube',
  summary: '',
  youtube_video_id: '',
  content: '',
  duration_seconds: 600,
  is_preview: false,
})

const extractedYoutubeId = computed(() => extractYouTubeId(lessonForm.youtube_video_id))

function formatBadgeClass(type) {
  switch (type) {
    case 'youtube':
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
    case 'richtext':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
    case 'audio':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    case 'pdf':
      return 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
    default:
      return 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
  }
}

function formatTypeLabel(type) {
  switch (type) {
    case 'youtube':
      return 'YouTube'
    case 'richtext':
      return 'Rich Text'
    case 'audio':
      return 'Audio'
    case 'pdf':
      return 'PDF Score'
    default:
      return type
  }
}

function onFileChange(e) {
  lessonFile.value = e.target.files[0] || null
}

function openLessonModal(module, lesson = null) {
  lessonError.value = ''
  lessonModuleId.value = module.id
  lessonEditId.value = lesson?.id || null
  lessonFile.value = null
  currentLessonFileName.value = lesson?.file_name || ''
  lessonForm.title = lesson?.title || ''
  lessonForm.type = lesson?.type || 'youtube'
  lessonForm.summary = lesson?.summary || ''
  lessonForm.youtube_video_id = lesson?.youtube_video_id || ''
  lessonForm.content = lesson?.content || ''
  lessonForm.duration_seconds = lesson?.duration_seconds ?? 600
  lessonForm.is_preview = !!lesson?.is_preview
  showLessonModal.value = true
}

async function submitLesson() {
  saving.value = true
  lessonError.value = ''
  try {
    const fd = new FormData()
    fd.append('title', lessonForm.title)
    fd.append('type', lessonForm.type)
    fd.append('summary', lessonForm.summary || '')
    fd.append('duration_seconds', lessonForm.duration_seconds ?? 0)
    fd.append('is_preview', lessonForm.is_preview ? '1' : '0')

    if (lessonForm.type === 'youtube') {
      const vid = extractedYoutubeId.value || lessonForm.youtube_video_id
      fd.append('youtube_video_id', vid)
    } else if (lessonForm.type === 'richtext') {
      fd.append('content', lessonForm.content || '')
    } else if (lessonForm.type === 'audio' || lessonForm.type === 'pdf') {
      if (lessonFile.value) {
        fd.append('file', lessonFile.value)
      }
      if (lessonForm.content) {
        fd.append('content', lessonForm.content)
      }
    }

    await coursesStore.saveLesson(lessonModuleId.value, fd, lessonEditId.value)
    ui.notify({ type: 'success', title: lessonEditId.value ? 'Lesson updated' : 'Lesson added', message: lessonForm.title })
    showLessonModal.value = false
    await refresh()
  } catch (err) {
    const { message, errors } = parseError(err)
    lessonError.value = Object.values(errors)[0] || message
  } finally {
    saving.value = false
  }
}

async function removeLesson(lesson) {
  if (!confirm(`Remove lesson "${lesson.title}"?`)) return
  try {
    await coursesStore.deleteLesson(lesson.id)
    ui.notify({ type: 'success', title: 'Lesson removed', message: lesson.title })
    await refresh()
  } catch (err) {
    ui.notify({ type: 'error', title: 'Could not remove lesson', message: parseError(err).message })
  }
}

onMounted(load)
</script>
