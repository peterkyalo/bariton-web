<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { parseError } from '@/lib/http'

const auth = useAuthStore()
const email = ref('')
const loading = ref(false)
const message = ref('')
const errorMessage = ref('')

async function submit() {
  loading.value = true
  message.value = ''
  errorMessage.value = ''

  try {
    const { data } = await auth.forgotPassword(email.value)
    message.value = data.message || 'If that email address exists in our academy database, a password reset link has been dispatched.'
  } catch (err) {
    const parsed = parseError(err)
    errorMessage.value = parsed.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="glass p-7 sm:p-9">
    <div class="text-center mb-6">
      <h2 class="text-xl font-bold text-white mb-1.5">Reset Account Password</h2>
      <p class="text-xs text-ink-300">Enter your registered email address and we'll send a recovery link.</p>
    </div>

    <div v-if="message" class="mb-4 p-3 rounded-xl bg-success-500/10 border border-success-500/30 text-xs text-success-300">
      {{ message }}
    </div>

    <div v-if="errorMessage" class="mb-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-danger-300">
      {{ errorMessage }}
    </div>

    <form v-if="!message" @submit.prevent="submit" class="space-y-4">
      <div>
        <label for="reset-email" class="field-label">Email address</label>
        <input
          id="reset-email"
          v-model="email"
          type="email"
          required
          placeholder="your.email@example.com"
          class="field-input"
        />
      </div>

      <button type="submit" class="btn-primary w-full !py-2.5" :disabled="loading">
        <span v-if="loading">Sending reset link...</span>
        <span v-else>Send Reset Instructions</span>
      </button>
    </form>

    <div class="mt-6 pt-4 border-t border-white/[0.08] text-center text-xs">
      <RouterLink to="/login" class="text-brass-300 hover:text-white transition">
        ← Back to sign in
      </RouterLink>
    </div>
  </div>
</template>
