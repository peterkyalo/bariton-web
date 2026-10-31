<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-navy-950 text-white overflow-hidden">
    <!-- Main Content Stage (Video / Audio / PDF) -->
    <div class="flex-1 flex flex-col overflow-y-auto">
      <!-- Top Navigation Bar -->
      <div class="px-6 py-4 border-b border-slate-800 bg-navy-900/60 backdrop-blur-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link
            to="/student/courses"
            class="p-2 rounded-lg bg-navy-950 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </router-link>
          <div>
            <span class="text-xs font-semibold text-gold-400 tracking-wider uppercase flex items-center gap-2">
              <span>{{ enrollment?.course?.title }}</span>
              <span v-if="enrollment?.path_type === 'validation'" class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Skills Validation Track
              </span>
            </span>
            <h1 class="text-lg font-serif font-bold text-white truncate max-w-xl">
              {{ enrollment?.path_type === 'validation' ? 'Skills Assessment Studio' : (currentLesson?.title || currentModule?.title || 'Select a lesson to begin') }}
            </h1>
          </div>
        </div>

        <!-- Overall Course Progress Badge -->
        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="text-[11px] text-slate-400 block">Course Progress ({{ completedLessonsCount }}/{{ totalAccessibleLessonsCount }} Lessons)</span>
            <span class="block text-sm font-bold text-gold-400" data-testid="course-progress-percent">{{ courseProgressPercent }}% Complete</span>
          </div>
          <div class="w-20 sm:w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-gold-500 to-emerald-400 transition-all duration-500"
              :style="{ width: `${courseProgressPercent}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Player Area -->
      <div class="flex-1 p-6 flex flex-col items-center justify-start bg-navy-950/90 relative">
        <div v-if="coursesStore.loading && !enrollment" class="py-20 text-center my-auto">
          <LoadingSpinner text="Loading your enrolled course curriculum..." />
        </div>

        <div v-else-if="loadingLesson" class="py-20 text-center my-auto">
          <LoadingSpinner text="Loading lesson material..." />
        </div>

        <!-- Professional Validation Track Hero Studio -->
        <div
          v-else-if="enrollment?.path_type === 'validation'"
          class="w-full max-w-2xl p-8 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-2xl space-y-6 text-center"
        >
          <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-3xl">
            🎯
          </div>

          <div class="space-y-2">
            <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-block">
              Professional Skills Validation Track
            </span>
            <h2 class="text-2xl font-serif font-bold text-white">
              Direct Assessment Path
            </h2>
            <p class="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              You are enrolled in the assessment-only validation track. Instructional lessons are excluded. Complete all module assignments and the final certification exam to earn your official <strong>Certificate of Skills Validation</strong>.
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <router-link
              :to="{ name: 'student.exam', params: { slug: enrollment.course.slug } }"
              class="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🎓 Take Final Certification Exam</span>
            </router-link>
            <router-link
              :to="`/courses/${enrollment.course.slug}`"
              class="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Upgrade to Full Course</span>
            </router-link>
          </div>
        </div>

        <!-- Module Overview Stage (when a module has no lessons or Module Overview is selected) -->
        <div
          v-else-if="!currentLesson && currentModule"
          class="w-full max-w-4xl p-6 sm:p-8 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-2xl space-y-6"
          data-testid="module-overview-stage"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3.5">
              <img
                v-if="resolveModuleCover(currentModule)"
                :src="resolveModuleCover(currentModule)"
                :alt="currentModule.title"
                class="w-16 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
              />
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-gold-400">
                  Level {{ currentModule.order || 1 }} • {{ currentModule.level }} Module Overview
                </span>
                <h2 class="text-xl sm:text-2xl font-serif font-bold text-white">
                  {{ currentModule.title }}
                </h2>
              </div>
            </div>
            <button
              v-if="firstAccessibleLessonInModule(currentModule)"
              type="button"
              @click="selectLesson(firstAccessibleLessonInModule(currentModule))"
              class="btn btn-primary text-xs py-2 px-4 font-bold flex items-center gap-2 self-start sm:self-auto"
            >
              <span>Start Module Lessons</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <div
            v-if="currentModule.description"
            class="rounded-xl bg-navy-950/80 border border-slate-800 p-6 sm:p-8 prose prose-invert rich-text-content max-w-none text-slate-200"
            v-html="renderedCurrentModuleDescription"
          ></div>
          <p v-else class="text-sm text-slate-400 italic">
            Select a lesson or resource below to begin studying this module.
          </p>
        </div>

        <div v-else-if="!currentLesson" class="py-20 text-center my-auto">
          <EmptyState
            title="Ready to Learn"
            description="Select an unlocked lesson from the curriculum sidebar to begin."
          />
        </div>

        <!-- 1. YouTube Player with 90% completion tracker -->
        <div
          v-else-if="currentLesson.type === 'youtube'"
          class="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black relative"
        >
          <div id="youtube-player" class="w-full h-full"></div>
        </div>

        <!-- 2. Audio Player with 90% played completion tracker -->
        <div
          v-else-if="currentLesson.type === 'audio'"
          class="w-full max-w-2xl p-8 rounded-2xl bg-navy-900/90 border border-gold-500/30 shadow-2xl text-center space-y-6"
        >
          <div class="w-24 h-24 mx-auto rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>

          <div>
            <h2 class="text-2xl font-serif font-bold text-white">{{ currentLesson.title }}</h2>
            <p class="text-sm text-slate-400 mt-1">Guided Audio Ear-Training & Analysis</p>
          </div>

          <div class="space-y-3">
            <audio
              ref="audioPlayerRef"
              :src="currentLesson.stream_url"
              controls
              class="w-full"
              @timeupdate="onAudioTimeUpdate"
            ></audio>
            <div class="flex justify-between text-xs text-slate-400 px-1">
              <span>Listened: {{ Math.round(audioProgressPercent) }}%</span>
              <span v-if="isLessonCompleted(currentLesson.id)" class="text-emerald-400 font-bold flex items-center gap-1">
                ✓ Lesson Completed
              </span>
              <span v-else class="text-slate-500">Auto-completes at 90% played</span>
            </div>
          </div>
        </div>

        <!-- 3. PDF Lesson Viewer (Inline Scrollable Reader + Mark Complete Button) -->
        <div
          v-else-if="currentLesson.type === 'pdf'"
          class="w-full max-w-5xl p-6 sm:p-8 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-2xl space-y-6"
        >
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-serif font-bold text-white">{{ currentLesson.title }}</h2>
                <p class="text-xs text-slate-400">{{ currentLesson.file_name || 'Sheet Music Score & Mnemonic Notes' }}</p>
              </div>
            </div>
          </div>

          <!-- Inline Scrollable PDF Reader -->
          <PdfViewer
            v-if="currentLesson.stream_url"
            :src="currentLesson.stream_url"
            :title="currentLesson.file_name || currentLesson.title"
            :file-size-bytes="currentLesson.file_size_bytes"
            :dark="true"
            :default-open="true"
            height-class="h-[680px]"
          />

          <!-- Mark Complete Trigger -->
          <div class="pt-4 flex items-center justify-between border-t border-slate-800">
            <span class="text-xs text-slate-400">
              Finished reading and reviewing this PDF course material?
            </span>
            <button
              @click="markPdfComplete"
              :disabled="isLessonCompleted(currentLesson.id)"
              class="btn btn-primary text-xs py-2 px-4 flex items-center gap-2 font-bold"
            >
              <svg v-if="isLessonCompleted(currentLesson.id)" class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ isLessonCompleted(currentLesson.id) ? 'Lesson Completed' : 'Mark as Complete' }}</span>
            </button>
          </div>
        </div>

        <!-- 4. Rich Text Article & Notation Guide Viewer -->
        <div
          v-else-if="currentLesson.type === 'richtext' || currentLesson.type === 'text'"
          class="w-full max-w-4xl p-6 sm:p-8 rounded-2xl bg-navy-900/90 border border-emerald-500/30 shadow-2xl space-y-6"
        >
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-serif font-bold text-white">{{ currentLesson.title }}</h2>
                <p class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Written Masterclass & Performance Guide</span>
                  <span>·</span>
                  <span class="text-gold-400">{{ readingStats.text }}</span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span v-if="isLessonCompleted(currentLesson.id)" class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Completed</span>
              </span>
            </div>
          </div>

          <!-- Rich Text Article Body -->
          <div class="rounded-xl bg-navy-950/80 border border-slate-800 p-6 sm:p-8 max-h-[550px] overflow-y-auto">
            <div class="prose prose-invert rich-text-content max-w-none text-slate-200" v-html="renderedCurrentLessonContent"></div>
          </div>

          <!-- Mark Complete Trigger -->
          <div class="pt-4 flex items-center justify-between border-t border-slate-800">
            <span class="text-xs text-slate-400">
              Finished studying this instructional guide?
            </span>
            <button
              @click="markRichtextComplete"
              :disabled="isLessonCompleted(currentLesson.id)"
              class="btn btn-primary text-xs py-2 px-4 flex items-center gap-2 font-bold"
            >
              <svg v-if="isLessonCompleted(currentLesson.id)" class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ isLessonCompleted(currentLesson.id) ? 'Lesson Completed' : 'Mark as Complete' }}</span>
            </button>
          </div>
        </div>

        <!-- Unified Lesson Progress & Prev/Next Navigation Bar -->
        <div
          v-if="currentLesson"
          class="w-full max-w-4xl mt-5 px-5 py-3.5 rounded-xl bg-navy-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
        >
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="!prevAccessibleLesson"
              @click="prevAccessibleLesson && selectLesson(prevAccessibleLesson)"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous Lesson</span>
            </button>

            <button
              type="button"
              :disabled="!nextAccessibleLesson"
              @click="nextAccessibleLesson && selectLesson(nextAccessibleLesson)"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
            >
              <span>Next Lesson</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-3">
            <span
              v-if="isLessonCompleted(currentLesson.id)"
              class="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Lesson Completed</span>
            </span>
            <button
              v-else
              type="button"
              @click="markCurrentLessonComplete"
              data-testid="mark-lesson-complete-btn"
              class="px-4 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Mark Lesson Complete</span>
            </button>
          </div>
        </div>

        <!-- Lesson Description & Supplemental Notes Footer -->
        <div v-if="currentLesson && (currentLesson.summary || (currentLesson.content && currentLesson.type !== 'richtext' && currentLesson.type !== 'text') || currentLesson.duration_seconds)" class="w-full max-w-4xl mt-6 p-5 rounded-xl bg-navy-900/40 border border-slate-800 text-sm text-slate-300 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h4 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>📖</span>
              <span>Lesson Notes &amp; Guidance</span>
            </h4>
            <span v-if="currentLesson.duration_seconds" class="text-xs text-slate-400">
              Duration: {{ Math.round(currentLesson.duration_seconds / 60) }} mins
            </span>
          </div>
          <p v-if="currentLesson.summary" class="text-xs text-slate-400">
            {{ currentLesson.summary }}
          </p>
          <div
            v-if="currentLesson.content && currentLesson.type !== 'richtext' && currentLesson.type !== 'text'"
            class="pt-3 border-t border-slate-800/80 prose prose-invert rich-text-content max-w-none text-xs sm:text-sm text-slate-300"
            v-html="renderedCurrentLessonContent"
          ></div>
        </div>

        <!-- Active Module Syllabus & Rich Text Overview (Displays Module Description & Cover Image) -->
        <div
          v-if="currentLesson && currentModule && (currentModule.description || resolveModuleCover(currentModule))"
          class="w-full max-w-4xl mt-6 p-5 sm:p-6 rounded-xl bg-navy-900/50 border border-slate-800/90 space-y-4"
          data-testid="active-module-syllabus"
        >
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div class="flex items-center gap-3">
              <img
                v-if="resolveModuleCover(currentModule)"
                :src="resolveModuleCover(currentModule)"
                :alt="currentModule.title"
                class="w-12 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
              />
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-gold-400 block">
                  Level {{ currentModule.order || 1 }} • {{ currentModule.level }} Module Syllabus
                </span>
                <h4 class="font-serif font-bold text-white text-sm sm:text-base">
                  {{ currentModule.title }}
                </h4>
              </div>
            </div>
            <span class="text-xs font-bold text-gold-400">{{ getModuleProgress(currentModule) }}% Module Progress</span>
          </div>

          <div
            v-if="currentModule.description"
            class="prose prose-invert rich-text-content max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed"
            v-html="renderedCurrentModuleDescription"
          ></div>
        </div>

        <!-- Course & Module Learning Materials (PDF, Audio, YouTube, Images) -->
        <div
          v-if="currentModule?.attachments?.length || enrollment?.course?.attachments?.length"
          class="w-full max-w-4xl mt-6 p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4"
        >
          <div v-if="currentModule?.attachments?.length" class="space-y-2">
            <h4 class="font-bold text-gold-400 text-xs uppercase tracking-wider">
              Module Learning Materials ({{ currentModule.title }})
            </h4>
            <MaterialList :attachments="currentModule.attachments" :dark="true" />
          </div>

          <div v-if="enrollment?.course?.attachments?.length" class="space-y-2">
            <h4 class="font-bold text-gold-400 text-xs uppercase tracking-wider">
              Course Reference Materials
            </h4>
            <MaterialList :attachments="enrollment.course.attachments" :dark="true" />
          </div>
        </div>
      </div>
    </div>

    <!-- Curriculum Sidebar Drawer -->
    <div class="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-navy-900/95 flex flex-col h-auto lg:h-full">
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 class="font-serif font-bold text-white text-base">Course Curriculum</h3>
          <p class="text-xs text-slate-400">{{ enrollment?.course?.title }}</p>
        </div>
        <span class="badge badge-gold text-xs font-bold">{{ courseProgressPercent }}%</span>
      </div>

      <!-- Module & Lessons List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-for="module in enrollment?.modules"
          :key="module.id"
          class="rounded-xl border border-slate-800/80 bg-navy-950/60 overflow-hidden"
        >
          <!-- Module Header -->
          <div
            @click="selectModuleOverview(module)"
            :class="[
              'p-3 bg-navy-900/80 border-b border-slate-800/60 space-y-2 transition-colors',
              module.is_unlocked ? 'cursor-pointer hover:bg-navy-900' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="min-w-0 pr-2">
                <span class="text-[10px] font-bold text-gold-400 uppercase tracking-wider block">
                  Level {{ module.level }}
                </span>
                <span class="text-xs font-bold text-white block truncate max-w-[210px]">
                  {{ module.title }}
                </span>
              </div>
              <div class="text-right shrink-0">
                <span v-if="enrollment?.path_type === 'validation'" class="text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Assessments
                </span>
                <span v-else class="text-[11px] font-bold text-gold-400">{{ getModuleProgress(module) }}%</span>
              </div>
            </div>

            <!-- Module Progress Bar -->
            <div v-if="enrollment?.path_type !== 'validation'" class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-gold-500 to-emerald-400 transition-all duration-300"
                :style="{ width: `${getModuleProgress(module)}%` }"
              ></div>
            </div>
          </div>

          <!-- Lessons in Module -->
          <div v-if="module.lessons?.length" class="p-1 space-y-1">
            <button
              v-for="lesson in module.lessons"
              :key="lesson.id"
              :disabled="!lesson.is_accessible"
              @click="selectLesson(lesson, module)"
              :class="[
                'w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition-all',
                currentLesson?.id === lesson.id
                  ? 'bg-gold-500/20 text-gold-300 font-bold border border-gold-500/40'
                  : lesson.is_accessible
                    ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
              ]"
            >
              <div class="flex items-center gap-2 truncate">
                <!-- Status icon -->
                <span v-if="isLessonCompleted(lesson.id)" class="text-emerald-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span v-else-if="lesson.is_accessible" class="text-slate-400">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span v-else class="text-slate-600">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>

                <span class="truncate">{{ lesson.title }}</span>
              </div>

              <span :class="['text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ml-2 shrink-0 font-bold', formatTypeBadge(lesson.type)]">
                {{ lesson.type === 'richtext' ? 'Text' : lesson.type }}
              </span>
            </button>
          </div>
          <div v-else-if="enrollment?.path_type === 'validation'" class="p-2 text-[11px] text-slate-500 italic text-center">
            Lessons excluded (Direct Assessment Track)
          </div>
          <div v-else-if="module.is_unlocked && (module.description || module.attachments?.length)" class="p-1">
            <button
              type="button"
              @click="selectModuleOverview(module)"
              :class="[
                'w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition-all',
                !currentLesson && currentModule?.id === module.id
                  ? 'bg-gold-500/20 text-gold-300 font-bold border border-gold-500/40'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              ]"
            >
              <span class="truncate">Module Overview &amp; Materials</span>
              <span class="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Overview
              </span>
            </button>
          </div>
          <!-- Module Assignment Assessment -->
          <div v-if="module.is_unlocked && module.assignments?.length" class="p-1 pt-0">
            <router-link
              v-for="asgn in module.assignments"
              :key="asgn.id"
              :to="`/student/assignments/${asgn.uuid}`"
              class="w-full flex items-center justify-between p-2 rounded-lg bg-brass-500/10 hover:bg-brass-500/20 text-brass-300 border border-brass-500/20 text-xs transition-all"
            >
              <div class="flex items-center gap-2 truncate">
                <svg class="w-3.5 h-3.5 text-brass-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="truncate font-medium">{{ asgn.title }}</span>
              </div>
              <span class="text-[9px] uppercase font-bold text-brass-400 bg-brass-500/20 px-1.5 py-0.5 rounded">Assignment</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Final Examination Access -->
      <div v-if="enrollment?.course" class="p-3 border-t border-slate-800 bg-slate-950/80">
        <router-link
          :to="{ name: 'student.exam', params: { slug: enrollment.course.slug } }"
          class="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm"
        >
          <div class="flex items-center gap-2">
            <span>🎓</span>
            <span>Final Certification Exam</span>
          </div>
          <span class="text-[10px] uppercase font-mono tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black">
            Take Exam
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useCoursesStore } from '../../stores/courses';
import { useUiStore } from '../../stores/ui';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import MaterialList from '../../components/ui/MaterialList.vue';
import PdfViewer from '../../components/ui/PdfViewer.vue';
import { renderRichText, estimateReadingTime, extractYouTubeId, resolveMediaUrl } from '../../lib/richText';

