<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
  remember: true,
})

const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})

async function submit() {
  loading.value = true
  errorMessage.value = ''
  errors.value = {}

  try {
    const result = await auth.login(form.value)
    if (result.twoFactor) {
      router.push({ name: 'auth.two-factor-challenge' })
      return
    }

    ui.toast('Welcome back to Bariton Music Academy!', 'success')
    router.push(auth.homeRoute)
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
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold tracking-tight text-white mb-2">Student & Staff Login</h2>
      <p class="text-xs text-ink-400">Access your musical curriculum, assessments, and dashboard</p>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="mb-5 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-danger-300">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label for="email" class="field-label">Email address</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          placeholder="name@example.com"
          class="field-input"
          :aria-invalid="!!errors.email"
        />
        <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="password" class="field-label !mb-0">Password</label>
          <RouterLink to="/forgot-password" class="text-xs text-brass-300 hover:text-white transition">
            Forgot password?
          </RouterLink>
        </div>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="••••••••"
          class="field-input"
          :aria-invalid="!!errors.password"
        />
        <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
      </div>

      <div class="flex items-center justify-between pt-1">
        <label class="flex items-center gap-2 cursor-pointer text-xs text-ink-300">
          <input
            v-model="form.remember"
            type="checkbox"
            class="rounded border-white/20 bg-ink-850 text-brass-400 focus:ring-brass-300/30"
          />
          <span>Remember this session</span>
        </label>
      </div>

      <button
        type="submit"
        class="btn-primary w-full !py-3 mt-2"
        :disabled="loading"
      >
        <span v-if="loading">Authenticating...</span>
        <span v-else>Log In to Portal</span>
      </button>
    </form>

    <div class="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-ink-400">
      Don't have an academy account yet?
      <RouterLink to="/register" class="font-semibold text-brass-300 hover:text-white ml-1">
        Register here
      </RouterLink>
    </div>
  </div>
</template>
