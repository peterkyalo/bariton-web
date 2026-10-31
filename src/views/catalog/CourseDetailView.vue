<template>
  <div class="course-detail-view bg-slate-50 min-h-screen text-slate-800 pb-24">
    <!-- 1. Hero Conservatory Banner -->
    <div class="relative bg-gradient-to-b from-slate-950 via-slate-900 to-navy-950 text-white pt-10 pb-20 sm:pb-24 border-b border-slate-800 overflow-hidden">
      <!-- Decorative Conservatory Glows & Vignette -->
      <div class="absolute -right-24 -top-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <!-- Breadcrumb Navigation -->
        <nav class="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
          <RouterLink to="/" class="hover:text-amber-400 transition-colors">Home</RouterLink>
          <span class="text-slate-600">/</span>
          <RouterLink to="/courses" class="hover:text-amber-400 transition-colors">Courses</RouterLink>
          <span class="text-slate-600">/</span>
          <span class="text-amber-400 truncate max-w-xs">{{ course?.title || 'Course Details' }}</span>
        </nav>

        <div v-if="coursesStore.loading && !course" class="py-20 flex justify-center">
          <LoadingSpinner text="Loading conservatory syllabus..." />
        </div>

        <div v-else-if="!course" class="py-16 text-center">
          <EmptyState
            title="Course not found"
            description="The course you are looking for does not exist or has been archived."
          >
            <RouterLink to="/courses" class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all">
              Return to Catalog
            </RouterLink>
          </EmptyState>
        </div>

        <!-- Banner Content Grid -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-8 space-y-5">
            <!-- Badges -->
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Conservatory Performance Path
              </span>

              <span
                v-if="course.requires_sequential_levels"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
              >
                <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Sequential Level Progression
              </span>

              <span v-if="course.is_open_for_validation" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ✓ Certification Exam Included
              </span>
            </div>

            <!-- Title & Pitch -->
            <h1 class="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
              {{ course.title }}
            </h1>

            <p v-if="course.short_description" class="text-base sm:text-lg text-slate-300 leading-relaxed font-light max-w-3xl">
              {{ course.short_description }}
            </p>
            <div
              v-else-if="course.description"
              class="prose prose-invert rich-text-content max-w-3xl text-sm sm:text-base text-slate-300"
              v-html="renderRichText(course.description, { dark: true })"
            ></div>

            <!-- Key Metadata Strip -->
            <div class="pt-4 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300 border-t border-slate-800/80">
              <div v-if="course.instructors?.length" class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                  {{ course.instructors[0].name.charAt(0) }}
                </div>
                <div>
                  <span class="text-slate-400 text-xs block">Instructor</span>
                  <span class="text-white font-medium">{{ course.instructors.map(i => i.name).join(', ') }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <span class="text-slate-400 text-xs block">Structure</span>
                  <span class="text-white font-medium">{{ course.modules?.length || 0 }} Progressive Modules</span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span class="text-slate-400 text-xs block">Pace & Credential</span>
                  <span class="text-white font-medium">Self-Paced • Verifiable Certificate</span>
                </div>
              </div>

              <div class="flex items-center gap-1.5 text-amber-400 font-semibold">
                <div class="flex text-amber-400 text-sm">★★★★★</div>
                <span class="text-slate-400 text-xs">(4.9/5 • Conservatory Cohort)</span>
              </div>
            </div>
          </div>

          <!-- Hero Course Visual Preview Card (Visible on all screen sizes) -->
          <div class="lg:col-span-4">
            <div class="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900 group relative">
              <div class="aspect-video relative overflow-hidden bg-slate-950">
                <!-- Inline Hero Video Player when active -->
                <iframe
                  v-if="playingHeroVideo && heroYoutubeId"
                  :src="`https://www.youtube.com/embed/${heroYoutubeId}?autoplay=1&rel=0`"
                  class="w-full h-full"
                  frameborder="0"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
                <template v-else>
                  <img
                    :src="courseOverviewImageUrl"
                    :alt="course.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

                  <!-- Preview Floating Trigger if available -->
                  <button
                    v-if="firstPreviewLesson"
                    type="button"
                    @click="playHeroOrModalPreview"
                    class="absolute inset-0 m-auto w-14 h-14 rounded-full bg-amber-500/90 text-slate-950 hover:bg-amber-400 hover:scale-110 flex items-center justify-center shadow-xl shadow-amber-500/40 transition-all cursor-pointer"
                    title="Watch Free Preview"
                    data-testid="hero-preview-play-btn"
                  >
                    <svg class="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </template>
              </div>

              <div class="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <button
                  v-if="firstPreviewLesson"
                  type="button"
                  @click="watchPreview(firstPreviewLesson)"
                  class="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                  <span>{{ firstPreviewLesson.title || 'Watch Free Course Preview' }}</span>
                </button>
                <span v-else class="flex items-center gap-1.5 text-amber-400 font-medium">
                  Conservatory Curriculum
                </span>
                <span class="text-slate-400">Lifetime Online Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Main Content & Pricing Sticky Grid -->
    <div v-if="course" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Course Syllabus Breakdown & Overview (8 cols) -->
        <div class="lg:col-span-8 space-y-10">
          <!-- Quick Overview Card -->
          <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
            <h2 class="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span class="w-2.5 h-6 bg-amber-500 rounded-full inline-block"></span>
              Course Overview &amp; Performance Goals
            </h2>

            <!-- Course Overview Cover Image when uploaded and not already inline in description -->
            <div
              v-if="explicitCourseCoverUrl && !descriptionHasInlineImage"
              class="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-80"
            >
              <img
                :src="explicitCourseCoverUrl"
                :alt="`${course.title} overview image`"
                class="w-full h-full max-h-80 object-cover"
                data-testid="course-overview-image"
              />
            </div>

            <div
              class="prose prose-slate rich-text-content max-w-none text-slate-600 text-sm sm:text-base leading-relaxed"
              v-html="renderRichText(course.description || course.short_description, { dark: false })"
            ></div>

            <!-- Course Promotional & Learning Materials -->
            <div v-if="course.attachments?.length" class="pt-4 border-t border-slate-100 space-y-2">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Course Preview Media &amp; Resources</h3>
              <MaterialList :attachments="course.attachments" :dark="false" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div class="flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center">1</span>
                <div>
                  <span class="font-bold text-slate-800 block">Structured Mastery</span>
                  <span>Progressive difficulty levels</span>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">2</span>
                <div>
                  <span class="font-bold text-slate-800 block">Direct Mentorship</span>
                  <span>Instructor feedback on tasks</span>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">3</span>
                <div>
                  <span class="font-bold text-slate-800 block">Graduation</span>
                  <span>Verifiable BMAS certificate</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Curriculum by Level Section -->
          <div class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 class="text-2xl font-serif font-bold text-slate-900">
                  Curriculum & Level Modules
                </h2>
                <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Enroll in the complete bundle or register for individual level modules at your own pace.
                </p>
              </div>
              <div class="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {{ course.modules?.length || 0 }} Modules • {{ totalLessonsCount }} Lessons Total
              </div>
            </div>

            <!-- Module Cards -->
            <div class="space-y-5">
              <div
                v-for="(module, mIdx) in course.modules"
                :key="module.id"
                class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden hover:border-amber-400/60 transition-all duration-200"
              >
                <!-- 1. Sleek Module Header & Compact Single-Module Action -->
                <div class="px-5 py-4 bg-slate-50/70 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <!-- Left: Module Thumbnail / Badge & Title -->
                  <div class="flex items-center gap-3.5 min-w-0 flex-1">
                    <img
                      v-if="resolveExplicitModuleCoverUrl(module)"
                      :src="resolveExplicitModuleCoverUrl(module)"
                      :alt="module.title"
                      class="w-14 h-12 sm:w-16 sm:h-12 rounded-xl object-cover border border-slate-200/90 shrink-0"
                    />
                    <div
                      v-else
                      class="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex flex-col items-center justify-center shrink-0"
                    >
                      <span class="text-[8px] font-bold uppercase tracking-wider text-amber-600/80 leading-none">Lvl</span>
                      <span class="text-sm font-serif font-extrabold leading-tight">{{ String(module.order || mIdx + 1).padStart(2, '0') }}</span>
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
                        <span :class="['px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider', levelBadgeClass(module.level)]">
                          Level {{ module.order || mIdx + 1 }} • {{ module.level }}
                        </span>
                        <span class="text-slate-300">•</span>
                        <span class="font-medium">{{ module.lessons?.length || 0 }} {{ (module.lessons?.length || 0) === 1 ? 'Lesson' : 'Lessons' }}</span>
                        <template v-if="formatModuleDuration(module)">
                          <span class="text-slate-300">•</span>
                          <span>{{ formatModuleDuration(module) }}</span>
                        </template>
                        <template v-if="module.attachments?.length">
                          <span class="text-slate-300">•</span>
                          <span class="text-amber-700 font-medium">{{ module.attachments.length }} {{ module.attachments.length === 1 ? 'Resource' : 'Resources' }}</span>
                        </template>
                      </div>

                      <h3 class="text-base sm:text-lg font-serif font-bold text-slate-900 truncate">
                        {{ module.title }}
                      </h3>
                    </div>
                  </div>

                  <!-- Right: Compact Price & Sleek Single-Module Button -->
                  <div class="flex items-center justify-between sm:justify-end gap-3.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0">
                    <template v-if="isModuleOwned(module.id) && course.upgrade_pricing?.enrollment_uuid">
                      <span class="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                        ✓ Unlocked
                      </span>
                      <RouterLink
                        :to="`/student/courses/${course.upgrade_pricing.enrollment_uuid}/player?module=${module.id}`"
                        class="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all duration-150 inline-flex items-center gap-1.5 shadow-2xs shrink-0"
                      >
                        <span>Study Module</span>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </RouterLink>
                    </template>
                    <template v-else>
                      <div class="text-left sm:text-right">
                        <div class="flex items-baseline gap-1.5 sm:justify-end">
                          <span class="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                            KES {{ module.price_formatted }}
                          </span>
                          <span class="text-[11px] font-medium text-slate-400">
                            (${{ module.price_usd_formatted }})
                          </span>
                        </div>
                        <span class="text-[10px] text-slate-400 block leading-tight">
                          Single module • Credited to bundle
                        </span>
                      </div>

                      <button
                        type="button"
                        @click="enrollInModule(module)"
                        data-testid="buy-single-module-btn"
                        class="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-semibold text-xs transition-all duration-150 inline-flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 group/buy"
                      >
                        <span>Buy Module</span>
                        <svg class="w-3.5 h-3.5 opacity-80 group-hover/buy:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </template>
                  </div>
                </div>

                <!-- 2. Full-Width Aligned Module Overview & Rich Text Syllabus -->
                <div
                  v-if="module.description"
                  class="px-5 py-4 bg-white border-b border-slate-100"
                >
                  <div
                    :class="[
                      'relative overflow-hidden transition-all duration-300',
                      isModuleDescriptionLong(module.description) && !expandedModuleDescriptions[module.id]
                        ? 'max-h-44'
                        : ''
                    ]"
                  >
                    <div
                      class="prose prose-slate rich-text-content module-rich-text max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed"
                      v-html="renderRichText(module.description, { dark: false })"
                    ></div>

                    <!-- Subtle Fade Overlay when collapsed -->
                    <div
                      v-if="isModuleDescriptionLong(module.description) && !expandedModuleDescriptions[module.id]"
                      class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"
                    ></div>
                  </div>

                  <button
                    v-if="isModuleDescriptionLong(module.description)"
                    type="button"
                    @click="toggleModuleDescription(module.id)"
                    class="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    <span>{{ expandedModuleDescriptions[module.id] ? 'Show less' : 'Read full syllabus' }}</span>
                    <svg
                      :class="['w-3.5 h-3.5 transition-transform duration-200', expandedModuleDescriptions[module.id] ? 'rotate-180' : '']"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <!-- 3. Module Learning Materials & Lessons List -->
                <div class="p-5 space-y-4 bg-white">
                  <div v-if="module.attachments?.length" class="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Module Preview Media &amp; Resources
                      </span>
                      <span class="text-[11px] text-slate-400">{{ module.attachments.length }} item(s)</span>
                    </div>
                    <MaterialList :attachments="module.attachments" :dark="false" />
                  </div>

                  <div class="space-y-2">
                    <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Lessons ({{ module.lessons?.length || 0 }})
                    </div>

                    <div
                      v-if="!module.lessons?.length"
                      class="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 text-center italic"
                    >
                      Lessons for this module are being finalized.
                    </div>

                    <div v-else class="divide-y divide-slate-100 rounded-xl border border-slate-200/70 overflow-hidden bg-slate-50/40">
                      <div
                        v-for="(lesson, lIdx) in module.lessons"
                        :key="lesson.id"
                        class="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-amber-50/30 transition-colors"
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          <span class="text-[11px] font-mono font-semibold text-slate-400 w-5 text-center shrink-0">
                            {{ String(lIdx + 1).padStart(2, '0') }}
                          </span>

                          <!-- Format Icon -->
                          <span :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', typeIconClass(lesson.type)]">
                            <svg v-if="lesson.type === 'youtube'" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <svg v-else-if="lesson.type === 'audio'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <svg v-else-if="lesson.type === 'richtext' || lesson.type === 'text'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </span>

                          <div class="min-w-0">
                            <div class="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                              <span class="truncate">{{ lesson.title }}</span>
                              <span v-if="lesson.is_preview" class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                Preview
                              </span>
                            </div>
                            <div class="text-[11px] text-slate-400">
                              {{ formatDuration(lesson.duration_seconds) }} • {{ capitalize(lesson.type) }}
                            </div>
                          </div>
                        </div>

                        <!-- Compact Watch Preview / Lock Status -->
                        <div class="shrink-0">
                          <RouterLink
                            v-if="isModuleOwned(module.id) && course.upgrade_pricing?.enrollment_uuid"
                            :to="`/student/courses/${course.upgrade_pricing.enrollment_uuid}/player?lesson=${lesson.uuid}`"
                            class="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500 text-emerald-800 hover:text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Open Lesson</span>
                          </RouterLink>
                          <button
                            v-else-if="lesson.is_preview"
                            type="button"
                            @click="watchPreview(lesson)"
                            class="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500 text-amber-800 hover:text-slate-950 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Preview</span>
                          </button>
                          <span v-else class="text-[11px] text-slate-400 inline-flex items-center gap-1">
                            <svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span class="hidden sm:inline">Enrolled</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Sticky Purchase & Validation Card Panel (4 cols) -->
        <div class="lg:col-span-4 sticky top-6 space-y-6">
          <!-- Main Conservatory Bundle Card -->
          <div class="bg-gradient-to-b from-slate-950 via-slate-900 to-navy-950 text-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-amber-500/30 relative overflow-hidden">
            <div class="absolute -right-12 -top-12 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <!-- Header Badge & Savings -->
            <div class="flex items-center justify-between pb-4 border-b border-slate-800">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400">
                All-Inclusive Conservatory Bundle
              </span>
              <span v-if="course.pricing?.bundle_savings_kes > 0" class="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950">
                Save KES {{ course.pricing.bundle_savings_formatted }}
              </span>
            </div>

            <!-- Price Display -->
            <div class="py-4 space-y-1">
              <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tuition Fee</div>
              <div class="text-3xl font-serif font-extrabold text-amber-400">
                KES {{ course.pricing?.bundle_price_formatted }}
              </div>
              <div class="text-xs font-medium text-slate-300">
                ${{ course.pricing?.bundle_price_usd_formatted }} USD
              </div>

              <!-- Price Breakdown -->
              <div class="pt-3 mt-2 border-t border-slate-800/80 text-xs space-y-1.5 text-slate-400">
                <div class="flex justify-between">
                  <span>Individual levels sum:</span>
                  <span class="line-through text-slate-500">
                    KES {{ course.pricing?.total_modules_formatted }} (${{ course.pricing?.total_modules_usd_formatted }})
                  </span>
                </div>
                <div v-if="course.pricing?.bundle_savings_kes > 0" class="flex justify-between text-emerald-400 font-semibold">
                  <span>Bundle savings discount:</span>
                  <span>- KES {{ course.pricing.bundle_savings_formatted }} (-${{ course.pricing.bundle_savings_usd_formatted }})</span>
                </div>
              </div>
            </div>

            <!-- Active Enrollment & Progress Banner if Student is Enrolled -->
            <div
              v-if="course.upgrade_pricing?.is_enrolled && course.upgrade_pricing?.enrollment_uuid"
              class="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 space-y-2 mb-4"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-emerald-300 uppercase tracking-wide">
                  ✓ Enrolled in Course
                </span>
                <span class="font-bold text-amber-400">
                  {{ Math.round(Number(course.upgrade_pricing.progress_percent || 0)) }}% Complete
                </span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-500"
                  :style="{ width: `${course.upgrade_pricing.progress_percent || 0}%` }"
                ></div>
              </div>
            </div>

            <!-- Upgrade Credit Applied if Student Owns Modules -->
            <div
              v-if="course.upgrade_pricing?.is_validation_path"
              class="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-1.5 mb-4"
            >
              <div class="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <span>⭐</span> Skills Track Credit Available
              </div>
              <p class="text-xs text-slate-300">
                <strong class="text-white">KES {{ (course.upgrade_pricing.total_paid_kes / 100).toLocaleString() }}</strong> already credited toward this course.
              </p>
              <div class="flex justify-between items-baseline pt-2 border-t border-amber-500/20 text-xs">
                <span class="text-slate-300 font-medium">Upgrade Balance:</span>
                <span class="text-base font-bold text-white">KES {{ course.upgrade_pricing.upgrade_price_formatted }}</span>
              </div>
            </div>

            <div
              v-else-if="course.upgrade_pricing?.has_owned_modules && !isFullyEnrolled"
              class="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-1.5 mb-4"
            >
              <div class="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <span>⭐</span> Module Credit Applied
              </div>
              <p class="text-xs text-slate-300">
                You already own module(s) in this course with <strong class="text-white">KES {{ (course.upgrade_pricing.total_paid_kes / 100).toLocaleString() }}</strong> previously paid.
              </p>
              <div class="flex justify-between items-baseline pt-2 border-t border-amber-500/20 text-xs">
                <span class="text-slate-300 font-medium">Upgrade Balance:</span>
                <span class="text-base font-bold text-white">KES {{ course.upgrade_pricing.upgrade_price_formatted }}</span>
              </div>
            </div>

            <!-- Enrollment CTA -->
            <div class="space-y-3 pt-1">
              <RouterLink
                v-if="course.upgrade_pricing?.is_enrolled && course.upgrade_pricing?.enrollment_uuid"
                :to="`/student/courses/${course.upgrade_pricing.enrollment_uuid}/player`"
                class="w-full py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue Learning in Player</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </RouterLink>

              <button
                v-if="authStore.isAuthenticated && !isFullyEnrolled"
                @click="openPurchaseModal"
                :class="[
                  'w-full py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2',
                  course.upgrade_pricing?.is_enrolled
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20'
                ]"
              >
                <span>{{ course.upgrade_pricing?.has_owned_modules || course.upgrade_pricing?.is_validation_path ? 'Upgrade to Full Course' : 'Enroll in Full Course' }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <RouterLink
                v-else-if="!authStore.isAuthenticated"
                to="/register"
                class="w-full py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-all text-center block"
              >
                Register to Enroll
              </RouterLink>

              <ul class="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
                <li class="flex items-center gap-2">
                  <span class="text-amber-400 font-bold">✓</span>
                  <span>Lifetime access to all lessons & future updates</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-amber-400 font-bold">✓</span>
                  <span>High-resolution sheet music & play-along audio stems</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-amber-400 font-bold">✓</span>
                  <span>Instructor assignment grading & personalized feedback</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-amber-400 font-bold">✓</span>
                  <span>Official verifiable Bariton Music Academy certificate</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Professional Validation Track Card (if open) -->
          <div
            v-if="course.is_open_for_validation && !course.upgrade_pricing?.is_validation_path"
            class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4"
          >
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                Direct Validation Track
              </span>
              <span class="text-xs text-slate-400">Assessments Only</span>
            </div>

            <div>
              <h3 class="text-base font-serif font-bold text-slate-900">
                Professional Skills Validation
              </h3>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                Skip instructional lessons and take module performance assessments plus the final examination directly to earn your official <strong>Certificate of Skills Validation</strong>.
              </p>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Assessment Fee</span>
                <span class="text-2xl font-serif font-bold text-slate-900">
                  KES {{ course.validation_pricing?.price_kes_formatted }}
                </span>
                <span class="text-xs text-slate-500 ml-1">
                  (${{ course.validation_pricing?.price_usd_formatted }} USD)
                </span>
              </div>
            </div>

            <button
              @click="enrollInValidationTrack"
              class="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition border border-slate-300 text-center block cursor-pointer"
            >
              Take Practical Assessments Only
            </button>
            <p class="text-[10px] text-slate-400 text-center">
              Credit can be upgraded to the complete instructional bundle anytime.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Free Preview Lesson Modal -->
    <Modal :open="showPreviewModal" :show="showPreviewModal" @close="closePreviewModal" max-width="max-w-3xl">
      <div v-if="previewLesson" class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Free Conservatory Preview</span>
            <h3 class="text-xl font-serif font-bold text-white">{{ previewLesson.title }}</h3>
          </div>
          <button @click="closePreviewModal" class="text-slate-400 hover:text-white p-1 cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 1. YouTube Preview -->
        <div v-if="previewLesson.type === 'youtube'" class="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
          <iframe
            :src="`https://www.youtube.com/embed/${extractYouTubeId(previewLesson.youtube_video_id)}?autoplay=1&rel=0`"
            class="w-full h-full"
            frameborder="0"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>

        <!-- 2. Rich Text Guide Preview -->
        <div v-else-if="previewLesson.type === 'richtext' || previewLesson.type === 'text'" class="p-6 rounded-xl bg-slate-900/90 border border-slate-700 max-h-96 overflow-y-auto">
          <div class="prose prose-invert rich-text-content max-w-none text-sm" v-html="renderRichText(previewLesson.content, { dark: true })"></div>
        </div>

        <!-- 3. Audio Masterclass Preview -->
        <div v-else-if="previewLesson.type === 'audio'" class="p-6 rounded-xl bg-slate-900/90 border border-amber-500/30 text-center space-y-4">
          <p class="text-xs text-amber-300 font-medium">Free Audio Masterclass Preview</p>
          <audio :src="resolveMediaUrl(previewLesson.stream_url)" controls class="w-full"></audio>
        </div>

        <!-- 4. PDF Sheet Music Preview (Inline Scrollable PDF Reader) -->
        <div v-else-if="previewLesson.type === 'pdf'" class="space-y-3">
          <PdfViewer
            v-if="previewLesson.stream_url"
            :src="resolveMediaUrl(previewLesson.stream_url)"
            :title="previewLesson.file_name || previewLesson.title"
            :file-size-bytes="previewLesson.file_size_bytes"
            :dark="true"
            :default-open="true"
            height-class="h-[520px]"
          />
        </div>

        <p v-if="previewLesson.summary" class="text-sm text-slate-300 leading-relaxed">
          {{ previewLesson.summary }}
        </p>

        <div class="pt-3 border-t border-white/10 flex justify-end">
          <button
            @click="closePreviewModal"
            class="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCoursesStore } from '../../stores/courses';
import { useAuthStore } from '../../stores/auth';
import { useUiStore } from '../../stores/ui';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Modal from '../../components/ui/Modal.vue';
import MaterialList from '../../components/ui/MaterialList.vue';
import PdfViewer from '../../components/ui/PdfViewer.vue';
import {
  renderRichText,
  resolveMediaUrl,
  extractYouTubeId,
  extractFirstImageUrl,
  getYouTubeThumbnail,
} from '../../lib/richText';

const route = useRoute();
const router = useRouter();
const coursesStore = useCoursesStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const course = computed(() => coursesStore.currentCourse);
const showPreviewModal = ref(false);
const previewLesson = ref(null);
const playingHeroVideo = ref(false);
const expandedModuleDescriptions = reactive({});

const firstPreviewLesson = computed(() => {
  if (!course.value) return null;

  // 1. Explicit preview lesson
  if (course.value.modules) {
    for (const mod of course.value.modules) {
      if (mod.lessons) {
        const prev = mod.lessons.find(l => l.is_preview);
        if (prev) return prev;
      }
    }
  }

  // 2. Course-level YouTube attachment
  const courseYt = (course.value.attachments || []).find(a => a.kind === 'youtube' && a.youtube_video_id);
  if (courseYt) {
    return {
      id: `att-${courseYt.id}`,
      title: courseYt.title || `${course.value.title} — Course Preview`,
      type: 'youtube',
      youtube_video_id: courseYt.youtube_video_id,
      is_preview: true,
    };
  }

  // 3. Module-level YouTube attachment or first YouTube lesson
  if (course.value.modules) {
    for (const mod of course.value.modules) {
      const modYt = (mod.attachments || []).find(a => a.kind === 'youtube' && a.youtube_video_id);
      if (modYt) {
        return {
          id: `mod-att-${modYt.id}`,
          title: modYt.title || `${mod.title} — Preview`,
          type: 'youtube',
          youtube_video_id: modYt.youtube_video_id,
          is_preview: true,
        };
      }
      const ytLesson = (mod.lessons || []).find(l => l.type === 'youtube' && l.youtube_video_id);
      if (ytLesson) return ytLesson;
    }
  }

  return null;
});

const heroYoutubeId = computed(() => {
  if (firstPreviewLesson.value?.type === 'youtube' && firstPreviewLesson.value.youtube_video_id) {
    return extractYouTubeId(firstPreviewLesson.value.youtube_video_id);
  }
  return '';
});

const explicitCourseCoverUrl = computed(() => {
  if (!course.value) return '';
  const direct = resolveMediaUrl(course.value.thumbnail_url || course.value.thumbnail_path);
  if (direct) return direct;
  const imgAtt = (course.value.attachments || []).find(a => a.kind === 'image' && a.url);
  if (imgAtt) return resolveMediaUrl(imgAtt.url);
  return '';
});

const descriptionHasInlineImage = computed(() => {
  return Boolean(extractFirstImageUrl(course.value?.description));
});

const courseOverviewImageUrl = computed(() => {
  if (explicitCourseCoverUrl.value) return explicitCourseCoverUrl.value;
  const fromDesc = extractFirstImageUrl(course.value?.description);
  if (fromDesc) return fromDesc;
  if (course.value?.modules) {
    for (const mod of course.value.modules) {
      const modImg = resolveModuleImageUrl(mod);
      if (modImg) return modImg;
    }
  }
  if (heroYoutubeId.value) {
    return getYouTubeThumbnail(heroYoutubeId.value, 'hqdefault');
  }
  return 'https://images.unsplash.com/photo-1520523839898-507127b31130?auto=format&fit=crop&w=800&q=80';
});

function resolveModuleImageUrl(module) {
  if (!module) return '';
  return (
    resolveMediaUrl(module.image_url || module.image_path) ||
    extractFirstImageUrl(module.description)
  );
}

/**
 * Resolve module header thumbnail without duplicating an image that is already rendered
 * inside the full-width module rich-text description right below the header.
 */
function resolveExplicitModuleCoverUrl(module) {
  if (!module) return '';
  return resolveMediaUrl(module.image_url || module.image_path);
}

function isModuleDescriptionLong(desc) {
  if (!desc || typeof desc !== 'string') return false;
  return desc.length > 420 || /!\[[^\]]*\]\([^)]+\)|<img\s/i.test(desc);
}

