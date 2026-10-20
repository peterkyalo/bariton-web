<script setup>
import { onMounted, ref } from 'vue'
import { useAuditStore } from '@/stores/audit'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'
import Modal from '@/components/ui/Modal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const audit = useAuditStore()
const ui = useUiStore()

const testSmsModalOpen = ref(false)
const testSmsForm = ref({ phone: '', message: '' })
const testSmsLoading = ref(false)

onMounted(() => {
  audit.fetchNotifications()
})

async function sendTestSms() {
  testSmsLoading.value = true
  try {
    await audit.sendTestSms(testSmsForm.value)
    ui.toast('Test SMS dispatched. Check delivery status in the table below.', 'success')
    testSmsModalOpen.value = false
    testSmsForm.value = { phone: '', message: '' }
    await audit.fetchNotifications()
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    testSmsLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-white">Notification Delivery Logs</h1>
        <p class="text-xs text-ink-400 mt-1">Audit status of dispatched emails and Africa's Talking SMS messages.</p>
      </div>

      <button type="button" class="btn-primary text-xs !py-2 !px-4" @click="testSmsModalOpen = true">
        📱 Send Test SMS
      </button>
    </div>

    <div class="glass overflow-hidden">
      <div v-if="audit.loading" class="py-12">
        <LoadingSpinner text="Loading notification logs..." />
      </div>

      <div v-else-if="audit.notifications.length === 0">
        <EmptyState title="No notifications logged" description="Sent emails and SMS will be recorded here with delivery statuses." />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Notification</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Provider Msg ID</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="notif in audit.notifications" :key="notif.id">
              <td>
                <span v-if="notif.channel === 'sms'" class="badge-brass text-[10px]">📱 SMS</span>
                <span v-else class="badge-aria text-[10px]">✉ MAIL</span>
              </td>
              <td>
                <span class="text-xs font-medium text-white">{{ notif.notification_type }}</span>
                <div v-if="notif.error" class="text-[10px] text-danger-400 mt-0.5 truncate max-w-xs">{{ notif.error }}</div>
              </td>
              <td class="text-xs font-mono text-ink-300">
                {{ notif.recipient }}
              </td>
              <td>
                <span v-if="notif.status === 'delivered'" class="badge-success">Delivered</span>
                <span v-else-if="notif.status === 'sent'" class="badge-brass">Sent</span>
                <span v-else-if="notif.status === 'failed'" class="badge-danger">Failed</span>
                <span v-else class="badge-muted">Queued</span>
              </td>
              <td class="text-xs font-mono text-ink-500">
                {{ notif.provider_message_id || '-' }}
              </td>
              <td class="text-xs text-ink-400 whitespace-nowrap">
                {{ notif.sent_at ? new Date(notif.sent_at).toLocaleString() : new Date(notif.created_at).toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="audit.notificationsMeta && audit.notificationsMeta.last_page > 1"
        class="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-ink-400"
      >
        <span>Page {{ audit.notificationsMeta.current_page }} of {{ audit.notificationsMeta.last_page }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-secondary text-xs !py-1 !px-2.5"
            :disabled="audit.notificationsMeta.current_page <= 1"
            @click="audit.fetchNotifications(audit.notificationsMeta.current_page - 1)"
          >
            Previous
          </button>
          <button
            type="button"
            class="btn-secondary text-xs !py-1 !px-2.5"
            :disabled="audit.notificationsMeta.current_page >= audit.notificationsMeta.last_page"
            @click="audit.fetchNotifications(audit.notificationsMeta.current_page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Send Test SMS -->
    <Modal :open="testSmsModalOpen" title="Send Africa's Talking Test SMS" @close="testSmsModalOpen = false">
      <form @submit.prevent="sendTestSms" class="space-y-4">
        <div>
          <label class="field-label">Recipient Phone Number</label>
          <input
            v-model="testSmsForm.phone"
            type="tel"
            required
            placeholder="e.g. 0712345678 or +254712345678"
            class="field-input"
          />
          <p class="field-hint">Numbers are automatically normalized to Kenyan +254 format.</p>
        </div>

        <div>
          <label class="field-label">Test SMS Message</label>
          <textarea
            v-model="testSmsForm.message"
            rows="3"
            placeholder="Bariton Music Academy test message..."
            class="field-input"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn-ghost text-xs" @click="testSmsModalOpen = false">Cancel</button>
          <button type="submit" class="btn-primary text-xs" :disabled="testSmsLoading">
            {{ testSmsLoading ? 'Dispatched...' : 'Send SMS Message' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>
