<template>
  <div class="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb & Header -->
    <div class="flex items-center justify-between">
      <router-link to="/admin/courses" class="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-gold-400 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Courses
      </router-link>

      <span v-if="isEditing" class="badge badge-gold text-xs">
        Editing: {{ form.title || 'Course' }}
      </span>
    </div>

    <div class="card p-8 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-6">
      <h1 class="text-2xl font-serif font-bold text-white">
        {{ isEditing ? 'Edit Course & Curriculum' : 'Create New Course' }}
      </h1>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Title & Slug -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Course Title *
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-gold-500"
              placeholder="e.g. Masterclass in Classical Piano"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              URL Slug (Optional, auto-generated)
            </label>
            <input
              v-model="form.slug"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-gold-500"
              placeholder="e.g. classical-piano-mastery"
            />
          </div>
        </div>

        <!-- Short Description -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Short Description (Catalog Preview)
          </label>
          <input
            v-model="form.short_description"
            type="text"
            maxlength="500"
            class="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-gold-500"
            placeholder="One or two sentences highlighting the musical objective..."
          />
        </div>

        <!-- Full Description -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Complete Course Description (Rich Text &amp; Inline Images)
          </label>
          <RichTextEditor
            v-model="form.description"
            :rows="8"
            placeholder="Detailed overview of syllabus, prerequisites, repertoire and instructional outcomes..."
          />
        </div>

        <!-- Course Cover Image & Learning Materials (When Editing) -->
        <MediaPanel
          v-if="isEditing && currentCourse"
          owner-type="course"
          :owner="currentCourse"
          @changed="coursesStore.fetchAdminCourse(courseId)"
        />

        <!-- Status & Progression Flags -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Publication Status
            </label>
            <select
              v-model="form.status"
              class="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-gold-500"
            >
              <option value="draft">Draft (Private)</option>
              <option value="published">Published (Visible in Catalog)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div class="flex items-center pt-6">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.requires_sequential_levels"
                type="checkbox"
                class="w-4 h-4 rounded text-gold-500 border-slate-700 bg-navy-950 focus:ring-gold-500"
              />
              <span class="text-xs text-slate-300 font-medium">
                Require students to complete one level before advancing to the next
              </span>
            </label>
          </div>
        </div>

        <!-- Instructor Assignment (admins only) -->
        <div v-if="auth.can('courses.manage-all')" class="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-3">
          <span class="text-xs font-bold text-gold-400 uppercase tracking-wider">Assigned Instructors</span>
          <p class="text-[11px] text-slate-400">Assigned instructors can build this course's modules and lessons from their Instructor Studio.</p>
          <div v-if="instructorOptions.length === 0" class="text-xs text-slate-500">No active instructors found.</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label v-for="ins in instructorOptions" :key="ins.id" class="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input v-model="form.instructor_ids" type="checkbox" :value="ins.id" class="w-4 h-4 rounded text-gold-500 border-slate-700 bg-navy-950" />
              {{ ins.name }} <span class="text-slate-500">({{ ins.email }})</span>
            </label>
          </div>
        </div>

        <!-- Bundle Discount Configuration & Validation -->
        <div class="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-gold-400 uppercase tracking-wider">
              Course Bundle Discount
            </span>
            <span class="text-[11px] text-slate-400">
              Total Module Value: <strong class="text-white">KES {{ (totalModulePriceKes / 100).toLocaleString() }}</strong>
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Discount Type
              </label>
              <select
                v-model="form.bundle_discount_type"
                class="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-gold-500"
              >
                <option value="none">No Discount</option>
                <option value="percent">Percentage (%)</option>
                <option value="fixed_kes">Fixed KES (Minor Units)</option>
              </select>
            </div>

            <div v-if="form.bundle_discount_type !== 'none'">
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {{ form.bundle_discount_type === 'percent' ? 'Discount Percentage (1 - 99%)' : 'Discount in KES (Major e.g. 2000)' }}
              </label>
              <input
                v-model.number="discountInput"
                type="number"
                min="1"
                class="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <!-- Dynamic Discount Simulation & Alert -->
          <div v-if="simulatedDiscountError" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            ⚠️ <strong>Invalid Discount:</strong> {{ simulatedDiscountError }}
          </div>
          <div v-else-if="form.bundle_discount_type !== 'none' && totalModulePriceKes > 0" class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex justify-between">
            <span>Resulting Bundle Price: <strong>KES {{ (simulatedBundlePrice / 100).toLocaleString() }}</strong></span>
            <span>Savings: <strong>KES {{ ((totalModulePriceKes - simulatedBundlePrice) / 100).toLocaleString() }}</strong></span>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-slate-800">
          <router-link to="/admin/courses" class="btn btn-secondary text-xs">
            Cancel
          </router-link>
          <button
            type="submit"
            :disabled="coursesStore.loading || !!simulatedDiscountError"
            class="btn btn-primary text-xs font-bold"
          >
            {{ isEditing ? 'Save Changes' : 'Create Course' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Modules & Lessons Management (When Editing) -->
    <div v-if="isEditing" class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-serif font-bold text-white">Course Modules & Lessons</h2>
          <p class="text-xs text-slate-400">Manage levels, pricing, video masterclasses, audio tracks and scores.</p>
        </div>

        <button @click="openCreateModuleModal" class="btn btn-secondary text-xs flex items-center gap-1.5 font-bold">
          <svg class="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Module
        </button>
      </div>

      <div v-if="!currentCourse?.modules?.length" class="card p-8 text-center bg-navy-900/60 border border-slate-800 rounded-2xl">
        <p class="text-sm text-slate-400">No modules added yet. Add a Beginner, Intermediate, or Advanced module.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="module in currentCourse.modules"
          :key="module.id"
          class="card p-5 rounded-2xl bg-navy-900/70 border border-slate-800 space-y-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3">
              <img
                v-if="resolveMediaUrl(module.image_url || module.image_path) || extractFirstImageUrl(module.description)"
                :src="resolveMediaUrl(module.image_url || module.image_path) || extractFirstImageUrl(module.description)"
                :alt="module.title"
                class="w-20 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
              />
              <div>
                <span class="badge badge-gold text-[10px] font-bold uppercase tracking-wider mr-2">
                  {{ module.level }}
                </span>
                <strong class="text-white text-base font-serif">{{ module.title }}</strong>
                <span class="text-xs text-slate-400 block mt-0.5">
                  KES {{ module.price_formatted }} (${{ module.price_usd_formatted }} USD)
                </span>
                <div
                  v-if="module.description"
                  class="mt-2 prose prose-invert rich-text-content max-w-none text-xs text-slate-300"
                  v-html="renderRichText(module.description, { dark: true })"
                ></div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                @click="openEditModuleModal(module)"
                class="btn btn-secondary text-xs py-1.5 px-3"
              >
                Edit Module
              </button>
              <button
                @click="openAddLessonModal(module)"
                class="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                + Add Lesson
              </button>
              <button
                @click="handleDeleteModule(module.id)"
                class="text-xs text-red-400 hover:text-red-300 px-2 py-1"
              >
                Delete Module
              </button>
            </div>
          </div>

          <!-- Module Cover Image & Learning Materials (PDF, Audio, YouTube, Image) -->
          <MediaPanel
            owner-type="module"
            :owner="module"
            @changed="coursesStore.fetchAdminCourse(courseId)"
          />

          <!-- Lessons in module -->
          <div class="space-y-2 pt-2 border-t border-slate-800/80">
            <div
              v-for="lesson in module.lessons"
              :key="lesson.id"
              class="p-2.5 rounded-xl bg-navy-950/60 border border-slate-800 text-xs space-y-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 truncate">
                  <span class="font-bold text-gold-400 uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-gold-500/10">
                    {{ lesson.type }}
                  </span>
                  <span class="text-white font-medium truncate">{{ lesson.title }}</span>
                  <span v-if="lesson.is_preview" class="text-[10px] text-emerald-400 font-bold ml-1">
                    (Free Preview)
                  </span>
                </div>

                <div class="flex items-center gap-3 ml-3 shrink-0">
                  <button
                    v-if="lesson.type === 'youtube' && lesson.youtube_video_id"
                    type="button"
                    class="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 font-semibold text-[11px] cursor-pointer"
                    @click="toggleAdminLessonPreview(lesson.id)"
                  >
                    {{ expandedAdminLessonIds[lesson.id] ? 'Hide Video' : 'Preview Video' }}
                  </button>
                  <button
                    @click="handleDeleteLesson(lesson.id)"
                    class="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div
                v-if="lesson.type === 'youtube' && lesson.youtube_video_id && expandedAdminLessonIds[lesson.id]"
                class="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800"
              >
                <iframe
                  :src="`https://www.youtube.com/embed/${extractYouTubeId(lesson.youtube_video_id)}?rel=0`"
                  class="w-full h-full"
                  frameborder="0"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>

              <audio
                v-if="lesson.type === 'audio' && lesson.stream_url"
                :src="resolveMediaUrl(lesson.stream_url)"
                controls
                class="w-full h-8"
              ></audio>

              <PdfViewer
                v-if="lesson.type === 'pdf' && lesson.stream_url"
                :src="resolveMediaUrl(lesson.stream_url)"
                :title="lesson.file_name || lesson.title"
                :file-size-bytes="lesson.file_size_bytes"
                :dark="true"
                :default-open="false"
                height-class="h-[540px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Module Modal -->
    <Modal :open="showModuleModal" title="Module" max-width="max-w-3xl" @close="showModuleModal = false">
      <div class="space-y-4">
        <h3 class="text-lg font-serif font-bold text-white">{{ editingModuleId ? 'Edit Curriculum Module' : 'Add Curriculum Module' }}</h3>
        <form @submit.prevent="handleSaveModule" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Module Title *</label>
            <input v-model="moduleForm.title" type="text" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Level *</label>
              <select v-model="moduleForm.level" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Price (KES) *</label>
              <input v-model.number="modulePriceKesMajor" type="number" min="0" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" placeholder="e.g. 4500" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Module Syllabus &amp; Rich Text Description</label>
            <RichTextEditor
              v-model="moduleForm.description"
              :rows="6"
              placeholder="Compose module syllabus, learning goals, and repertoire notes..."
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="showModuleModal = false" class="btn btn-secondary text-xs">Cancel</button>
            <button type="submit" class="btn btn-primary text-xs font-bold">{{ editingModuleId ? 'Save Module' : 'Add Module' }}</button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- Add Lesson Modal -->
    <Modal :open="showLessonModal" title="Lesson" :max-width="lessonForm.type === 'richtext' ? 'max-w-4xl' : 'max-w-2xl'" @close="showLessonModal = false">
      <div class="space-y-4">
        <h3 class="text-lg font-serif font-bold text-white">Add Learning Material to Module</h3>
        <form @submit.prevent="handleSaveLesson" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Lesson Title *</label>
            <input v-model="lessonForm.title" type="text" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Learning Material Format *</label>
              <select v-model="lessonForm.type" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white">
                <option value="youtube">YouTube Masterclass Video</option>
                <option value="richtext">Rich Text / Article & Notation Guide</option>
                <option value="audio">Guided Audio (MP3/WAV)</option>
                <option value="pdf">Sheet Music / PDF Score</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (Secs)</label>
              <input v-model.number="lessonForm.duration_seconds" type="number" min="0" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" placeholder="e.g. 600" />
            </div>
          </div>

          <!-- YouTube Video ID / Link -->
          <div v-if="lessonForm.type === 'youtube'" class="space-y-2">
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">YouTube Video ID or Full Link *</label>
            <input
              v-model="lessonForm.youtube_video_id"
              type="text"
              required
              class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white font-mono"
              placeholder="e.g. Mh4f9AYRCZY or https://www.youtube.com/watch?v=Mh4f9AYRCZY"
            />
            <div v-if="extractedAdminYoutubeId" class="flex items-center gap-3 p-2.5 rounded-xl bg-navy-900 border border-slate-800">
              <img :src="getYouTubeThumbnail(extractedAdminYoutubeId)" class="w-24 h-14 object-cover rounded-lg border border-slate-700" alt="Video thumbnail" />
              <div class="text-xs">
                <span class="text-emerald-400 font-bold flex items-center gap-1.5">
                  ✓ Valid Video ID: <code class="px-1.5 py-0.5 rounded bg-navy-950 text-white font-mono">{{ extractedAdminYoutubeId }}</code>
                </span>
                <a :href="`https://www.youtube.com/watch?v=${extractedAdminYoutubeId}`" target="_blank" rel="noopener noreferrer" class="text-gold-400 hover:underline block text-[11px] mt-0.5">
                  Verify on YouTube &rarr;
                </a>
              </div>
            </div>
          </div>

          <!-- Rich Text Editor -->
          <div v-else-if="lessonForm.type === 'richtext'" class="space-y-2">
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Course Material (Rich Text Editor) *
            </label>
            <RichTextEditor
              v-model="lessonForm.content"
              placeholder="Compose detailed instructional material, practice directives, chord sheets, or fingering diagrams here..."
            />
          </div>

          <!-- Audio Upload -->
          <div v-else-if="lessonForm.type === 'audio'" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Upload Audio Track (MP3, WAV, AAC, FLAC, OGG · Max 50MB) *
              </label>
              <input
                type="file"
                accept="audio/*"
                required
                @change="onFileChange"
                class="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-500/20 file:text-gold-300 hover:file:bg-gold-500/30"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Supplemental Listening Notes (Optional)
              </label>
              <RichTextEditor
                v-model="lessonForm.content"
                :rows="6"
                placeholder="Optional listening instructions, time markers, or ear-training tips..."
              />
            </div>
          </div>

          <!-- PDF Upload -->
          <div v-else-if="lessonForm.type === 'pdf'" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Upload PDF Score / Sheet Music (Max 20MB) *
              </label>
              <input
                type="file"
                accept="application/pdf"
                required
                @change="onFileChange"
                class="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 hover:file:bg-sky-500/30"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Score Analysis Notes (Optional)
              </label>
              <RichTextEditor
                v-model="lessonForm.content"
                :rows="6"
                placeholder="Optional performance guidance or annotations..."
              />
            </div>
          </div>

          <div class="flex items-center">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="lessonForm.is_preview" type="checkbox" class="w-4 h-4 rounded text-gold-500 border-slate-700 bg-navy-950" />
              <span class="text-xs text-slate-300 font-medium">Free preview lesson for public catalog</span>
            </label>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="showLessonModal = false" class="btn btn-secondary text-xs">Cancel</button>
            <button type="submit" class="btn btn-primary text-xs font-bold">Save Lesson</button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCoursesStore } from '../../../stores/courses';
import { useUiStore } from '../../../stores/ui';
import Modal from '../../../components/ui/Modal.vue';
import RichTextEditor from '../../../components/ui/RichTextEditor.vue';
import MediaPanel from '../../../components/ui/MediaPanel.vue';
import PdfViewer from '../../../components/ui/PdfViewer.vue';
import { extractYouTubeId, getYouTubeThumbnail, renderRichText, resolveMediaUrl, extractFirstImageUrl } from '../../../lib/richText';
import { useAuthStore } from '../../../stores/auth';
import http from '../../../lib/http';

const auth = useAuthStore();
const instructorOptions = ref([]);
const expandedAdminLessonIds = reactive({});

function toggleAdminLessonPreview(id) {
  expandedAdminLessonIds[id] = !expandedAdminLessonIds[id];
}

const route = useRoute();
const router = useRouter();
const coursesStore = useCoursesStore();
const uiStore = useUiStore();

const isEditing = computed(() => !!route.params.id);
const courseId = computed(() => route.params.id);
const currentCourse = computed(() => coursesStore.currentCourse);

const form = reactive({
  title: '',
  slug: '',
  description: '',
  short_description: '',
  status: 'draft',
  requires_sequential_levels: false,
  bundle_discount_type: 'none',
  bundle_discount_value: 0,
  instructor_ids: [],
});

const discountInput = ref(0);

// Total module value in KES minor units
const totalModulePriceKes = computed(() => {
  if (!currentCourse.value?.modules) return 0;
  return currentCourse.value.modules.reduce((sum, m) => sum + Number(m.price_kes || 0), 0);
});

// Simulated bundle price
const simulatedBundlePrice = computed(() => {
  const sum = totalModulePriceKes.value;
  if (sum <= 0 || form.bundle_discount_type === 'none') return sum;

  if (form.bundle_discount_type === 'percent') {
    const pct = Number(discountInput.value || 0);
    const discount = Math.round(sum * (pct / 100));
    return Math.max(0, sum - discount);
  }

  if (form.bundle_discount_type === 'fixed_kes') {
    const fixedKesMinor = Number(discountInput.value || 0) * 100;
    return Math.max(0, sum - fixedKesMinor);
  }

  return sum;
});

// Dynamic rule validator: "Reject any discount that would make the bundle price zero or higher than the sum of single modules."
const simulatedDiscountError = computed(() => {
  if (form.bundle_discount_type === 'none' || totalModulePriceKes.value <= 0) return null;

  if (form.bundle_discount_type === 'percent') {
    const pct = Number(discountInput.value);
    if (pct <= 0) return 'Percent discount must be greater than 0%.';
    if (pct >= 100) return 'Percent discount must be less than 100% (bundle price cannot be zero).';
  }

  if (form.bundle_discount_type === 'fixed_kes') {
    const fixed = Number(discountInput.value) * 100;
    if (fixed <= 0) return 'Fixed discount must be greater than zero.';
    if (fixed >= totalModulePriceKes.value) {
      return 'Fixed discount cannot equal or exceed total module price (bundle price cannot be zero).';
    }
  }

  if (simulatedBundlePrice.value <= 0) {
    return 'Bundle price cannot be zero or negative.';
  }

  return null;
});

// Module & Lesson Modals
const showModuleModal = ref(false);
const editingModuleId = ref(null);
const moduleForm = reactive({
  title: '',
  level: 'beginner',
  description: '',
});
const modulePriceKesMajor = ref(3000);

const showLessonModal = ref(false);
const activeModule = ref(null);
const lessonForm = reactive({
  title: '',
  type: 'youtube',
  youtube_video_id: '',
  content: '',
  duration_seconds: 600,
  is_preview: false,
});
const lessonFile = ref(null);
const extractedAdminYoutubeId = computed(() => extractYouTubeId(lessonForm.youtube_video_id));

function onFileChange(e) {
  lessonFile.value = e.target.files[0] || null;
}

function openCreateModuleModal() {
  editingModuleId.value = null;
  moduleForm.title = '';
  moduleForm.level = 'beginner';
  moduleForm.description = '';
  modulePriceKesMajor.value = 3000;
  showModuleModal.value = true;
}

function openEditModuleModal(module) {
  editingModuleId.value = module.id;
  moduleForm.title = module.title || '';
  moduleForm.level = module.level || 'beginner';
  moduleForm.description = module.description || '';
  modulePriceKesMajor.value = Math.round(Number(module.price_kes || 0) / 100);
  showModuleModal.value = true;
}

async function handleSaveModule() {
  try {
    const payload = {
      title: moduleForm.title,
      level: moduleForm.level,
      description: moduleForm.description,
      price_kes: Number(modulePriceKesMajor.value) * 100,
    };
    await coursesStore.saveModule(courseId.value, payload, editingModuleId.value);
    uiStore.notify({ type: 'success', title: editingModuleId.value ? 'Module Updated' : 'Module Added', message: 'Module saved successfully.' });
    showModuleModal.value = false;
    await coursesStore.fetchAdminCourse(courseId.value);
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to save module.' });
  }
}

async function handleDeleteModule(moduleId) {
  if (!confirm('Are you sure you want to remove this module and its lessons?')) return;
  try {
    await coursesStore.deleteModule(moduleId);
    uiStore.notify({ type: 'success', title: 'Module Deleted', message: 'Module removed.' });
    await coursesStore.fetchAdminCourse(courseId.value);
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: 'Failed to delete module.' });
  }
}

