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
              class="prose prose-invert max-w-3xl text-sm sm:text-base text-slate-300"
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

          <!-- Hero Course Visual Preview Card -->
          <div class="lg:col-span-4 hidden lg:block">
            <div class="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900 group relative">
              <div class="aspect-video relative overflow-hidden bg-slate-950">
                <img
                  :src="course.thumbnail_url || course.thumbnail_path || 'https://images.unsplash.com/photo-1520523839898-507127b31130?auto=format&fit=crop&w=800&q=80'"
                  :alt="course.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

                <!-- Preview Floating Trigger if available -->
                <button
                  v-if="firstPreviewLesson"
                  @click="watchPreview(firstPreviewLesson)"
                  class="absolute inset-0 m-auto w-14 h-14 rounded-full bg-amber-500/90 text-slate-950 hover:bg-amber-400 hover:scale-110 flex items-center justify-center shadow-xl shadow-amber-500/40 transition-all cursor-pointer"
                  title="Watch Free Preview"
                >
                  <svg class="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>

              <div class="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span class="flex items-center gap-1.5 text-amber-400 font-medium">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                  Free Sample Lesson Available
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
          <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
            <h2 class="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span class="w-2.5 h-6 bg-amber-500 rounded-full inline-block"></span>
              Course Overview &amp; Performance Goals
            </h2>
            <div
              class="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed"
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
            <div class="space-y-6">
              <div
                v-for="module in course.modules"
                :key="module.id"
                class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-amber-400/50 transition-all duration-300"
              >
                <!-- Module Header -->
                <div class="p-6 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div class="flex items-start gap-4 max-w-xl">
                    <img
                      v-if="module.image_url"
                      :src="module.image_url"
                      :alt="module.title"
                      class="w-24 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2">
                        <span :class="['px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider', levelBadgeClass(module.level)]">
                          Level {{ module.order }}: {{ module.level }}
                        </span>
                        <span class="text-xs text-slate-400 font-medium">• {{ module.lessons?.length || 0 }} Lessons</span>
                      </div>

                      <h3 class="text-xl font-serif font-bold text-slate-900">
                        {{ module.title }}
                      </h3>

                      <div
                        v-if="module.description"
                        class="prose prose-slate max-w-none text-xs text-slate-600 leading-relaxed"
                        v-html="renderRichText(module.description, { dark: false })"
                      ></div>
                    </div>
                  </div>

                  <!-- Individual Module Pricing Card -->
                  <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-right shrink-0 min-w-[200px]">
                    <span class="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Single Level Price</span>
                    <div class="text-2xl font-serif font-bold text-slate-900">
                      KES {{ module.price_formatted }}
                    </div>
                    <div class="text-xs font-medium text-slate-500">
                      ${{ module.price_usd_formatted }} USD
                    </div>
                    <button
                      @click="enrollInModule(module)"
                      class="mt-3 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Enroll in Level Only
                    </button>
                  </div>
                </div>

                <!-- Lessons & Media in this module -->
                <div class="p-6 space-y-4">
                  <div v-if="module.attachments?.length" class="space-y-2 pb-3 border-b border-slate-100">
                    <div class="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Module Preview Media &amp; Materials
                    </div>
                    <MaterialList :attachments="module.attachments" :dark="false" />
                  </div>

                  <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Lessons in this Level ({{ module.lessons?.length || 0 }})
                  </div>

                  <div
                    v-for="lesson in module.lessons"
                    :key="lesson.id"
                    class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-amber-50/30 hover:border-amber-300/40 transition-colors"
                  >
                    <div class="flex items-center gap-3.5">
                      <!-- Format Icon -->
                      <span :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm', typeIconClass(lesson.type)]">
                        <svg v-if="lesson.type === 'youtube'" class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <svg v-else-if="lesson.type === 'audio'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <svg v-else-if="lesson.type === 'richtext' || lesson.type === 'text'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </span>

                      <div>
                        <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <span>{{ lesson.title }}</span>
                          <span v-if="lesson.is_preview" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Free Preview
                          </span>
                        </div>
                        <div class="text-xs text-slate-500 mt-0.5">
                          {{ formatDuration(lesson.duration_seconds) }} • {{ capitalize(lesson.type) }} Instruction
                        </div>
                      </div>
                    </div>

                    <!-- Watch Preview / Lock Status -->
                    <div>
                      <button
                        v-if="lesson.is_preview"
                        @click="watchPreview(lesson)"
                        class="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Watch Sample
                      </button>
                      <span v-else class="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Enrolled Access
                      </span>
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
            <div class="py-5 space-y-1">
              <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tuition Fee</div>
              <div class="text-4xl font-serif font-extrabold text-amber-400">
                KES {{ course.pricing?.bundle_price_formatted }}
              </div>
              <div class="text-sm font-medium text-slate-300">
                ${{ course.pricing?.bundle_price_usd_formatted }} USD
              </div>

              <!-- Price Breakdown -->
              <div class="pt-4 mt-2 border-t border-slate-800/80 text-xs space-y-1.5 text-slate-400">
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

            <!-- Upgrade Credit Applied if Student Owns Modules -->
            <div
              v-if="course.upgrade_pricing?.is_validation_path"
              class="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-2 mb-4"
            >
              <div class="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <span>⭐</span> Skills Track Credit Available
              </div>
              <p class="text-xs text-slate-300">
                <strong class="text-white">KES {{ (course.upgrade_pricing.total_paid_kes / 100).toLocaleString() }}</strong> already credited toward this course.
              </p>
              <div class="flex justify-between items-baseline pt-2 border-t border-amber-500/20 text-xs">
                <span class="text-slate-300 font-medium">Upgrade Balance:</span>
                <span class="text-lg font-bold text-white">KES {{ course.upgrade_pricing.upgrade_price_formatted }}</span>
              </div>
            </div>

            <div
              v-else-if="course.upgrade_pricing?.has_owned_modules"
              class="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-2 mb-4"
            >
              <div class="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <span>⭐</span> Module Credit Applied
              </div>
              <p class="text-xs text-slate-300">
                You already own module(s) in this course with <strong class="text-white">KES {{ (course.upgrade_pricing.total_paid_kes / 100).toLocaleString() }}</strong> previously paid.
              </p>
              <div class="flex justify-between items-baseline pt-2 border-t border-amber-500/20 text-xs">
                <span class="text-slate-300 font-medium">Upgrade Balance:</span>
                <span class="text-lg font-bold text-white">KES {{ course.upgrade_pricing.upgrade_price_formatted }}</span>
              </div>
            </div>

            <!-- Enrollment CTA -->
            <div class="space-y-3 pt-2">
              <button
                v-if="authStore.isAuthenticated"
                @click="openPurchaseModal"
                class="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{{ course.upgrade_pricing?.has_owned_modules || course.upgrade_pricing?.is_validation_path ? 'Upgrade to Full Course' : 'Enroll in Full Course' }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <RouterLink
                v-else
                to="/register"
                class="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-500/25 transition-all text-center block"
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
      <div v-if="previewLesson" class="p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">Free Conservatory Preview</span>
            <h3 class="text-xl font-serif font-bold text-slate-900">{{ previewLesson.title }}</h3>
          </div>
          <button @click="closePreviewModal" class="text-slate-400 hover:text-slate-700 p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 1. YouTube Preview -->
        <div v-if="previewLesson.type === 'youtube'" class="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
          <iframe
            :src="`https://www.youtube.com/embed/${previewLesson.youtube_video_id}?autoplay=1&rel=0`"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>

        <!-- 2. Rich Text Guide Preview -->
        <div v-else-if="previewLesson.type === 'richtext' || previewLesson.type === 'text'" class="p-6 rounded-xl bg-slate-50 border border-slate-200 max-h-96 overflow-y-auto">
          <div class="prose prose-slate max-w-none text-sm" v-html="renderRichText(previewLesson.content)"></div>
        </div>

        <!-- 3. Audio Masterclass Preview -->
        <div v-else-if="previewLesson.type === 'audio'" class="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-4">
          <p class="text-xs text-amber-800 font-medium">Free Audio Masterclass Preview</p>
          <audio :src="previewLesson.stream_url" controls class="w-full"></audio>
        </div>

        <!-- 4. PDF Sheet Music Preview (Inline Scrollable PDF Reader) -->
        <div v-else-if="previewLesson.type === 'pdf'" class="space-y-3">
          <PdfViewer
            v-if="previewLesson.stream_url"
            :src="previewLesson.stream_url"
            :title="previewLesson.file_name || previewLesson.title"
            :file-size-bytes="previewLesson.file_size_bytes"
            :dark="false"
            :default-open="true"
            height-class="h-[520px]"
          />
        </div>

        <p class="text-sm text-slate-600 leading-relaxed">
          {{ previewLesson.summary }}
        </p>

        <div class="pt-3 border-t border-slate-200 flex justify-end">
          <button
            @click="closePreviewModal"
            class="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCoursesStore } from '../../stores/courses';
import { useAuthStore } from '../../stores/auth';
import { useUiStore } from '../../stores/ui';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Modal from '../../components/ui/Modal.vue';
import MaterialList from '../../components/ui/MaterialList.vue';
import PdfViewer from '../../components/ui/PdfViewer.vue';
import { renderRichText } from '../../lib/richText';

const route = useRoute();
const router = useRouter();
const coursesStore = useCoursesStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const course = computed(() => coursesStore.currentCourse);
const showPreviewModal = ref(false);
const previewLesson = ref(null);

const firstPreviewLesson = computed(() => {
  if (!course.value?.modules) return null;
  for (const mod of course.value.modules) {
    if (mod.lessons) {
      const prev = mod.lessons.find(l => l.is_preview);
      if (prev) return prev;
    }
  }
  return null;
});

const totalLessonsCount = computed(() => {
  if (!course.value?.modules) return 0;
  return course.value.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
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
