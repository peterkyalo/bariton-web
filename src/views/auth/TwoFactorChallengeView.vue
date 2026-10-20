<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const useRecovery = ref(false)
const code = ref('')
const recoveryCode = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function submit() {
  loading.value = true
  errorMessage.value = ''

  try {
    const payload = useRecovery.value
      ? { recovery_code: recoveryCode.value }
      : { code: code.value }

    await auth.twoFactorChallenge(payload)
    ui.toast('Authentication verified successfully.', 'success')
    router.push(auth.homeRoute)
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
      <div class="w-12 h-12 rounded-2xl bg-brass-400/20 text-brass-300 text-xl flex items-center justify-center mx-auto mb-3">
        🔐
      </div>
      <h2 class="text-xl font-bold text-white mb-1.5">Two-Factor Authentication</h2>
      <p class="text-xs text-ink-300">
        {{ useRecovery ? 'Enter one of your emergency recovery codes.' : 'Enter the 6-digit code from your authenticator app.' }}
      </p>
    </div>

    <div v-if="errorMessage" class="mb-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-danger-300">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <div v-if="!useRecovery">
        <label for="totp-code" class="field-label">Authentication Code</label>
        <input
          id="totp-code"
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="123456"
          maxlength="7"
          required
          class="field-input text-center text-lg tracking-widest font-mono"
        />
      </div>

      <div v-else>
        <label for="recovery-code" class="field-label">Emergency Recovery Code</label>
        <input
          id="recovery-code"
          v-model="recoveryCode"
          type="text"
          placeholder="abcde-12345"
          required
          class="field-input font-mono text-center text-sm"
        />
      </div>

      <button type="submit" class="btn-primary w-full !py-2.5" :disabled="loading">
        <span v-if="loading">Verifying...</span>
        <span v-else>Verify Identity</span>
      </button>

      <div class="pt-2 text-center">
        <button
          type="button"
          class="text-xs text-brass-300 hover:text-white transition"
          @click="useRecovery = !useRecovery"
        >
          {{ useRecovery ? 'Use authenticator code instead' : 'Lost access? Use emergency recovery code' }}
        </button>
      </div>
    </form>
  </div>
</template>