function toggleModuleDescription(moduleId) {
  expandedModuleDescriptions[moduleId] = !expandedModuleDescriptions[moduleId];
}

function formatModuleDuration(module) {
  if (!module?.lessons?.length) return '';
  const totalSecs = module.lessons.reduce((sum, l) => sum + Number(l.duration_seconds || 0), 0);
  if (totalSecs <= 0) return 'Self-paced';
  const mins = Math.max(1, Math.round(totalSecs / 60));
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  }
  return `${mins} mins`;
}

function playHeroOrModalPreview() {
  if (heroYoutubeId.value) {
    playingHeroVideo.value = true;
  } else if (firstPreviewLesson.value) {
    watchPreview(firstPreviewLesson.value);
  }
}

const totalLessonsCount = computed(() => {
  if (!course.value?.modules) return 0;
  return course.value.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
});

const ownedModuleIdSet = computed(() => {
  return new Set(course.value?.upgrade_pricing?.owned_module_ids || []);
});

function isModuleOwned(moduleId) {
  return ownedModuleIdSet.value.has(moduleId);
}

const isFullyEnrolled = computed(() => {
  const mods = course.value?.modules || [];
  if (!mods.length || !course.value?.upgrade_pricing?.has_owned_modules) return false;
  return mods.every(m => ownedModuleIdSet.value.has(m.id));
});

