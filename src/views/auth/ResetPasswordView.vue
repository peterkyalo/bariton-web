<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const form = ref({
  token: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})

onMounted(() => {
  form.value.token = route.query.token || ''
  form.value.email = route.query.email || ''
})

async function submit() {
  loading.value = true
  errorMessage.value = ''
  errors.value = {}

  try {
    await auth.resetPassword(form.value)
    ui.toast('Password reset successfully. You may now log in.', 'success')
    router.push({ name: 'login' })
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
      <h2 class="text-xl font-bold text-white mb-1.5">Set New Password</h2>
      <p class="text-xs text-ink-300">Create a secure password for your academy account.</p>
    </div>

    <div v-if="errorMessage" class="mb-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-danger-300">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label for="new-email" class="field-label">Email address</label>
        <input
          id="new-email"
          v-model="form.email"
          type="email"
          required
          class="field-input"
          :aria-invalid="!!errors.email"
        />
        <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
      </div>

      <div>
        <label for="new-password" class="field-label">New password</label>
        <input
          id="new-password"
          v-model="form.password"
          type="password"
          required
          placeholder="Min 8 characters"
          class="field-input"
          :aria-invalid="!!errors.password"
        />
        <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
      </div>

      <div>
        <label for="new-confirm" class="field-label">Confirm new password</label>
        <input
          id="new-confirm"
          v-model="form.password_confirmation"
          type="password"
          required
          placeholder="Re-enter password"
          class="field-input"
        />
      </div>

      <button type="submit" class="btn-primary w-full !py-2.5" :disabled="loading">
        <span v-if="loading">Resetting password...</span>
        <span v-else>Update Password</span>
      </button>
    </form>

    <div class="mt-6 pt-4 border-t border-white/[0.08] text-center text-xs">
      <RouterLink to="/login" class="text-brass-300 hover:text-white transition">
        Return to login
      </RouterLink>
    </div>
  </div>
</template>
