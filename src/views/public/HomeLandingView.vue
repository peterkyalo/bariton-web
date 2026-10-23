<template>
  <div class="landing-page font-sans bg-white text-slate-800 antialiased selection:bg-amber-500 selection:text-white">
    <!-- Hero Carousel Slider (matches index.html) -->
    <section class="relative bg-slate-950 overflow-hidden min-h-[580px] lg:min-h-[640px] flex items-center">
      <!-- Carousel Slide -->
      <transition name="fade" mode="out-in">
        <div :key="currentSlideIndex" class="absolute inset-0 z-0">
          <img :src="currentSlide.image" :alt="currentSlide.title" class="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out" />
          <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-900/60"></div>
        </div>
      </transition>

      <!-- Slide Content -->
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div class="max-w-3xl">
          <!-- Animated Badge -->
          <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-6">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            {{ currentSlide.badge }}
          </span>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight mb-6">
            {{ currentSlide.title }}
          </h1>

          <p class="text-lg sm:text-xl text-slate-200 mb-8 font-normal leading-relaxed max-w-2xl">
            {{ currentSlide.subtitle }}
          </p>

          <div class="flex flex-wrap items-center gap-4">
            <router-link :to="currentSlide.cta_primary_link || '/courses'" class="px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-105">
              {{ currentSlide.cta_primary_text || 'Explore Courses' }}
            </router-link>
            <router-link :to="currentSlide.cta_secondary_link || '/register'" class="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 backdrop-blur-sm transition-all hover:scale-105">
              {{ currentSlide.cta_secondary_text || 'Join Now' }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Slider Controls & Indicators -->
      <div class="absolute bottom-6 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <!-- Dots -->
        <div class="flex items-center gap-2">
          <button v-for="(slide, idx) in slides" :key="slide.id" @click="setSlide(idx)" class="h-2.5 rounded-full transition-all" :class="idx === currentSlideIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/40 hover:bg-white/70'"></button>
        </div>

        <!-- Arrows -->
        <div class="flex items-center gap-2">
          <button @click="prevSlide" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button @click="nextSlide" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Services Highlights (4 Cards - matches index.html) -->
    <section class="py-16 bg-slate-50 relative -mt-8 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="(service, sIdx) in servicesList" :key="sIdx" class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-slate-100 hover:-translate-y-1 group">
            <div class="w-14 h-14 rounded-xl bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-white flex items-center justify-center mb-6 transition-colors shadow-inner">
              <svg v-if="sIdx === 0" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-5.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
              <svg v-else-if="sIdx === 1" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <svg v-else-if="sIdx === 2" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">{{ service.title }}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section (matches index.html) -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Image -->
          <div class="lg:col-span-6 relative">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-50">
              <img :src="aboutBlock.image || 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?auto=format&fit=crop&w=800&q=80'" alt="Conservatory Rehearsal" class="w-full h-[460px] object-cover object-center" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
              <!-- Floating Pill -->
              <div class="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-lg flex items-center justify-between">
                <div>
                  <span class="block text-xs uppercase font-bold text-amber-600">Kilimani, Nairobi Campus</span>
                  <span class="text-sm font-bold text-slate-900">Acoustic Recital Hall & Coaching Studios</span>
                </div>
                <div class="text-amber-500 font-extrabold text-2xl">★ 4.9</div>
              </div>
            </div>
          </div>

          <!-- Narrative Text -->
          <div class="lg:col-span-6 space-y-6">
            <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200/50 px-3.5 py-1 rounded-full">
              {{ aboutBlock.tag || 'About Us' }}
            </span>
            <h2 class="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
              {{ aboutBlock.title || 'Welcome to Bariton Music Academy' }}
            </h2>
            <p class="text-base text-slate-600 leading-relaxed font-normal">
              {{ aboutBlock.lead || 'Founded in Nairobi, Kenya, Bariton Music Academy is dedicated to nurturing world-class musical talent across classical disciplines, contemporary African jazz, and sacred gospel traditions.' }}
            </p>
            <p class="text-base text-slate-600 leading-relaxed">
              {{ aboutBlock.body || 'Whether you are a beginner picking up your first instrument or an advanced musician preparing for international conservatory auditions, our modular curriculum and 1-on-1 tutoring ensure steady, measurable artistic growth.' }}
            </p>

            <!-- Checklist Features -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div v-for="(feat, fIdx) in (aboutBlock.features || defaultAboutFeatures)" :key="fIdx" class="flex items-center gap-2.5">
                <div class="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span class="text-sm font-semibold text-slate-700">{{ feat }}</span>
              </div>
            </div>

            <div class="pt-4">
              <router-link to="/about" class="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-md hover:shadow-lg">
                <span>Learn More About Us</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Section (matches index.html) -->
    <section class="py-20 bg-slate-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100/50 px-3 py-1 rounded-full mb-3">Categories</span>
          <h2 class="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">Instrument Syllabi & Disciplines</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <router-link v-for="(cat, cIdx) in categoriesList" :key="cIdx" to="/courses" class="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all aspect-[4/5] flex items-end p-6 border border-slate-100">
            <img :src="cat.image" :alt="cat.title" class="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
            <div class="relative z-10 w-full">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 backdrop-blur-sm px-2.5 py-1 rounded-md">{{ cat.count_text }}</span>
              <h3 class="text-xl font-serif font-bold text-white mt-2 group-hover:text-amber-400 transition-colors">{{ cat.title }}</h3>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Popular Courses Catalog Spotlight -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
          <div>
            <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-2">Curriculum</span>
            <h2 class="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">Featured Conservatory Courses</h2>
          </div>
          <router-link to="/courses" class="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            <span>Browse All Courses</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </router-link>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="course in featuredCourses" :key="course.id" class="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-amber-500/30 transition-all flex flex-col justify-between group">
            <div class="relative aspect-[16/10] overflow-hidden bg-slate-900">
              <img :src="course.thumbnail_path || course.image_url || 'https://images.unsplash.com/photo-1520523839898-507127b31130?auto=format&fit=crop&w=600&q=80'" :alt="course.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div class="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-sm text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {{ course.level ? course.level.toUpperCase() : 'CONSERVATORY' }}
              </div>
            </div>
            <div class="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                  <span>{{ course.modules_count || 3 }} Modules</span>
                  <div class="flex items-center text-amber-500 gap-1">
                    <span>★★★★★</span>
                    <span class="text-slate-400 text-[11px]">(128)</span>
                  </div>
                </div>
                <h3 class="text-xl font-serif font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-1">
                  {{ course.title }}
                </h3>
                <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {{ course.short_description || course.description }}
                </p>
              </div>
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase text-slate-400 font-bold block">Complete Bundle</span>
                  <span class="text-lg font-bold text-slate-900">
                    {{ course.pricing ? 'KES ' + course.pricing.bundle_price_formatted : formatKes(course.price_kes || 1500000) }}
                  </span>
                </div>
                <router-link :to="`/courses/${course.slug}`" class="px-5 py-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm hover:shadow-md">
                  Enroll Now
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Faculty Instructors Section (matches index.html) -->
    <section class="py-20 bg-slate-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100/50 px-3 py-1 rounded-full mb-3">Instructors</span>
          <h2 class="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">Meet Our Master Faculty</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="(inst, iIdx) in instructorsList" :key="iIdx" class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div class="aspect-[4/5] overflow-hidden bg-slate-900 relative">
              <img :src="inst.image" :alt="inst.name" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div class="p-6 text-center">
              <h3 class="text-lg font-serif font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">{{ inst.name }}</h3>
              <p class="text-xs font-bold text-amber-600 mb-1">{{ inst.designation }}</p>
              <p class="text-xs text-slate-500">{{ inst.specialty }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section (matches index.html) -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-3">Testimonials</span>
          <h2 class="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">What Our Students Say</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="(t, tIdx) in testimonialsList" :key="tIdx" class="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div class="text-amber-500 mb-4">★★★★★</div>
              <p class="text-slate-700 text-sm leading-relaxed italic mb-6">"{{ t.quote }}"</p>
            </div>
            <div class="flex items-center gap-3 pt-4 border-t border-slate-200/60">
              <img :src="t.avatar" :alt="t.name" class="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40" />
              <div>
                <h4 class="text-sm font-bold text-slate-900">{{ t.name }}</h4>
                <p class="text-xs text-slate-500">{{ t.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCmsStore } from '@/stores/cms'
import { useCoursesStore } from '@/stores/courses'

const auth = useAuthStore()
const cmsStore = useCmsStore()
const coursesStore = useCoursesStore()

const currentSlideIndex = ref(0)
let slideTimer = null

// Fallback slides
const fallbackSlides = [
  {
    id: 1,
    badge: 'Premier Music Conservatory & Masterclasses',
    title: 'The Best Online Music Learning Platform',
    subtitle: 'Master classical piano, contemporary jazz, African gospel, strings, and vocal technique with distinguished virtuoso instructors from Nairobi to the world.',
    cta_primary_text: 'Explore Courses',
    cta_primary_link: '/courses',
    cta_secondary_text: 'Join Now',
    cta_secondary_link: '/register',
    image: 'https://images.unsplash.com/photo-1520523839898-507127b31130?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 2,
    badge: '1-on-1 Mentorship & Residential Bootcamps',
    title: 'Get Educated in Music Online & In Nairobi',
    subtitle: 'Combine flexible online video curriculum with intimate 1-on-1 faculty coaching and immersive multi-day residential masterclasses in Kilimani.',
    cta_primary_text: 'Physical Bootcamps',
    cta_primary_link: '/events',
    cta_secondary_text: 'Book Tutoring',
    cta_secondary_link: '/tutoring',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 3,
    badge: 'Verifiable Diplomas & Examinations',
    title: 'Earn Internationally Verifiable Credentials',
    subtitle: 'Complete rigorous jury assessments and receive tamper-proof cryptographic certificates that employers, universities, and performance venues can instantly verify.',
    cta_primary_text: 'Verify Certificate',
    cta_primary_link: '/verify',
    cta_secondary_text: 'Course Catalog',
    cta_secondary_link: '/courses',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1600&q=80',
  },
]

const slides = computed(() => {
  return cmsStore.currentPage?.sections?.hero_slides || fallbackSlides
})

const currentSlide = computed(() => {
  return slides.value[currentSlideIndex.value] || slides.value[0] || fallbackSlides[0]
})

const servicesList = computed(() => {
  return (
    cmsStore.currentPage?.sections?.services || [
      {
        title: 'Skilled Instructors',
        description: 'Learn directly from concert pianists, orchestral cellists, veteran praise directors, and award-winning recording producers.',
      },
      {
        title: 'Online Classes',
        description: 'Multi-angle HD lesson streams with step-by-step fingering diagrams, printable sheet music, and practice stems.',
      },
      {
        title: 'Studio Masterclasses',
        description: 'Intimate physical weekend workshops and residential intensives with live rhythm sections and acoustic auditoriums.',
      },
      {
        title: 'Verifiable Diplomas',
        description: 'Cryptographically signed certificates of mastery and skills validation verifiable anywhere via unique codes.',
      },
    ]
  )
})

const aboutBlock = computed(() => {
  return cmsStore.currentPage?.sections?.about_block || {}
})

const defaultAboutFeatures = [
  'Distinguished Conservatory Faculty',
  'Flexible Online & Residential Paths',
  'Tamper-Proof Digital Certification',
  'M-Pesa & International Card Checkout',
  'Resumable HD Video Submissions',
  'Dedicated 1-on-1 Mentorship Studios',
]

const categoriesList = computed(() => {
  return (
    cmsStore.currentPage?.sections?.categories || [
      {
        title: 'Classical Piano',
        count_text: '12 Modules',
        image: 'https://images.unsplash.com/photo-1520523839898-507127b31130?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'African Gospel & Jazz',
        count_text: '10 Modules',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Strings & Orchestral Cello',
        count_text: '8 Modules',
        image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Vocal Technique & Production',
        count_text: '9 Modules',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
      },
    ]
  )
})

const instructorsList = computed(() => {
  return (
    cmsStore.currentPage?.sections?.instructors_spotlight || [
      {
        name: 'Maestro David Ochieng',
        designation: 'Chair of Piano & Composition',
        specialty: 'Classical Repertoire & Polyphony',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Sarah Wanjiku',
        designation: 'Director of Vocal Studies',
        specialty: 'Bel Canto & Contemporary Vocals',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Prof. Brian Otieno',
        designation: 'Principal Strings Instructor',
        specialty: 'Violin, Viola & Chamber Music',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Angela Muthoni',
        designation: 'Instructor of Gospel & Jazz Harmony',
        specialty: 'East African Gospel Progressions',
        image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
      },
    ]
  )
})

const testimonialsList = computed(() => {
  return (
    cmsStore.currentPage?.sections?.testimonials || [
      {
        name: 'Grace Mwangi',
        role: 'Conservatory Piano Graduate',
        quote: 'The module progression and rubric feedback gave me the discipline I needed to prepare for international competitions. Having my certificate verifiable online made university admission seamless.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      },
      {
        name: 'Emmanuel Kiprotich',
        role: 'Music Director, Nairobi',
        quote: 'The African Gospel Keyboard workshop opened my eyes to passing chords and modulation techniques. The 1-on-1 tutoring sessions with Angela were worth every single shilling.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      },
      {
        name: 'Cynthia Ndinda',
        role: 'Vocal Performance Student',
        quote: 'Studying with Dr. Sarah completely eliminated vocal strain and extended my upper register by a major third. The resumable video uploads made submitting assignments so convenient.',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
      },
    ]
  )
})

const featuredCourses = computed(() => {
  if (coursesStore.catalog && coursesStore.catalog.length > 0) {
    return coursesStore.catalog.slice(0, 3)
  }
  return [
    {
      id: 1,
      title: 'Classical Piano Mastery: Bach to Chopin',
      slug: 'classical-piano-mastery',
      description: 'Comprehensive polyphonic technique, expressive rubato, and concert repertoire mastery.',
      level: 'intermediate',
      price_kes: 1500000,
      modules_count: 12,
      image_url: 'https://images.unsplash.com/photo-1520523839898-507127b31130?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 2,
      title: 'African Contemporary Gospel Keyboard',
      slug: 'african-contemporary-gospel-keyboard',
      description: 'Master passing chords, tritones, dominant substitutions, and traditional worship patterns.',
      level: 'advanced',
      price_kes: 1200000,
      modules_count: 10,
      image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 3,
      title: 'Conservatory Cello Performance & Technique',
      slug: 'conservatory-cello-performance',
      description: 'Bach solo suites, tone production, vibrato control, and thumb position mastery.',
      level: 'all_levels',
      price_kes: 1800000,
      modules_count: 8,
      image_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
    },
  ]
})

function formatKes(centsOrKes) {
  const kes = centsOrKes > 100000 ? centsOrKes / 100 : centsOrKes
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(kes)
}

function nextSlide() {
  currentSlideIndex.value = (currentSlideIndex.value + 1) % slides.value.length
}

function prevSlide() {
  currentSlideIndex.value = (currentSlideIndex.value - 1 + slides.value.length) % slides.value.length
}

function setSlide(idx) {
  currentSlideIndex.value = idx
}

onMounted(async () => {
  cmsStore.fetchPage('home').catch(() => {})
  coursesStore.fetchCatalog().catch(() => {})
  slideTimer = setInterval(nextSlide, 7000)
})

onUnmounted(() => {
  if (slideTimer) clearInterval(slideTimer)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.7s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