function levelBadgeClass(level) {
  if (level === 'beginner') return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
  if (level === 'intermediate') return 'bg-amber-100 text-amber-800 border border-amber-300';
  return 'bg-purple-100 text-purple-800 border border-purple-300';
}

function typeIconClass(type) {
  if (type === 'youtube') return 'bg-rose-100 text-rose-600 border border-rose-200';
  if (type === 'audio') return 'bg-amber-100 text-amber-600 border border-amber-200';
  if (type === 'richtext' || type === 'text') return 'bg-emerald-100 text-emerald-600 border border-emerald-200';
  return 'bg-sky-100 text-sky-600 border border-sky-200';
}

function formatDuration(seconds) {
  if (!seconds) return 'Self-paced';
  const mins = Math.floor(seconds / 60);
  return `${mins} mins`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function watchPreview(lesson) {
  previewLesson.value = lesson;
  showPreviewModal.value = true;
}

function closePreviewModal() {
  showPreviewModal.value = false;
  previewLesson.value = null;
}

function openPurchaseModal() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  if (course.value?.upgrade_pricing?.has_owned_modules || course.value?.upgrade_pricing?.is_validation_path) {
    router.push({ path: '/checkout', query: { type: 'bundle_upgrade', id: course.value.id } });
  } else {
    router.push({ path: '/checkout', query: { type: 'course_bundle', id: course.value.id } });
  }
}

function enrollInValidationTrack() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  router.push({ path: '/checkout', query: { type: 'assessment_package', id: course.value.id } });
}

function enrollInModule(module) {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  router.push({ path: '/checkout', query: { type: 'module', id: module.id } });
}

onMounted(async () => {
  const slug = route.params.slug;
  if (slug) {
    await coursesStore.fetchCourse(slug);
  }
});
</script>

<style scoped>
.module-rich-text :deep(img) {
  max-height: 240px;
  width: auto;
  object-fit: cover;
  border-radius: 0.75rem;
}
</style>
