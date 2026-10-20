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
            Complete Course Description
          </label>
          <textarea
            v-model="form.description"
            rows="4"
            class="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-gold-500"
            placeholder="Detailed overview of syllabus, prerequisites, repertoire and instructional outcomes..."
          ></textarea>
        </div>

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
          <div class="flex items-center justify-between">
            <div>
              <span class="badge badge-gold text-[10px] font-bold uppercase tracking-wider mr-2">
                {{ module.level }}
              </span>
              <strong class="text-white text-base font-serif">{{ module.title }}</strong>
              <span class="text-xs text-slate-400 block mt-0.5">
                KES {{ module.price_formatted }} (${{ module.price_usd_formatted }} USD)
              </span>
            </div>

            <div class="flex items-center gap-2">
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

          <!-- Lessons in module -->
          <div class="space-y-2 pt-2 border-t border-slate-800/80">
            <div
              v-for="lesson in module.lessons"
              :key="lesson.id"
              class="flex items-center justify-between p-2.5 rounded-xl bg-navy-950/60 border border-slate-800 text-xs"
            >
              <div class="flex items-center gap-2 truncate">
                <span class="font-bold text-gold-400 uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-gold-500/10">
                  {{ lesson.type }}
                </span>
                <span class="text-white font-medium truncate">{{ lesson.title }}</span>
                <span v-if="lesson.is_preview" class="text-[10px] text-emerald-400 font-bold ml-1">
                  (Free Preview)
                </span>
              </div>

              <button
                @click="handleDeleteLesson(lesson.id)"
                class="text-red-400 hover:text-red-300 ml-3"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Module Modal -->
    <Modal :show="showModuleModal" @close="showModuleModal = false">
      <div class="space-y-4">
        <h3 class="text-lg font-serif font-bold text-white">Add Curriculum Module</h3>
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
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
            <textarea v-model="moduleForm.description" rows="2" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="showModuleModal = false" class="btn btn-secondary text-xs">Cancel</button>
            <button type="submit" class="btn btn-primary text-xs font-bold">Add Module</button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- Add Lesson Modal -->
    <Modal :show="showLessonModal" @close="showLessonModal = false">
      <div class="space-y-4">
        <h3 class="text-lg font-serif font-bold text-white">Add Lesson to Module</h3>
        <form @submit.prevent="handleSaveLesson" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Lesson Title *</label>
            <input v-model="lessonForm.title" type="text" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Format *</label>
              <select v-model="lessonForm.type" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white">
                <option value="youtube">YouTube Masterclass</option>
                <option value="audio">Guided Audio (MP3/WAV)</option>
                <option value="pdf">Sheet Music / PDF Score</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (Secs)</label>
              <input v-model.number="lessonForm.duration_seconds" type="number" min="0" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" placeholder="e.g. 600" />
            </div>
          </div>

          <div v-if="lessonForm.type === 'youtube'">
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">YouTube Video ID *</label>
            <input v-model="lessonForm.youtube_video_id" type="text" required class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" placeholder="e.g. Mh4f9AYRCZY" />
          </div>

          <div v-else>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Upload File ({{ lessonForm.type === 'audio' ? 'Audio MP3/WAV, Max 50MB' : 'PDF Score, Max 20MB' }}) *
            </label>
            <input
              type="file"
              :accept="lessonForm.type === 'audio' ? 'audio/*' : 'application/pdf'"
              required
              @change="onFileChange"
              class="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-500/20 file:text-gold-300 hover:file:bg-gold-500/30"
            />
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
  duration_seconds: 600,
  is_preview: false,
});
const lessonFile = ref(null);

function onFileChange(e) {
  lessonFile.value = e.target.files[0] || null;
}

function openCreateModuleModal() {
  moduleForm.title = '';
  moduleForm.level = 'beginner';
  moduleForm.description = '';
  modulePriceKesMajor.value = 3000;
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
    await coursesStore.saveModule(courseId.value, payload);
    uiStore.notify({ type: 'success', title: 'Module Added', message: 'Module saved successfully.' });
    showModuleModal.value = false;
    await coursesStore.fetchCourse(currentCourse.value.slug);
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to save module.' });
  }
}

async function handleDeleteModule(moduleId) {
  if (!confirm('Are you sure you want to remove this module and its lessons?')) return;
  try {
    await coursesStore.deleteModule(moduleId);
    uiStore.notify({ type: 'success', title: 'Module Deleted', message: 'Module removed.' });
    await coursesStore.fetchCourse(currentCourse.value.slug);
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: 'Failed to delete module.' });
  }
}

function openAddLessonModal(module) {
  activeModule.value = module;
  lessonForm.title = '';
  lessonForm.type = 'youtube';
  lessonForm.youtube_video_id = '';
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
      fd.append('youtube_video_id', lessonForm.youtube_video_id);
    } else if (lessonFile.value) {
      fd.append('file', lessonFile.value);
    }

    await coursesStore.saveLesson(activeModule.value.id, fd);
    uiStore.notify({ type: 'success', title: 'Lesson Created', message: 'Lesson added to module.' });
    showLessonModal.value = false;
    await coursesStore.fetchCourse(currentCourse.value.slug);
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Upload Failed', message: err.response?.data?.message || 'Could not upload lesson.' });
  }
}

async function handleDeleteLesson(lessonId) {
  if (!confirm('Remove this lesson?')) return;
  try {
    await coursesStore.deleteLesson(lessonId);
    uiStore.notify({ type: 'success', title: 'Lesson Removed', message: 'Lesson deleted.' });
    await coursesStore.fetchCourse(currentCourse.value.slug);
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
  if (isEditing.value) {
    // Fetch course for editing
    const course = await coursesStore.fetchAdminCourses();
    const current = coursesStore.adminCourses.find(c => String(c.id) === String(courseId.value));
    if (current) {
      await coursesStore.fetchCourse(current.slug);
      if (currentCourse.value) {
        form.title = currentCourse.value.title;
        form.slug = currentCourse.value.slug;
        form.description = currentCourse.value.description;
        form.short_description = currentCourse.value.short_description;
        form.status = currentCourse.value.status;
        form.requires_sequential_levels = currentCourse.value.requires_sequential_levels;
        form.bundle_discount_type = currentCourse.value.pricing.bundle_discount_type || 'none';
        discountInput.value = form.bundle_discount_type === 'fixed_kes'
          ? (currentCourse.value.pricing.bundle_discount_value / 100)
          : currentCourse.value.pricing.bundle_discount_value;
      }
    }
  }
});
</script>
