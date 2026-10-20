<script setup>
import { onMounted } from 'vue'
import { useExamsStore } from '@/stores/exams'

const examsStore = useExamsStore()

onMounted(async () => {
  await examsStore.fetchStudentCertificates()
})

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="border-b border-slate-800 pb-5">
        <h1 class="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>My Official Certificates</span>
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Bariton Music Academy conservatory credentials and verifiable certificates of completion.
        </p>
      </div>

      <!-- Loading / Empty -->
      <div v-if="examsStore.loading" class="text-center py-16 text-slate-400">
        Loading credentials...
      </div>

      <div
        v-else-if="examsStore.certificates.length === 0"
        class="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4"
      >
        <div class="text-slate-600 text-5xl">🎓</div>
        <h3 class="text-xl font-bold text-white">No Certificates Earned Yet</h3>
        <p class="text-sm text-slate-400 max-w-md mx-auto">
          Complete all module lessons, pass all practical video assignments, and achieve a passing score on the final exam to earn your Certificate of Mastery.
        </p>
        <router-link
          :to="{ name: 'student.courses' }"
          class="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
        >
          View My Enrolled Courses
        </router-link>
      </div>

      <!-- Certificates Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="cert in examsStore.certificates"
          :key="cert.uuid"
          class="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-amber-500/40 transition shadow-xl space-y-6"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs uppercase tracking-widest font-extrabold text-amber-500">
                {{ cert.path_type === 'validation' ? 'Skills Validation' : 'Certificate of Mastery' }}
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                :class="{
                  'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400': cert.status === 'issued',
                  'bg-red-500/10 border border-red-500/30 text-red-400': cert.status === 'revoked',
                  'bg-amber-500/10 border border-amber-500/30 text-amber-400': cert.status === 'replaced',
                }"
              >
                {{ cert.status }}
              </span>
            </div>

            <h3 class="text-xl font-black text-white tracking-tight mb-2">
              {{ cert.course_title }}
            </h3>

            <div class="space-y-1.5 text-xs text-slate-400 font-mono">
              <div><span class="text-slate-500">Holder:</span> {{ cert.holder_name }}</div>
              <div><span class="text-slate-500">Code:</span> {{ cert.certificate_code }}</div>
              <div><span class="text-slate-500">Issued:</span> {{ formatDate(cert.issued_at) }}</div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <button
              @click="examsStore.downloadCertificate(cert.uuid)"
              class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Download PDF</span>
            </button>

            <router-link
              :to="{ name: 'certificate.verify', params: { code: cert.certificate_code } }"
              class="text-xs font-semibold text-slate-400 hover:text-amber-400 transition"
            >
              Public Verify →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
