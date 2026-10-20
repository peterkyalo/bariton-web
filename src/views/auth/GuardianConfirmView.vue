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
const studentName = ref('')
const message = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    loading.value = false
    message.value = 'Missing guardian confirmation token.'
    return
  }

  try {
    const { data } = await auth.confirmGuardian(token)
    success.value = true
    studentName.value = data.student_name || 'the student'
    message.value = data.message || 'Parental/Guardian consent has been confirmed. The student account is now fully active.'
  } catch (err) {
    const parsed = parseError(err)
    message.value = parsed.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="glass p-7 sm:p-9 text-center">
    <div v-if="loading">
      <LoadingSpinner text="Validating guardian consent..." />
    </div>

    <div v-else>
      <div
        class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
        :class="success ? 'bg-success-500/20 text-success-300' : 'bg-danger-500/20 text-danger-300'"
      >
        {{ success ? '🛡' : '⚠' }}
      </div>

      <h2 class="text-xl font-bold text-white mb-2">
        {{ success ? 'Guardian Consent Confirmed' : 'Consent Link Error' }}
      </h2>

      <p class="text-xs text-ink-300 mb-6 leading-relaxed">
        {{ message }}
      </p>

      <div v-if="success" class="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-ink-300 mb-6 text-left space-y-1">
        <p class="font-semibold text-white">Next Steps:</p>
        <p>• An activation confirmation has been dispatched to {{ studentName }}.</p>
        <p>• The student can now log in at <span class="text-brass-300 font-mono">app.bmas.com</span> to begin their music courses.</p>
      </div>

      <RouterLink to="/login" class="btn-primary inline-flex !py-2.5 !px-6">
        Go to Student Login
      </RouterLink>
    </div>
  </div>
</template>
