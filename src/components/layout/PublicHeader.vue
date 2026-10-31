<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const dropdownOpen = ref(false)
const mobileMenuOpen = ref(false)

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const isPagesActive = computed(() => {
  return ['/team', '/testimonials', '/verify', '/terms', '/privacy'].some(p => route.path.startsWith(p))
})

const closeMobile = () => {
  mobileMenuOpen.value = false
  dropdownOpen.value = false
}

async function handleLogout() {
  await auth.logout()
  closeMobile()
  router.push('/')
}
</script>

<template>
  <!-- Top Utility Bar (Contact & Conservatory Announcement) -->
  <div class="hidden md:block bg-[#060913] text-slate-300 text-xs py-2.5 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20 font-serif">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-6">
        <span class="inline-flex items-center gap-1.5 text-slate-300">
          <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Kilimani, Nairobi, Kenya
        </span>
        <a href="tel:+254712345678" class="inline-flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition-colors">
          <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          +254 712 345 678
        </a>
        <a href="mailto:admissions@bmas.com" class="inline-flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition-colors">
          <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          admissions@bmas.com
        </a>
      </div>

      <div class="flex items-center gap-4">
        <span class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          2026 Conservatory Terms Open
        </span>
        <RouterLink to="/verify" class="text-amber-300/90 hover:text-amber-200 font-semibold transition-colors text-xs">
          Verify Certificate
        </RouterLink>
      </div>
    </div>
  </div>

  <!-- Main Sticky Header -->
  <header class="sticky top-0 z-50 bg-[#fdfcf8]/95 backdrop-blur-md shadow-sm border-b border-amber-900/10 transition-all font-serif">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- Brand Logo -->
        <RouterLink to="/" class="flex items-center gap-3.5 group flex-shrink-0" @click="closeMobile">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform duration-300">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div>
            <span class="text-2xl font-bold tracking-wider text-slate-950 group-hover:text-amber-700 transition-colors block leading-none">
              BARITON
            </span>
            <span class="text-[11px] font-bold tracking-[0.2em] uppercase text-amber-700 block mt-1">
              Music Academy
            </span>
          </div>
        </RouterLink>

        <!-- Desktop Navigation Links -->
        <nav class="hidden lg:flex items-center gap-1 xl:gap-2">
          <!-- Home -->
          <RouterLink
            to="/"
            :class="[
              'px-3.5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all relative',
              isActive('/')
                ? 'text-amber-600 bg-amber-50/80 shadow-xs'
                : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50'
            ]"
          >
            Home
            <span
              v-if="isActive('/')"
              class="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            ></span>
          </RouterLink>

          <!-- About -->
          <RouterLink
            to="/about"
            :class="[
              'px-3.5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all relative',
              isActive('/about')
                ? 'text-amber-600 bg-amber-50/80 shadow-xs'
                : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50'
            ]"
          >
            About
            <span
              v-if="isActive('/about')"
              class="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            ></span>
          </RouterLink>

          <!-- Courses -->
          <RouterLink
            to="/courses"
            :class="[
              'px-3.5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all relative',
              isActive('/courses')
                ? 'text-amber-600 bg-amber-50/80 shadow-xs'
                : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50'
            ]"
          >
            Courses
            <span
              v-if="isActive('/courses')"
              class="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            ></span>
          </RouterLink>

          <!-- Bootcamps -->
          <RouterLink
            to="/events"
            :class="[
              'px-3.5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all relative',
              isActive('/events')
                ? 'text-amber-600 bg-amber-50/80 shadow-xs'
                : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50'
            ]"
          >
            Bootcamps
            <span
              v-if="isActive('/events')"
              class="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            ></span>
          </RouterLink>

          <!-- 1-on-1 Tutoring -->
          <RouterLink
            to="/tutoring"
            :class="[
              'px-3.5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all relative',
              isActive('/tutoring')
                ? 'text-amber-600 bg-amber-50/80 shadow-xs'
                : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50'
            ]"
          >
            1-on-1 Tutoring
            <span
              v-if="isActive('/tutoring')"
              class="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            ></span>
          </RouterLink>

          <!-- Pages Dropdown -->
          <div
            class="relative"
            @mouseenter="dropdownOpen = true"
            @mouseleave="dropdownOpen = false"
          >
            <button
              type="button"
              :class="[
                'px-3.5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all flex items-center gap-1.5 focus:outline-none',
                isPagesActive
                  ? 'text-amber-600 bg-amber-50/80'
                  : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50'
              ]"
              @click="dropdownOpen = !dropdownOpen"
            >
              <span>Pages</span>
              <svg
                :class="['w-4 h-4 transition-transform duration-200', dropdownOpen ? 'rotate-180 text-amber-600' : 'text-slate-400']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Menu Card -->
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0 -translate-y-2"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 -translate-y-2"
            >
              <div
                v-show="dropdownOpen"
                class="absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 py-2.5 z-50 divide-y divide-slate-100/60"
              >
                <div class="py-1">
                  <RouterLink
                    to="/team"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    :class="{ 'text-amber-600 font-semibold bg-amber-50/60': isActive('/team') }"
                    @click="dropdownOpen = false"
                  >
                    <span class="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center flex-shrink-0 text-base">🎻</span>
                    <div>
                      <div class="font-medium">Faculty & Instructors</div>
                      <div class="text-[11px] text-slate-400">Distinguished conservatory artists</div>
                    </div>
                  </RouterLink>

                  <RouterLink
                    to="/testimonials"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    :class="{ 'text-amber-600 font-semibold bg-amber-50/60': isActive('/testimonials') }"
                    @click="dropdownOpen = false"
                  >
                    <span class="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center flex-shrink-0 text-base">💬</span>
                    <div>
                      <div class="font-medium">Student Testimonials</div>
                      <div class="text-[11px] text-slate-400">Audition & mastery reviews</div>
                    </div>
                  </RouterLink>

                  <RouterLink
                    to="/verify"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    :class="{ 'text-amber-600 font-semibold bg-amber-50/60': isActive('/verify') }"
                    @click="dropdownOpen = false"
                  >
                    <span class="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center flex-shrink-0 text-base">📜</span>
                    <div>
                      <div class="font-medium">Verify Certificate</div>
                      <div class="text-[11px] text-slate-400">Instant tamper-proof check</div>
                    </div>
                  </RouterLink>
                </div>

                <div class="py-1">
                  <RouterLink
                    to="/terms"
                    class="block px-4 py-2 text-xs text-slate-600 hover:text-amber-600 hover:bg-slate-50 transition-colors"
                    @click="dropdownOpen = false"
                  >
                    Terms of Enrollment
                  </RouterLink>
                  <RouterLink
                    to="/privacy"
                    class="block px-4 py-2 text-xs text-slate-600 hover:text-amber-600 hover:bg-slate-50 transition-colors"
                    @click="dropdownOpen = false"
                  >
                    Privacy Policy
                  </RouterLink>
                </div>
              </div>
            </transition>
          </div>

          <!-- Contact -->
          <RouterLink
            to="/contact"
            :class="[
              'px-3.5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all relative',
              isActive('/contact')
                ? 'text-amber-600 bg-amber-50/80 shadow-xs'
                : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50'
            ]"
          >
            Contact
            <span
              v-if="isActive('/contact')"
              class="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            ></span>
          </RouterLink>
        </nav>

        <!-- Right Side User Actions / Auth CTA -->
        <div class="hidden sm:flex items-center gap-3">
          <template v-if="auth.isAuthenticated">
            <RouterLink
              :to="auth.homeRoute"
              class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md"
            >
              <span>My Dashboard</span>
              <span class="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase font-bold tracking-wider">
                {{ auth.primaryRole }}
              </span>
            </RouterLink>
            <button
              @click="handleLogout"
              title="Sign Out"
              class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </template>

          <template v-else>
            <RouterLink
              to="/login"
              class="text-sm font-semibold text-slate-700 hover:text-amber-600 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Sign In
            </RouterLink>
            <RouterLink
              to="/register"
              class="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-700 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              <span>Join Now</span>
              <svg
                class="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </RouterLink>
          </template>
        </div>

        <!-- Mobile Hamburger Button -->
        <div class="flex items-center lg:hidden">
          <button
            type="button"
            class="p-2.5 rounded-xl text-slate-700 hover:text-amber-600 hover:bg-slate-100 focus:outline-none transition-colors"
            aria-label="Toggle navigation menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-3"
    >
      <div v-show="mobileMenuOpen" class="lg:hidden border-t border-slate-100 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-6 space-y-1 shadow-2xl">
        <RouterLink
          to="/"
          class="block px-3.5 py-2.5 rounded-xl text-base font-semibold transition-colors"
          :class="isActive('/') ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-800 hover:bg-slate-50 hover:text-amber-600'"
          @click="closeMobile"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/about"
          class="block px-3.5 py-2.5 rounded-xl text-base font-semibold transition-colors"
          :class="isActive('/about') ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-800 hover:bg-slate-50 hover:text-amber-600'"
          @click="closeMobile"
        >
          About Us
        </RouterLink>
        <RouterLink
          to="/courses"
          class="block px-3.5 py-2.5 rounded-xl text-base font-semibold transition-colors"
          :class="isActive('/courses') ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-800 hover:bg-slate-50 hover:text-amber-600'"
          @click="closeMobile"
        >
          Courses
        </RouterLink>
        <RouterLink
          to="/events"
          class="block px-3.5 py-2.5 rounded-xl text-base font-semibold transition-colors"
          :class="isActive('/events') ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-800 hover:bg-slate-50 hover:text-amber-600'"
          @click="closeMobile"
        >
          Physical Bootcamps
        </RouterLink>
        <RouterLink
          to="/tutoring"
          class="block px-3.5 py-2.5 rounded-xl text-base font-semibold transition-colors"
          :class="isActive('/tutoring') ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-800 hover:bg-slate-50 hover:text-amber-600'"
          @click="closeMobile"
        >
          1-on-1 Tutoring
        </RouterLink>

        <!-- Pages Group in Mobile -->
        <div class="pt-2 pb-1 border-t border-slate-100">
          <div class="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">Academy Pages</div>
          <RouterLink
            to="/team"
            class="block px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600"
            :class="{ 'text-amber-600 font-bold bg-amber-50/60': isActive('/team') }"
            @click="closeMobile"
          >
            Faculty & Instructors
          </RouterLink>
          <RouterLink
            to="/testimonials"
            class="block px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600"
            :class="{ 'text-amber-600 font-bold bg-amber-50/60': isActive('/testimonials') }"
            @click="closeMobile"
          >
            Student Testimonials
          </RouterLink>
          <RouterLink
            to="/verify"
            class="block px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600"
            :class="{ 'text-amber-600 font-bold bg-amber-50/60': isActive('/verify') }"
            @click="closeMobile"
          >
            Verify Certificate
          </RouterLink>
          <RouterLink
            to="/terms"
            class="block px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600"
            @click="closeMobile"
          >
            Terms of Enrollment
          </RouterLink>
          <RouterLink
            to="/privacy"
            class="block px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600"
            @click="closeMobile"
          >
            Privacy Policy
          </RouterLink>
        </div>

        <RouterLink
          to="/contact"
          class="block px-3.5 py-2.5 rounded-xl text-base font-semibold transition-colors"
          :class="isActive('/contact') ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-800 hover:bg-slate-50 hover:text-amber-600'"
          @click="closeMobile"
        >
          Contact Us
        </RouterLink>

        <!-- Mobile Auth Actions -->
        <div class="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <template v-if="auth.isAuthenticated">
            <RouterLink
              :to="auth.homeRoute"
              class="w-full text-center py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md"
              @click="closeMobile"
            >
              My Dashboard ({{ auth.primaryRole }})
            </RouterLink>
            <button
              @click="handleLogout"
              class="w-full text-center py-2.5 rounded-xl border border-rose-200 text-rose-600 font-semibold text-sm hover:bg-rose-50"
            >
              Sign Out
            </button>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold text-sm"
              @click="closeMobile"
            >
              Sign In
            </RouterLink>
            <RouterLink
              to="/register"
              class="w-full text-center py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-sm shadow-md"
              @click="closeMobile"
            >
              Join Now
            </RouterLink>
          </template>
        </div>
      </div>
    </transition>
  </header>
</template>
