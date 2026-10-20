<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { parseError } from '@/lib/http'

const auth = useAuthStore()
const route = useRoute()

const loading = ref(true)
const success = ref(false)
const message = ref('')

onMounted(async () => {
  const { id, hash, expires, signature } = route.query
  if (!id || !hash) {
    loading.value = false
    message.value = 'Missing verification parameters. Check the link in your email.'
    return
  }

  try {
    await auth.verifyEmail({ id, hash, expires, signature })
    success.value = true
    message.value = 'Your email address has been successfully verified! You have full access to academy courses and certificates.'
  } catch (err) {
    const parsed = parseError(err)
    message.value = parsed.message || 'The verification link is invalid or has expired.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="glass p-7 sm:p-9 text-center">
    <div v-if="loading">
      <LoadingSpinner text="Verifying your email address..." />
    </div>

    <div v-else>
      <div
        class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
        :class="success ? 'bg-success-500/20 text-success-300' : 'bg-danger-500/20 text-danger-300'"
      >
        {{ success ? '✓' : '✕' }}
      </div>

      <h2 class="text-xl font-bold text-white mb-2">
        {{ success ? 'Email Verified' : 'Verification Issue' }}
      </h2>

      <p class="text-xs text-ink-300 mb-6 leading-relaxed">
        {{ message }}
      </p>

      <RouterLink :to="auth.homeRoute" class="btn-primary inline-flex !py-2.5 !px-6">
        Continue to Academy Portal
      </RouterLink>
    </div>
  </div>
</template>