const route = useRoute();
const coursesStore = useCoursesStore();
const uiStore = useUiStore();

const selectedModuleId = ref(null);
const enrollment = computed(() => coursesStore.currentEnrollment);
const currentLesson = computed(() => coursesStore.currentLesson);
const currentModule = computed(() => {
  if (!enrollment.value?.modules?.length) return null;
  if (currentLesson.value) {
    const lessonMod = enrollment.value.modules.find(m => m.lessons?.some(l => l.id === currentLesson.value.id));
    if (lessonMod) return lessonMod;
  }
  if (selectedModuleId.value) {
    const byId = enrollment.value.modules.find(m => m.id === selectedModuleId.value);
    if (byId) return byId;
  }
  return enrollment.value.modules.find(m => m.is_unlocked) || enrollment.value.modules[0] || null;
});
const courseProgressPercent = computed(() => {
  if (typeof enrollment.value?.progress_percent === 'number') {
    return Math.round(enrollment.value.progress_percent);
  }
  return Number(enrollment.value?.progress_percent || 0);
});

const allAccessibleLessons = computed(() => {
  if (!enrollment.value?.modules?.length) return [];
  const list = [];
  for (const mod of enrollment.value.modules) {
    if (Array.isArray(mod.lessons)) {
      for (const les of mod.lessons) {
        if (les.is_accessible) list.push(les);
      }
    }
  }
  return list;
});

