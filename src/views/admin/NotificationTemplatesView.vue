<script setup>
import { ref, onMounted } from 'vue'
import { useNotificationTemplateStore } from '@/stores/notificationTemplates'

const templateStore = useNotificationTemplateStore()

const editingTemplate = ref(null)
const saveLoading = ref(false)
const testLoading = ref(false)
const alertMessage = ref(null)

onMounted(async () => {
  await templateStore.fetchTemplates()
})

function openEditor(t) {
  editingTemplate.value = { ...t }
  alertMessage.value = null
}

function insertVariable(v) {
  if (!editingTemplate.value) return
  const token = `{{ ${v} }}`
  if (editingTemplate.value.channel === 'sms' || !editingTemplate.value.email_body) {
    editingTemplate.value.sms_body = (editingTemplate.value.sms_body || '') + ' ' + token
  } else {
    editingTemplate.value.email_body = (editingTemplate.value.email_body || '') + ' ' + token
  }
}

async function saveTemplate() {
  if (!editingTemplate.value) return
  saveLoading.value = true
  alertMessage.value = null
  try {
    await templateStore.updateTemplate(editingTemplate.value.key, {
      name: editingTemplate.value.name,
      channel: editingTemplate.value.channel,
      email_subject: editingTemplate.value.email_subject,
      email_body: editingTemplate.value.email_body,
      sms_body: editingTemplate.value.sms_body,
      is_active: editingTemplate.value.is_active,
    })
    alertMessage.value = { type: 'success', text: 'Template saved successfully!' }
    editingTemplate.value = null
  } catch (err) {
    alertMessage.value = { type: 'error', text: err.response?.data?.message || 'Failed to save template.' }
  } finally {
    saveLoading.value = false
  }
}

