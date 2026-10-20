<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const form = ref({
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  password: '',
  guardian_name: '',
  guardian_email: '',
  privacy_consent: false,
})

const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})
const minorRegistered = ref(false)

const isMinor = computed(() => {
  if (!form.value.date_of_birth) return false
  const dob = new Date(form.value.date_of_birth)
  if (isNaN(dob.getTime())) return false
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  const age = Math.abs(ageDate.getUTCFullYear() - 1970)
  return age < 18
})

async function submit() {
  loading.value = true
  errorMessage.value = ''
  errors.value = {}

  try {
    const response = await auth.register(form.value)
    if (response.status === 'pending_guardian') {
      minorRegistered.value = true
    } else {
      ui.toast('Registration successful! Please verify your email.', 'success')
      router.push({ name: 'dashboard.student' })
    }
  } catch (err) {
    const parsed = parseError(err)
    errorMessage.value = parsed.message
    errors.value = parsed.errors
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="glass p-7 sm:p-9">
    <!-- Minor Registered Confirmation Screen -->
    <div v-if="minorRegistered" class="text-center py-4">
      <div class="w-14 h-14 rounded-2xl bg-brass-400/20 text-brass-200 text-2xl flex items-center justify-center mx-auto mb-4">
        ✉
      </div>
      <h2 class="text-xl font-bold text-white mb-2">Guardian Consent Required</h2>
      <p class="text-xs text-ink-300 mb-4 leading-relaxed">
        Under Kenyan child protection regulations, minors require parental or guardian consent.
        We have dispatched an authorization link to:
      </p>
      <div class="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-brass-300 mb-6">
        {{ form.guardian_email }}
      </div>
      <p class="text-xs text-ink-400 mb-6 leading-relaxed">
        Once your guardian clicks the confirmation link, your student account will be activated and you can sign in.
      </p>
      <RouterLink to="/login" class="btn-primary w-full !py-2.5">
        Return to Login
      </RouterLink>
    </div>

    <!-- Registration Form -->
    <div v-else>
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-1.5">Join Bariton Academy</h2>
        <p class="text-xs text-ink-400">Enroll as a music student to start courses, exams and sessions</p>
      </div>

      <div v-if="errorMessage" class="mb-5 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-danger-300">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label for="reg-name" class="field-label">Full legal name</label>
          <input
            id="reg-name"
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. Wanjiku Kamau"
            class="field-input"
            :aria-invalid="!!errors.name"
          />
          <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
        </div>

        <div>
          <label for="reg-email" class="field-label">Email address</label>
          <input
            id="reg-email"
            v-model="form.email"
            type="email"
            required
            placeholder="student@example.com"
            class="field-input"
            :aria-invalid="!!errors.email"
          />
          <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="reg-phone" class="field-label">Phone (M-Pesa ready)</label>
            <input
              id="reg-phone"
              v-model="form.phone"
              type="tel"
              placeholder="0712 345 678"
              class="field-input"
              :aria-invalid="!!errors.phone"
            />
            <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
          </div>

          <div>
            <label for="reg-dob" class="field-label">Date of birth</label>
            <input
              id="reg-dob"
              v-model="form.date_of_birth"
              type="date"
              required
              class="field-input"
              :aria-invalid="!!errors.date_of_birth"
            />
            <p v-if="errors.date_of_birth" class="field-error">{{ errors.date_of_birth }}</p>
          </div>
        </div>

        <!-- Conditional Minor Section -->
        <div v-if="isMinor" class="p-4 rounded-xl bg-brass-400/10 border border-brass-400/25 space-y-3">
          <div class="flex items-center gap-2 text-xs font-semibold text-brass-200">
            <span>🛡</span>
            <span>Minor Student Protection (Under 18)</span>
          </div>
          <p class="text-[11px] text-ink-300 leading-snug">
            Please provide your parent or legal guardian's details. An activation link will be sent to them.
          </p>

          <div>
            <label for="guardian-name" class="field-label !text-xs">Guardian full name</label>
            <input
              id="guardian-name"
              v-model="form.guardian_name"
              type="text"
              required
              placeholder="Parent/Guardian Name"
              class="field-input !text-xs !py-2"
              :aria-invalid="!!errors.guardian_name"
            />
            <p v-if="errors.guardian_name" class="field-error">{{ errors.guardian_name }}</p>
          </div>

          <div>
            <label for="guardian-email" class="field-label !text-xs">Guardian email address</label>
            <input
              id="guardian-email"
              v-model="form.guardian_email"
              type="email"
              required
              placeholder="guardian@example.com"
              class="field-input !text-xs !py-2"
              :aria-invalid="!!errors.guardian_email"
            />
            <p v-if="errors.guardian_email" class="field-error">{{ errors.guardian_email }}</p>
          </div>
        </div>

        <div>
          <label for="reg-password" class="field-label">Create password</label>
          <input
            id="reg-password"
            v-model="form.password"
            type="password"
            required
            autocomplete="new-password"
            placeholder="Min 8 characters (letters & numbers)"
            class="field-input"
            :aria-invalid="!!errors.password"
          />
          <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
        </div>

        <!-- Privacy Policy Consent -->
        <div class="pt-2">
          <label class="flex items-start gap-2.5 cursor-pointer text-xs text-ink-300">
            <input
              v-model="form.privacy_consent"
              type="checkbox"
              required
              class="mt-0.5 rounded border-white/20 bg-ink-850 text-brass-400 focus:ring-brass-300/30"
            />
            <span>
              I consent to Bariton Music Academy processing my details in accordance with the
              <span class="text-brass-300 underline">Kenya Data Protection Act 2019</span>.
            </span>
          </label>
          <p v-if="errors.privacy_consent" class="field-error">{{ errors.privacy_consent }}</p>
        </div>

        <button
          type="submit"
          class="btn-primary w-full !py-3 mt-4"
          :disabled="loading"
        >
          <span v-if="loading">Processing enrollment...</span>
          <span v-else>Register as Student</span>
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-ink-400">
        Already have an account?
        <RouterLink to="/login" class="font-semibold text-brass-300 hover:text-white ml-1">
          Sign in
        </RouterLink>
      </div>
    </div>
  </div>
</template>