const totalAccessibleLessonsCount = computed(() => allAccessibleLessons.value.length);
const completedLessonsCount = computed(() => {
  return allAccessibleLessons.value.filter(l => isLessonCompleted(l.id)).length;
});

const prevAccessibleLesson = computed(() => {
  if (!currentLesson.value) return null;
  const idx = allAccessibleLessons.value.findIndex(l => l.id === currentLesson.value.id);
  return idx > 0 ? allAccessibleLessons.value[idx - 1] : null;
});

const nextAccessibleLesson = computed(() => {
  if (!currentLesson.value) return null;
  const idx = allAccessibleLessons.value.findIndex(l => l.id === currentLesson.value.id);
  return idx !== -1 && idx < allAccessibleLessons.value.length - 1
    ? allAccessibleLessons.value[idx + 1]
    : null;
});

const renderedCurrentLessonContent = computed(() => renderRichText(currentLesson.value?.content || '', { dark: true }));
const renderedCurrentModuleDescription = computed(() => renderRichText(currentModule.value?.description || '', { dark: true }));
const readingStats = computed(() => estimateReadingTime(currentLesson.value?.content || ''));

const loadingLesson = ref(false);
const audioPlayerRef = ref(null);
const audioProgressPercent = ref(0);

let ytPlayer = null;
let ytInterval = null;