async function handleTestSend(key) {
  testLoading.value = true
  alertMessage.value = null
  try {
    const res = await templateStore.testSend(key)
    alertMessage.value = {
      type: 'success',
      text: `Test notification dispatched to your email and phone! Channels: ${JSON.stringify(res.result?.channels || res.result?.status)}`,
    }
  } catch (err) {
    alertMessage.value = { type: 'error', text: err.response?.data?.message || 'Test send failed.' }
  } finally {
    testLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="glass p-6 sm:p-8 border-brass-400/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass-400/10 border border-brass-400/20 text-brass-300 text-xs font-semibold uppercase tracking-wider mb-2">
          Automated Messaging & Communications
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Notification Templates Management
        </h1>
        <p class="text-xs text-ink-300 mt-1 max-w-xl">
          Customize transactional email and SMS templates for registrations, payment confirmations, official receipts, refund decisions, grades, and calendar reminders.
        </p>
      </div>
    </div>

    <!-- Alert / Message -->
    <div
      v-if="alertMessage"
      :class="alertMessage.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'"
      class="border rounded-xl p-4 text-xs flex items-center justify-between"
    >
      <span>{{ alertMessage.text }}</span>
      <button @click="alertMessage = null" class="text-slate-400 hover:text-white">&times;</button>
    </div>

    <!-- Templates Table -->
    <div class="glass rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-ink-300">
          <thead class="bg-slate-950/70 text-ink-400 uppercase border-b border-white/10">
            <tr>
              <th class="py-3.5 px-4">Template Name</th>
              <th class="py-3.5 px-4">Key / Slug</th>
              <th class="py-3.5 px-4">Category</th>
              <th class="py-3.5 px-4">Channel</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="t in templateStore.templates" :key="t.id" class="hover:bg-white/[0.02]">
              <td class="py-3.5 px-4 font-bold text-white">
                {{ t.name }}
              </td>
              <td class="py-3.5 px-4 font-mono text-brass-400">
                {{ t.key }}
              </td>
              <td class="py-3.5 px-4">
                <span
                  :class="t.category === 'security_payment' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-800 text-ink-300 border-slate-700'"
                  class="px-2 py-0.5 text-[10px] font-bold uppercase rounded border"
                >
                  {{ t.category.replace('_', ' ') }}
                </span>
              </td>
              <td class="py-3.5 px-4 capitalize font-semibold">
                {{ t.channel }}
              </td>
              <td class="py-3.5 px-4">
                <span
                  :class="t.is_active ? 'text-emerald-400' : 'text-slate-500'"
                  class="font-semibold text-xs flex items-center gap-1.5"
                >
                  <span class="w-2 h-2 rounded-full" :class="t.is_active ? 'bg-emerald-400' : 'bg-slate-500'"></span>
                  {{ t.is_active ? 'Active' : 'Disabled' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right space-x-2">
                <button
                  @click="handleTestSend(t.key)"
                  :disabled="testLoading"
                  class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-ink-200 transition-colors"
                >
                  Test Send
                </button>
                <button
                  @click="openEditor(t)"
                  class="px-2.5 py-1 text-xs font-bold rounded bg-brass-500 hover:bg-brass-400 text-slate-950 transition-colors"
                >
                  Edit Template
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Template Modal Editor -->
    <div
      v-if="editingTemplate"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 class="font-bold text-white text-lg">Edit Notification Template</h3>
            <p class="text-xs text-ink-400">Key: <span class="font-mono text-brass-400">{{ editingTemplate.key }}</span></p>
          </div>
          <button @click="editingTemplate = null" class="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>

        <div class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-ink-300 uppercase mb-1">Template Display Name</label>
            <input
              type="text"
              v-model="editingTemplate.name"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-ink-300 uppercase mb-1">Delivery Channel</label>
              <select
                v-model="editingTemplate.channel"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="both">Both (Email & SMS)</option>
                <option value="email">Email Only</option>
                <option value="sms">SMS Only</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-ink-300 uppercase mb-1">Status</label>
              <div class="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  v-model="editingTemplate.is_active"
                  class="rounded border-slate-700 text-brass-500 focus:ring-brass-500"
                />
                <label for="isActiveToggle" class="text-white font-medium">Active for automated dispatches</label>
              </div>
            </div>
          </div>

          <!-- Variable Pills -->
          <div v-if="editingTemplate.variables && editingTemplate.variables.length > 0">
            <span class="block font-semibold text-ink-400 uppercase text-[10px] mb-1.5">Available Placeholder Variables:</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="v in editingTemplate.variables"
                :key="v"
                type="button"
                @click="insertVariable(v)"
                class="px-2 py-0.5 rounded bg-brass-400/10 hover:bg-brass-400/20 text-brass-300 border border-brass-400/30 font-mono text-[11px]"
              >
                + &#123;&#123; {{ v }} &#125;&#125;
              </button>
            </div>
          </div>

          <!-- Email Subject -->
          <div v-if="editingTemplate.channel !== 'sms'">
            <label class="block font-semibold text-ink-300 uppercase mb-1">Email Subject Line</label>
            <input
              type="text"
              v-model="editingTemplate.email_subject"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
            />
          </div>

          <!-- Email Body -->
          <div v-if="editingTemplate.channel !== 'sms'">
            <label class="block font-semibold text-ink-300 uppercase mb-1">Email Body (Plain Text / Double-Brace Tokens)</label>
            <textarea
              v-model="editingTemplate.email_body"
              rows="6"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono leading-relaxed"
            ></textarea>
          </div>

          <!-- SMS Body -->
          <div v-if="editingTemplate.channel !== 'email'">
            <div class="flex justify-between items-center mb-1">
              <label class="font-semibold text-ink-300 uppercase">SMS Text Message</label>
              <span class="text-[11px] text-ink-500">
                {{ (editingTemplate.sms_body || '').length }} characters (~{{ Math.ceil(((editingTemplate.sms_body || '').length || 1) / 160) }} SMS)
              </span>
            </div>
            <textarea
              v-model="editingTemplate.sms_body"
              rows="3"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
            ></textarea>
          </div>
        </div>

        <div class="border-t border-slate-800 pt-4 flex justify-between items-center">
          <button
            type="button"
            @click="handleTestSend(editingTemplate.key)"
            :disabled="testLoading"
            class="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-ink-300 hover:text-white"
          >
            {{ testLoading ? 'Dispatching Test...' : 'Send Live Test' }}
          </button>

          <div class="flex gap-2">
            <button
              type="button"
              @click="editingTemplate = null"
              class="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="saveTemplate"
              :disabled="saveLoading"
              class="px-5 py-2 text-xs font-bold rounded-lg bg-brass-500 hover:bg-brass-400 text-slate-950 disabled:opacity-50"
            >
              {{ saveLoading ? 'Saving...' : 'Save Template' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