function openAddLessonModal(module) {
  activeModule.value = module;
  lessonForm.title = '';
  lessonForm.type = 'youtube';
  lessonForm.youtube_video_id = '';
  lessonForm.content = '';
  lessonForm.duration_seconds = 600;
  lessonForm.is_preview = false;
  lessonFile.value = null;
  showLessonModal.value = true;
}

async function handleSaveLesson() {
  try {
    const fd = new FormData();
    fd.append('title', lessonForm.title);
    fd.append('type', lessonForm.type);
    fd.append('duration_seconds', lessonForm.duration_seconds);
    fd.append('is_preview', lessonForm.is_preview ? '1' : '0');

    if (lessonForm.type === 'youtube') {
      const vid = extractedAdminYoutubeId.value || lessonForm.youtube_video_id;
      fd.append('youtube_video_id', vid);
    } else if (lessonForm.type === 'richtext') {
      fd.append('content', lessonForm.content || '');
    } else if (lessonForm.type === 'audio' || lessonForm.type === 'pdf') {
      if (lessonFile.value) {
        fd.append('file', lessonFile.value);
      }
      if (lessonForm.content) {
        fd.append('content', lessonForm.content);
      }
    }

    await coursesStore.saveLesson(activeModule.value.id, fd);
    uiStore.notify({ type: 'success', title: 'Lesson Created', message: 'Lesson added to module.' });
    showLessonModal.value = false;
    await coursesStore.fetchAdminCourse(courseId.value);
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Upload Failed', message: err.response?.data?.message || 'Could not upload lesson.' });
  }
}