function isLessonCompleted(lessonId) {
  return enrollment.value?.progress_map?.[lessonId]?.status === 'completed';
}

function getModuleProgress(module) {
  if (!module) return 0;
  if (Array.isArray(module.lessons) && module.lessons.length > 0) {
    const done = module.lessons.filter(l => isLessonCompleted(l.id)).length;
    return Math.round((done / module.lessons.length) * 100);
  }
  return Number(module.progress_percent || 0);
}

function resolveModuleCover(module) {
  if (!module) return '';
  return resolveMediaUrl(module.image_url || module.image_path || '');
}

function firstAccessibleLessonInModule(module) {
  if (!module?.lessons?.length) return null;
  return module.lessons.find(l => l.is_accessible) || null;
}

function selectModuleOverview(module) {
  if (!module?.is_unlocked) return;
  selectedModuleId.value = module.id;
  if (!module.lessons?.length) {
    cleanupYtPlayer();
    coursesStore.currentLesson = null;
  }
}

function formatTypeBadge(type) {
  switch (type) {
    case 'youtube': return 'bg-rose-500/20 text-rose-300';
    case 'richtext': case 'text': return 'bg-emerald-500/20 text-emerald-300';
    case 'audio': return 'bg-amber-500/20 text-amber-300';
    case 'pdf': return 'bg-sky-500/20 text-sky-300';
    default: return 'bg-slate-800 text-slate-400';
  }
}

