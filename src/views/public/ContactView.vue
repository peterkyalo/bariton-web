<template>
  <div class="contact-page bg-white text-slate-800">
    <!-- Page Header (matches contact.html banner) -->
    <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 py-20 text-center relative overflow-hidden">
      <div class="max-w-4xl mx-auto px-4 relative z-10">
        <h1 class="text-4xl sm:text-5xl font-serif font-bold text-white tracking-tight mb-4">Contact Us</h1>
        <nav class="flex justify-center items-center text-sm font-medium text-slate-300 gap-2">
          <router-link to="/" class="hover:text-amber-400">Home</router-link>
          <span>/</span>
          <span class="text-amber-400">Contact</span>
        </nav>
      </div>
    </div>

    <!-- Contact Content (matches contact.html: Info, Map, Working Form) -->
    <section class="py-20 bg-slate-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100/50 px-3 py-1 rounded-full mb-3 inline-block font-display">Get In Touch</span>
          <h2 class="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">We Are Here to Assist Your Musical Journey</h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Col 1: Details -->
          <div class="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 class="text-xl font-bold text-slate-900">Campus Information</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Visit our conservatory campus in Kilimani, Nairobi, for a guided studio tour, piano audition consult, or admission assessment.
            </p>

            <div class="space-y-4 pt-2">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 text-xl font-bold">📍</div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900">Conservatory Hall</h4>
                  <p class="text-xs text-slate-600">Argwings Kodhek Rd, Kilimani, Nairobi, Kenya</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 text-xl font-bold">📞</div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900">Telephone / WhatsApp</h4>
                  <p class="text-xs text-slate-600">+254 712 345 678 / +254 798 765 432</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 text-xl font-bold">✉️</div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900">Email Inquiries</h4>
                  <p class="text-xs text-slate-600">admissions@bmas.com</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 text-xl font-bold">⏰</div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900">Visiting Hours</h4>
                  <p class="text-xs text-slate-600">Mon - Fri: 8:00 AM - 6:00 PM (EAT)<br>Sat: 9:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 2: Interactive Nairobi Location Card & Map -->
          <div class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col">
            <div class="p-6 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-900 mb-1">Kilimani Conservatory Location</h3>
              <p class="text-xs text-slate-500">Accessible via Ring Road Kilimani and Ngong Road.</p>
            </div>
            <div class="flex-1 min-h-[300px] relative bg-slate-100 flex items-center justify-center">
              <iframe
                title="BMAS Location Map"
                class="w-full h-full min-h-[340px] border-0"
                src="https://maps.google.com/maps?q=Kilimani,%20Nairobi,%20Kenya&t=&z=14&ie=UTF8&iwloc=&output=embed"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          <!-- Col 3: Functional Contact Form (Connected to API) -->
          <div class="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-xl font-bold text-slate-900 mb-2">Send an Inquiry</h3>
              <p class="text-xs text-slate-500 mb-6">Our admissions team reviews all requests within 24 business hours.</p>

              <!-- Success Alert -->
              <div v-if="successMessage" class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm mb-6 flex items-start gap-3">
                <span class="text-emerald-500 text-lg">✓</span>
                <div>
                  <p class="font-bold">Message Received!</p>
                  <p class="text-xs mt-0.5">{{ successMessage }}</p>
                </div>
              </div>

              <!-- Error Alert -->
              <div v-if="errorMessage" class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6">
                {{ errorMessage }}
              </div>

              <form @submit.prevent="handleSubmit" class="space-y-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Your Full Name</label>
                  <input v-model="form.name" type="text" required placeholder="e.g. Wanjiku Kamau" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
                    <input v-model="form.email" type="email" required placeholder="you@example.com" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Phone / WhatsApp</label>
                    <input v-model="form.phone" type="tel" placeholder="+254 7..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Subject</label>
                  <input v-model="form.subject" type="text" required placeholder="e.g. Piano Masterclass Auditions" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Your Message</label>
                  <textarea v-model="form.message" rows="4" required placeholder="Tell us about your background and what course you're interested in..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"></textarea>
                </div>

                <button type="submit" :disabled="submitting" class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2">
                  <span v-if="submitting">Sending Message...</span>
                  <span v-else>Send Message</span>
                  <svg v-if="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCmsStore } from '@/stores/cms'

const auth = useAuthStore()
const cmsStore = useCmsStore()

const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

async function handleSubmit() {
  submitting.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const res = await cmsStore.submitInquiry({ ...form })
    successMessage.value = res.message || 'Your inquiry has been received.'
    form.name = ''
    form.email = ''
    form.phone = ''
    form.subject = ''
    form.message = ''
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Failed to submit inquiry. Please check your inputs.'
  } finally {
    submitting.value = false
  }
}
</script>
