<script setup>
import { onMounted, ref } from 'vue'
import { useExamsStore } from '@/stores/exams'

const examsStore = useExamsStore()

const searchQuery = ref('')
const statusFilter = ref('')
const revokeModalOpen = ref(false)
const reissueModalOpen = ref(false)
const targetCert = ref(null)

const revokeReason = ref('')
const newHolderName = ref('')
const reissueReason = ref('')
const processing = ref(false)

onMounted(async () => {
  await fetchCertificates()
})

async function fetchCertificates() {
  await examsStore.adminFetchCertificates({
    search: searchQuery.value,
    status: statusFilter.value,
  })
}

function openRevokeModal(cert) {
  targetCert.value = cert
  revokeReason.value = ''
  revokeModalOpen.value = true
}

function openReissueModal(cert) {
  targetCert.value = cert
  newHolderName.value = cert.holder_name
  reissueReason.value = 'Name correction on formal certificate.'
  reissueModalOpen.value = true
}

async function handleRevokeSubmit() {
  if (!revokeReason.value.trim() || !targetCert.value) return
  processing.value = true
  try {
    await examsStore.adminRevokeCertificate(targetCert.value.uuid, revokeReason.value.trim())
    revokeModalOpen.value = false
    await fetchCertificates()
  } catch (err) {
    console.error('Failed to revoke:', err)
  } finally {
    processing.value = false
  }
}

async function handleReissueSubmit() {
  if (!newHolderName.value.trim() || !targetCert.value) return
  processing.value = true
  try {
    await examsStore.adminReissueCertificate(targetCert.value.uuid, {
      new_holder_name: newHolderName.value.trim(),
      reason: reissueReason.value.trim(),
    })
    reissueModalOpen.value = false
    await fetchCertificates()
  } catch (err) {
    console.error('Failed to reissue:', err)
  } finally {
    processing.value = false
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
      <div>
        <h1 class="text-2xl font-black text-white tracking-tight">Certificates & Credentials Registry</h1>
        <p class="text-xs text-slate-400 mt-1">
          Search, revoke, and reissue verifiable digital certificates across all conservatory academic programs.
        </p>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <input
        v-model="searchQuery"
        @keyup.enter="fetchCertificates"
        type="text"
        placeholder="Search by code, holder name, or course..."
        class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
      />
      <select
        v-model="statusFilter"
        @change="fetchCertificates"
        class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:border-amber-500 focus:outline-none"
      >
        <option value="">All Statuses</option>
        <option value="issued">Issued (Active)</option>
        <option value="revoked">Revoked</option>
        <option value="replaced">Replaced</option>
      </select>
      <button
        @click="fetchCertificates"
        class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
      >
        Search
      </button>
    </div>

    <!-- Table -->
    <div v-if="examsStore.loading" class="text-center py-16 text-slate-400">
      Loading certificates registry...
    </div>

    <div
      v-else-if="examsStore.adminCertificates.length === 0"
      class="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm"
    >
      No certificate records found matching your filters.
    </div>

    <div v-else class="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th class="px-6 py-4">Certificate Code</th>
              <th class="px-6 py-4">Holder Name</th>
              <th class="px-6 py-4">Course Program</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Issued At</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="cert in examsStore.adminCertificates"
              :key="cert.uuid"
              class="hover:bg-slate-800/30 transition"
            >
              <td class="px-6 py-4 font-mono font-bold text-amber-400 text-xs">
                {{ cert.certificate_code }}
              </td>
              <td class="px-6 py-4 font-bold text-white">
                {{ cert.holder_name }}
              </td>
              <td class="px-6 py-4 text-xs text-slate-300">
                {{ cert.course_title }}
              </td>
              <td class="px-6 py-4">
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
              </td>
              <td class="px-6 py-4 text-xs text-slate-400 font-mono">
                {{ formatDate(cert.issued_at) }}
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <router-link
                  :to="{ name: 'certificate.verify', params: { code: cert.certificate_code } }"
                  class="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs text-slate-300 font-semibold transition inline-block"
                >
                  Public View
                </router-link>

                <button
                  v-if="cert.status === 'issued'"
                  @click="openReissueModal(cert)"
                  class="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition cursor-pointer"
                >
                  Reissue
                </button>

                <button
                  v-if="cert.status === 'issued'"
                  @click="openRevokeModal(cert)"
                  class="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300 text-xs font-bold transition cursor-pointer"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Revoke Modal -->
    <div
      v-if="revokeModalOpen"
      class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-red-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4">
        <h3 class="text-xl font-bold text-red-400">Revoke Official Credential</h3>
        <p class="text-xs text-slate-300 leading-relaxed">
          Revoking <span class="font-mono text-white font-bold">{{ targetCert?.certificate_code }}</span> will mark it as null and void on the public verification portal and invalidate the digital signature.
        </p>

        <div>
          <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Reason for Revocation</label>
          <textarea
            v-model="revokeReason"
            rows="3"
            placeholder="State the official administrative rationale..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="revokeModalOpen = false"
            class="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            @click="handleRevokeSubmit"
            :disabled="processing || !revokeReason.trim()"
            class="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition disabled:opacity-50"
          >
            {{ processing ? 'Revoking...' : 'Confirm Revocation' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reissue Modal -->
    <div
      v-if="reissueModalOpen"
      class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4">
        <h3 class="text-xl font-bold text-white">Reissue Certificate with Correction</h3>
        <p class="text-xs text-slate-300 leading-relaxed">
          The old code <span class="font-mono text-amber-400 font-bold">{{ targetCert?.certificate_code }}</span> will be superseded and marked as replaced. A fresh certificate with a new QR code will be generated.
        </p>

        <div>
          <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Corrected Holder Full Name</label>
          <input
            v-model="newHolderName"
            type="text"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Audit Reason</label>
          <input
            v-model="reissueReason"
            type="text"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="reissueModalOpen = false"
            class="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            @click="handleReissueSubmit"
            :disabled="processing || !newHolderName.trim()"
            class="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
          >
            {{ processing ? 'Reissuing...' : 'Reissue Credential' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