async function selectLesson(lesson, mod = null) {
  if (!lesson.is_accessible) return;
  if (mod?.id) {
    selectedModuleId.value = mod.id;
  } else if (lesson.module_id) {
    selectedModuleId.value = lesson.module_id;
  }
  loadingLesson.value = true;
  cleanupYtPlayer();

  try {
    await coursesStore.fetchLesson(lesson.uuid);
    await nextTick();

    if (currentLesson.value?.type === 'youtube') {
      initYouTubePlayer(extractYouTubeId(currentLesson.value.youtube_video_id));
    }
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: 'Failed to load lesson.' });
  } finally {
    loadingLesson.value = false;
  }
}

async function markCurrentLessonComplete() {
  if (!currentLesson.value || isLessonCompleted(currentLesson.value.id)) return;
  try {
    await coursesStore.recordLessonProgress(currentLesson.value.uuid, {
      progress_percent: 100,
      mark_complete: true,
    });
    uiStore.notify({ type: 'success', title: 'Lesson Completed', message: 'Lesson marked as completed!' });
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: 'Could not update lesson progress.' });
  }
}

// 1. YouTube IFrame API integration with 90% completion tracker
function initYouTubePlayer(videoId) {
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => createYtPlayer(videoId);
  } else {
    createYtPlayer(videoId);
  }
}

