<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useExamsStore } from '@/stores/exams'

const route = useRoute()
const examsStore = useExamsStore()
const searchCode = ref('')

const code = computed(() => route.params.code)

onMounted(async () => {
  if (code.value) {
    searchCode.value = code.value
    await examsStore.verifyCertificate(code.value)
  }
})

async function handleSearch() {
  if (!searchCode.value.trim()) return
  await examsStore.verifyCertificate(searchCode.value.trim())
}

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
  <div class="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
    <div class="max-w-3xl mx-auto w-full space-y-8">
      <!-- Academy Seal & Brand Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-2xl font-black mb-1">
          BMAS
        </div>
        <h1 class="text-xs uppercase tracking-widest font-extrabold text-amber-500">
          Bariton Music Academy • Academic Registry
        </h1>
        <h2 class="text-3xl font-black text-white tracking-tight">
          Official Credential Verification
        </h2>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          Public verification portal for authenticating conservatory diplomas and certificates of mastery.
        </p>
      </div>

      <!-- Search Code Box -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex gap-3 shadow-xl">
        <input
          v-model="searchCode"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Enter Certificate Code (e.g. BMAS-CERT-ABC12345)"
          class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono tracking-wider focus:border-amber-500 focus:outline-none transition uppercase"
        />
        <button
          @click="handleSearch"
          :disabled="examsStore.loading"
          class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
        >
          Verify
        </button>
      </div>

      <!-- Verification State -->
      <div v-if="examsStore.loading" class="text-center py-12 text-slate-400">
        Verifying credential signature with registry...
      </div>

      <div
        v-else-if="examsStore.error"
        class="bg-red-950/30 border border-red-500/40 rounded-2xl p-8 text-center space-y-3"
      >
        <div class="text-red-400 text-3xl font-black">✕</div>
        <h3 class="text-lg font-bold text-white">Invalid or Unrecognized Credential</h3>
        <p class="text-xs text-slate-300 max-w-md mx-auto">
          {{ examsStore.error }}
        </p>
      </div>

      <!-- Verified Record Card -->
      <div
        v-else-if="examsStore.verificationResult"
        class="bg-slate-900 border rounded-2xl overflow-hidden shadow-2xl relative"
        :class="{
          'border-emerald-500/50': examsStore.verificationResult.status === 'issued',
          'border-red-500/50': examsStore.verificationResult.status === 'revoked',
          'border-amber-500/50': examsStore.verificationResult.status === 'replaced',
        }"
      >
        <!-- Top Status Banner -->
        <div
          class="px-6 py-4 flex items-center justify-between"
          :class="{
            'bg-emerald-950/60 text-emerald-400 border-b border-emerald-500/30': examsStore.verificationResult.status === 'issued',
            'bg-red-950/80 text-red-400 border-b border-red-500/30': examsStore.verificationResult.status === 'revoked',
            'bg-amber-950/60 text-amber-400 border-b border-amber-500/30': examsStore.verificationResult.status === 'replaced',
          }"
        >
          <div class="flex items-center gap-2.5 font-black uppercase text-xs tracking-wider">
            <span class="text-base" v-if="examsStore.verificationResult.status === 'issued'">✓</span>
            <span class="text-base" v-else-if="examsStore.verificationResult.status === 'revoked'">⚠</span>
            <span class="text-base" v-else>↻</span>
            <span>
              {{
                examsStore.verificationResult.status === 'issued'
                  ? 'Official Credential Verified & Valid'
                  : examsStore.verificationResult.status === 'revoked'
                  ? 'Certificate Revoked / Null and Void'
                  : 'Certificate Superseded / Replaced by New Issue'
              }}
            </span>
          </div>

          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40">
            {{ examsStore.verificationResult.certificate_code }}
          </span>
        </div>

        <!-- Details Grid -->
        <div class="p-6 sm:p-8 space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span class="text-xs uppercase tracking-wider text-slate-500 font-semibold block">Holder Name</span>
              <span class="text-2xl font-black text-white mt-1 block tracking-tight">
                {{ examsStore.verificationResult.holder_name }}
              </span>
            </div>

            <div>
              <span class="text-xs uppercase tracking-wider text-slate-500 font-semibold block">Course Title</span>
              <span class="text-xl font-bold text-amber-400 mt-1 block">
                {{ examsStore.verificationResult.course_title }}
              </span>
            </div>

            <div>
              <span class="text-xs uppercase tracking-wider text-slate-500 font-semibold block">Issue Date</span>
              <span class="text-sm font-medium text-slate-200 mt-1 block">
                {{ formatDate(examsStore.verificationResult.issued_at) }}
              </span>
            </div>

            <div>
              <span class="text-xs uppercase tracking-wider text-slate-500 font-semibold block">Credential Track</span>
              <div class="mt-1 flex items-center gap-2">
                <span
                  class="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  :class="examsStore.verificationResult.path_type === 'validation' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'"
                >
                  {{ examsStore.verificationResult.path_type === 'validation' ? 'Skills Validation Track (Assessment Only)' : 'Standard Conservatory Track' }}
                </span>
              </div>
              <span class="text-xs text-slate-400 mt-1.5 block">
                {{ examsStore.verificationResult.assessment_note || (examsStore.verificationResult.path_type === 'validation' ? 'The holder completed assessment examination only.' : 'The holder fulfilled all instructional curriculum requirements and examinations.') }}
              </span>
            </div>
          </div>

          <!-- Revocation Notice -->
          <div
            v-if="examsStore.verificationResult.status === 'revoked'"
            class="bg-red-950/40 border border-red-500/30 rounded-xl p-4 space-y-1"
          >
            <span class="text-xs font-bold text-red-400 uppercase tracking-wider block">Official Revocation Notice</span>
            <p class="text-xs text-slate-300">
              Reason: {{ examsStore.verificationResult.revocation_reason || 'Academic audit revocation.' }}
            </p>
            <div class="text-[11px] text-slate-500">
              Revoked on: {{ formatDate(examsStore.verificationResult.revoked_at) }}
            </div>
          </div>

          <!-- Replaced Notice -->
          <div
            v-if="examsStore.verificationResult.status === 'replaced'"
            class="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 space-y-2"
          >
            <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">Reissued with New Credential</span>
            <p class="text-xs text-slate-300">
              This certificate record was superseded. The updated certificate code is:
              <router-link
                v-if="examsStore.verificationResult.replaced_by_code"
                :to="{ name: 'certificate.verify', params: { code: examsStore.verificationResult.replaced_by_code } }"
                class="font-mono text-amber-400 font-bold underline ml-1"
              >
                {{ examsStore.verificationResult.replaced_by_code }}
              </router-link>
            </p>
          </div>
        </div>

        <!-- Privacy & Security Footer -->
        <div class="bg-slate-950/60 border-t border-slate-800/80 px-6 py-3 text-center text-[11px] text-slate-500">
          Encrypted Digital Credential Verification • Compliant with Kenya Data Protection Act 2019
        </div>
      </div>
    </div>

    <!-- Academy Footer -->
    <div class="text-center text-xs text-slate-600 mt-12">
      © {{ new Date().getFullYear() }} Bariton Music Academy • Nairobi, Kenya
    </div>
  </div>
</template>
