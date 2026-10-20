<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const email = ref('')
const subscribed = ref(false)

function handleSubscribe() {
  if (!email.value) return
  subscribed.value = true
}
</script>

<template>
  <footer class="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto">
    <!-- Main Footer Columns -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
        <!-- Col 1: Brand & Philosophy -->
        <div class="space-y-4">
          <RouterLink to="/" class="flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div>
              <span class="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors block leading-none">
                BARITON
              </span>
              <span class="text-[10px] font-semibold tracking-widest uppercase text-amber-500 block mt-1">
                Music Academy
              </span>
            </div>
          </RouterLink>

          <p class="text-xs text-slate-400 leading-relaxed">
            East Africa's premier music conservatory offering accredited progressive grades, physical weekend bootcamps, masterclasses, and verifiable international credentials.
          </p>

          <!-- Social Links -->
          <div class="flex items-center gap-2 pt-2">
            <a href="https://twitter.com" target="_blank" rel="noopener" class="w-8 h-8 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors" aria-label="Twitter">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener" class="w-8 h-8 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors" aria-label="Facebook">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener" class="w-8 h-8 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors" aria-label="YouTube">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z"/></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener" class="w-8 h-8 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors" aria-label="Instagram">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>

        <!-- Col 2: Quick Links -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Curriculum & Links
          </h4>
          <ul class="space-y-2.5 text-xs">
            <li>
              <RouterLink to="/about" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                <span class="text-amber-500/70">›</span> About Our Academy
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/courses" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                <span class="text-amber-500/70">›</span> Conservatory Courses
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/events" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                <span class="text-amber-500/70">›</span> Physical Bootcamps & Workshops
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/tutoring" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                <span class="text-amber-500/70">›</span> 1-on-1 Faculty Tutoring
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/team" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                <span class="text-amber-500/70">›</span> Conservatory Faculty
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/testimonials" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                <span class="text-amber-500/70">›</span> Student Success Stories
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/terms" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                <span class="text-amber-500/70">›</span> Terms of Enrollment
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/privacy" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                <span class="text-amber-500/70">›</span> Privacy Policy
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Col 3: Contact & Audition Desk -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Conservatory Campus
          </h4>
          <ul class="space-y-3 text-xs">
            <li class="flex items-start gap-2.5">
              <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Argwings Kodhek Road, Kilimani, Nairobi, Kenya</span>
            </li>
            <li class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>+254 712 345 678 / +254 798 654 321</span>
            </li>
            <li class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>admissions@bmas.com</span>
            </li>
            <li class="flex items-center gap-2.5 text-slate-500 pt-1">
              <svg class="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Mon - Sat: 8:00 AM - 8:00 PM EAT</span>
            </li>
          </ul>
        </div>

        <!-- Col 4: Newsletter & Payments -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Recital & Masterclass Alerts
          </h4>
          <p class="text-xs text-slate-400 mb-3 leading-relaxed">
            Join 3,000+ musicians receiving monthly technique breakdowns, guest soloist invitations, and audition dates.
          </p>

          <form @submit.prevent="handleSubscribe" class="space-y-2">
            <div class="relative">
              <input
                v-model="email"
                type="email"
                placeholder="Enter your email"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-700 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wide shadow-md transition-all"
            >
              <span v-if="!subscribed">Subscribe to Academy News</span>
              <span v-else class="text-slate-950">✓ Thank You for Subscribing!</span>
            </button>
          </form>

          <!-- Verified Payment Badges -->
          <div class="pt-5 border-t border-slate-900 mt-4">
            <div class="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mb-2">Supported Gateways</div>
            <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span class="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-emerald-400 font-bold">M-PESA</span>
              <span class="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-amber-300 font-bold">VISA</span>
              <span class="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-rose-400 font-bold">Mastercard</span>
              <span class="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-sky-400 font-bold">PayPal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