function createYtPlayer(videoId) {
  cleanupYtPlayer();
  ytPlayer = new window.YT.Player('youtube-player', {
    videoId: videoId,
    playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
    events: {
      onStateChange: onYtStateChange,
    },
  });
}

function onYtStateChange(event) {
  if (event.data === window.YT.PlayerState.PLAYING) {
    startYtTracking();
  } else {
    stopYtTracking();
  }
}

function startYtTracking() {
  stopYtTracking();
  ytInterval = setInterval(() => {
    if (!ytPlayer || !ytPlayer.getCurrentTime || !ytPlayer.getDuration) return;
    const currentTime = ytPlayer.getCurrentTime();
    const duration = ytPlayer.getDuration();
    if (duration > 0) {
      const percent = Math.min(100, Math.round((currentTime / duration) * 100));
      if (percent >= 90 && currentLesson.value && !isLessonCompleted(currentLesson.value.id)) {
        // Trigger completion at 90%!
        coursesStore.recordLessonProgress(currentLesson.value.uuid, {
          progress_percent: 100,
          position_seconds: Math.round(currentTime),
          mark_complete: true,
        });
        uiStore.notify({ type: 'success', title: 'Lesson Completed', message: 'You have completed this video lesson!' });
        stopYtTracking();
      }
    }
  }, 1000);
}