async function handleDeleteLesson(lessonId) {
  if (!confirm('Remove this lesson?')) return;
  try {
    await coursesStore.deleteLesson(lessonId);
    uiStore.notify({ type: 'success', title: 'Lesson Removed', message: 'Lesson deleted.' });
    await coursesStore.fetchAdminCourse(courseId.value);
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: 'Could not remove lesson.' });
  }
}

async function handleSubmit() {
  if (simulatedDiscountError.value) {
    uiStore.notify({ type: 'error', title: 'Invalid Discount', message: simulatedDiscountError.value });
    return;
  }

  const payload = {
    title: form.title,
    slug: form.slug || undefined,
    description: form.description,
    short_description: form.short_description,
    status: form.status,
    requires_sequential_levels: form.requires_sequential_levels,
    bundle_discount_type: form.bundle_discount_type,
    bundle_discount_value: form.bundle_discount_type === 'percent'
      ? Number(discountInput.value)
      : Number(discountInput.value) * 100,
    instructor_ids: auth.can('courses.manage-all') ? form.instructor_ids : undefined,
  };

  try {
    const res = await coursesStore.saveCourse(payload, isEditing.value ? courseId.value : null);
    uiStore.notify({ type: 'success', title: 'Course Saved', message: 'Course updated successfully.' });
    if (!isEditing.value && res.course?.id) {
      router.push(`/admin/courses/${res.course.id}/edit`);
    }
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Validation Error', message: err.response?.data?.message || 'Could not save course.' });
  }
}

onMounted(async () => {
  if (auth.can('courses.manage-all')) {
    try {
      const res = await http.get('/admin/users', { params: { role: 'instructor', status: 'active' } });
      instructorOptions.value = (res.data.data || []).map(u => ({ id: u.id, name: u.name, email: u.email }));
    } catch (e) {
      instructorOptions.value = [];
    }
  }

  if (isEditing.value) {
    try {
      const current = await coursesStore.fetchAdminCourse(courseId.value);
      if (current) {
        form.title = current.title;
        form.slug = current.slug;
        form.description = current.description;
        form.short_description = current.short_description;
        form.status = current.status;
        form.requires_sequential_levels = current.requires_sequential_levels;
        form.bundle_discount_type = current.pricing.bundle_discount_type || 'none';
        form.instructor_ids = (current.instructors || []).map(i => i.id);
        discountInput.value = form.bundle_discount_type === 'fixed_kes'
          ? (current.pricing.bundle_discount_value / 100)
          : current.pricing.bundle_discount_value;
      }
    } catch (err) {
      uiStore.notify({ type: 'error', title: 'Error', message: 'Could not load course.' });
    }
  }
});
</script>