function stopYtTracking() {
  if (ytInterval) {
    clearInterval(ytInterval);
    ytInterval = null;
  }
}

function cleanupYtPlayer() {
  stopYtTracking();
  if (ytPlayer && ytPlayer.destroy) {
    try {
      ytPlayer.destroy();
    } catch (_) {}
    ytPlayer = null;
  }
}

// 2. Audio Tracker: auto-completes at 90% played
function onAudioTimeUpdate(event) {
  const el = event.target;
  if (!el || !el.duration || el.duration <= 0) return;
  const percent = (el.currentTime / el.duration) * 100;
  audioProgressPercent.value = percent;

  if (percent >= 90 && currentLesson.value && !isLessonCompleted(currentLesson.value.id)) {
    coursesStore.recordLessonProgress(currentLesson.value.uuid, {
      progress_percent: 100,
      position_seconds: Math.round(el.currentTime),
      mark_complete: true,
    });
    uiStore.notify({ type: 'success', title: 'Lesson Completed', message: 'You have completed this audio listening lesson!' });
  }
}

// 3. PDF: Mark complete
async function markPdfComplete() {
  if (!currentLesson.value || isLessonCompleted(currentLesson.value.id)) return;
  try {
    await coursesStore.recordLessonProgress(currentLesson.value.uuid, {
      progress_percent: 100,
      mark_complete: true,
    });
    uiStore.notify({ type: 'success', title: 'Lesson Completed', message: 'PDF study marked as completed!' });
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: 'Could not update lesson progress.' });
  }
}

// 4. Rich Text: Mark complete
async function markRichtextComplete() {
  if (!currentLesson.value || isLessonCompleted(currentLesson.value.id)) return;
  try {
    await coursesStore.recordLessonProgress(currentLesson.value.uuid, {
      progress_percent: 100,
      mark_complete: true,
    });
    uiStore.notify({ type: 'success', title: 'Lesson Completed', message: 'Rich text study material marked as completed!' });
  } catch (err) {
    uiStore.notify({ type: 'error', title: 'Error', message: 'Could not update lesson progress.' });
  }
}

onMounted(async () => {
  const uuid = route.params.uuid;
  if (uuid) {
    await coursesStore.fetchEnrollment(uuid);

    if (enrollment.value?.modules?.length) {
      const firstUnlockedMod = enrollment.value.modules.find(m => m.is_unlocked) || enrollment.value.modules[0];
      if (firstUnlockedMod) {
        selectedModuleId.value = firstUnlockedMod.id;
      }

      const targetModuleId = route.query.module ? Number(route.query.module) : null;
      const targetLessonUuid = route.query.lesson ? String(route.query.lesson) : null;

      if (targetLessonUuid) {
        for (const m of enrollment.value.modules) {
          const found = m.lessons?.find(l => l.uuid === targetLessonUuid && l.is_accessible);
          if (found) {
            await selectLesson(found, m);
            return;
          }
        }
      }

      if (targetModuleId) {
        const mod = enrollment.value.modules.find(m => m.id === targetModuleId && m.is_unlocked);
        if (mod) {
          selectedModuleId.value = mod.id;
          const accessible = mod.lessons?.find(l => l.is_accessible);
          if (accessible) {
            await selectLesson(accessible, mod);
          }
          return;
        }
      }

      // Auto-select first incomplete or first accessible lesson
      for (const m of enrollment.value.modules) {
        const incompleteAccessible = m.lessons?.find(l => l.is_accessible && !isLessonCompleted(l.id));
        if (incompleteAccessible) {
          await selectLesson(incompleteAccessible, m);
          return;
        }
      }
      for (const m of enrollment.value.modules) {
        const accessible = m.lessons?.find(l => l.is_accessible);
        if (accessible) {
          await selectLesson(accessible, m);
          break;
        }
      }
    }
  }
});

onUnmounted(() => {
  cleanupYtPlayer();
});
</script>
