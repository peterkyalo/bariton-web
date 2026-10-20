<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'
import Modal from '@/components/ui/Modal.vue'

const auth = useAuthStore()
const ui = useUiStore()

// Profile Form
const profileForm = ref({
  name: auth.user?.name || '',
  phone: auth.user?.phone || '',
  date_of_birth: auth.user?.date_of_birth || '',
})
const profileLoading = ref(false)

// Password Form
const passwordForm = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})
const passwordLoading = ref(false)

// 2FA state
const qrModalOpen = ref(false)
const qrData = ref(null)
const totpCode = ref('')
const totpLoading = ref(false)
const recoveryCodesModalOpen = ref(false)
const activeRecoveryCodes = ref([])

// GDPR / Exports state
const exportsList = ref([])
const exportLoading = ref(false)
const deletionReason = ref('')
const deletionLoading = ref(false)

// Notification Preferences
import { useNotificationTemplateStore } from '@/stores/notificationTemplates'
const notifStore = useNotificationTemplateStore()
const notifPreferences = ref({
  event_reminders: true,
  session_reminders: true,
  assignment_graded: true,
  marketing: false,
})
const notifLoading = ref(false)

onMounted(async () => {
  if (auth.isAuthenticated) {
    loadExports()
    loadPreferences()
  }
})

async function loadPreferences() {
  try {
    const data = await notifStore.fetchPreferences()
    if (data?.preferences) {
      notifPreferences.value = {
        event_reminders: Boolean(data.preferences.event_reminders ?? true),
        session_reminders: Boolean(data.preferences.session_reminders ?? true),
        assignment_graded: Boolean(data.preferences.assignment_graded ?? true),
        marketing: Boolean(data.preferences.marketing ?? false),
      }
    }
  } catch (e) {}
}

async function savePreferences() {
  notifLoading.value = true
  try {
    await notifStore.updatePreferences(notifPreferences.value)
    ui.toast('Notification preferences saved.', 'success')
  } catch (err) {
    ui.toast('Failed to save preferences.', 'error')
  } finally {
    notifLoading.value = false
  }
}

async function saveProfile() {
  profileLoading.value = true
  try {
    await auth.updateProfile(profileForm.value)
    ui.toast('Profile details updated.', 'success')
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    profileLoading.value = false
  }
}

async function changePassword() {
  passwordLoading.value = true
  try {
    await auth.updatePassword(passwordForm.value)
    ui.toast('Password updated successfully.', 'success')
    passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    passwordLoading.value = false
  }
}

async function startTwoFactorSetup() {
  totpLoading.value = true
  try {
    await auth.enableTwoFactor()
    const data = await auth.twoFactorQrCode()
    qrData.value = data
    qrModalOpen.value = true
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    totpLoading.value = false
  }
}

async function confirmTwoFactor() {
  totpLoading.value = true
  try {
    const response = await auth.confirmTwoFactor(totpCode.value)
    qrModalOpen.value = false
    totpCode.value = ''
    ui.toast('Two-factor authentication successfully activated!', 'success')
    if (response?.recovery_codes) {
      activeRecoveryCodes.value = response.recovery_codes
      recoveryCodesModalOpen.value = true
    }
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    totpLoading.value = false
  }
}

async function disableTwoFactor() {
  if (!confirm('Are you sure you want to disable two-factor authentication?')) return
  totpLoading.value = true
  try {
    await auth.disableTwoFactor()
    ui.toast('Two-factor authentication has been disabled.', 'info')
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    totpLoading.value = false
  }
}

async function viewRecoveryCodes() {
  try {
    const codes = await auth.recoveryCodes()
    activeRecoveryCodes.value = codes
    recoveryCodesModalOpen.value = true
  } catch (err) {
    ui.toast('Could not fetch recovery codes.', 'error')
  }
}

async function loadExports() {
  try {
    exportsList.value = await auth.dataExports()
  } catch {
    // Silent
  }
}

async function requestDataExport() {
  exportLoading.value = true
  try {
    await auth.requestDataExport()
    ui.toast('Data export generated. Check the downloads list below.', 'success')
    await loadExports()
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    exportLoading.value = false
  }
}

async function requestDeletion() {
  if (!confirm('Submit an official account deletion request under the Kenya Data Protection Act 2019?')) return
  deletionLoading.value = true
  try {
    await auth.requestDeletion(deletionReason.value)
    ui.toast('Account deletion request submitted for administrative review.', 'info')
    deletionReason.value = ''
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    deletionLoading.value = false
  }
}

async function cancelDeletion() {
  deletionLoading.value = true
  try {
    await auth.cancelDeletion()
    ui.toast('Account deletion request cancelled.', 'success')
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    deletionLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-8 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-white">Account Settings & Security</h1>
      <p class="text-xs text-ink-400 mt-1">Manage your student profile, credentials, two-factor authentication, and privacy data.</p>
    </div>

    <!-- Section 1: Profile Information -->
    <div class="glass p-6 sm:p-7">
      <div class="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
        <div>
          <h2 class="text-base font-semibold text-white">Personal Information</h2>
          <p class="text-xs text-ink-400">Used for certificate issuance and official academy communications</p>
        </div>
        <span v-if="auth.isVerified" class="badge-success">Verified Account</span>
        <span v-else class="badge-warning">Email Unverified</span>
      </div>

      <form @submit.prevent="saveProfile" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="field-label">Full Name</label>
            <input v-model="profileForm.name" type="text" required class="field-input" />
          </div>

          <div>
            <label class="field-label">Email Address</label>
            <input :value="auth.user?.email" type="email" disabled class="field-input opacity-60 cursor-not-allowed" />
            <p class="field-hint">Email address cannot be modified directly.</p>
          </div>

          <div>
            <label class="field-label">Phone (M-Pesa / SMS)</label>
            <input v-model="profileForm.phone" type="tel" class="field-input" placeholder="+254..." />
          </div>

          <div>
            <label class="field-label">Date of Birth</label>
            <input v-model="profileForm.date_of_birth" type="date" class="field-input" />
          </div>
        </div>

        <div class="pt-2 flex justify-end">
          <button type="submit" class="btn-primary text-xs !py-2 !px-4" :disabled="profileLoading">
            {{ profileLoading ? 'Saving...' : 'Save Profile Details' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Section 2: Password Update -->
    <div class="glass p-6 sm:p-7">
      <div class="pb-4 mb-5 border-b border-white/[0.08]">
        <h2 class="text-base font-semibold text-white">Change Password</h2>
        <p class="text-xs text-ink-400">Ensure your account is using a long, random password to stay secure</p>
      </div>

      <form @submit.prevent="changePassword" class="space-y-4 max-w-md">
        <div>
          <label class="field-label">Current Password</label>
          <input v-model="passwordForm.current_password" type="password" required class="field-input" />
        </div>

        <div>
          <label class="field-label">New Password</label>
          <input v-model="passwordForm.password" type="password" required class="field-input" />
        </div>

        <div>
          <label class="field-label">Confirm New Password</label>
          <input v-model="passwordForm.password_confirmation" type="password" required class="field-input" />
        </div>

        <button type="submit" class="btn-secondary text-xs !py-2 !px-4" :disabled="passwordLoading">
          {{ passwordLoading ? 'Updating...' : 'Update Password' }}
        </button>
      </form>
    </div>

    <!-- Section 3: Two-Factor Authentication -->
    <div class="glass p-6 sm:p-7">
      <div class="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
        <div>
          <h2 class="text-base font-semibold text-white">Two-Factor Authentication (TOTP)</h2>
          <p class="text-xs text-ink-400">Protect your account using Google Authenticator, Authy, or 1Password</p>
        </div>
        <span v-if="auth.user?.two_factor_enabled" class="badge-success">2FA Enabled</span>
        <span v-else-if="auth.user?.two_factor_required" class="badge-danger">Mandatory for Role</span>
        <span v-else class="badge-muted">Disabled</span>
      </div>

      <div class="space-y-4">
        <p class="text-xs text-ink-300 leading-relaxed">
          When two-factor authentication is enabled, you will be prompted for a secure, random 6-digit pin during login.
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <button
            v-if="!auth.user?.two_factor_enabled"
            type="button"
            class="btn-primary text-xs !py-2 !px-4"
            :disabled="totpLoading"
            @click="startTwoFactorSetup"
          >
            {{ totpLoading ? 'Setting up...' : 'Enable Two-Factor Authentication' }}
          </button>

          <template v-else>
            <button
              type="button"
              class="btn-secondary text-xs !py-2 !px-4"
              @click="viewRecoveryCodes"
            >
              View Recovery Codes
            </button>

            <button
              v-if="!auth.user?.two_factor_required"
              type="button"
              class="btn-danger text-xs !py-2 !px-4"
              :disabled="totpLoading"
              @click="disableTwoFactor"
            >
              Disable 2FA
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Section 4: GDPR / Kenya Data Protection Act 2019 -->
    <div class="glass p-6 sm:p-7">
      <div class="pb-4 mb-5 border-b border-white/[0.08]">
        <h2 class="text-base font-semibold text-white">Privacy & Data Governance</h2>
        <p class="text-xs text-ink-400">Exercise your rights under the Kenya Data Protection Act 2019 (ODPC Compliant)</p>
      </div>

      <div class="space-y-6">
        <!-- Data Portability -->
        <div>
          <h3 class="text-xs font-semibold text-white uppercase tracking-wider mb-2">Personal Data Portability</h3>
          <p class="text-xs text-ink-300 mb-3">Download a machine-readable JSON copy of all personal records and activity.</p>
          <button
            type="button"
            class="btn-secondary text-xs !py-2 !px-4"
            :disabled="exportLoading"
            @click="requestDataExport"
          >
            {{ exportLoading ? 'Generating Export...' : 'Generate New Data Export' }}
          </button>

          <!-- Past exports list -->
          <div v-if="exportsList.length > 0" class="mt-4 space-y-2">
            <div
              v-for="item in exportsList"
              :key="item.id"
              class="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-medium text-white">Export #{{ item.id }}</span>
                <span class="text-ink-400 ml-2">({{ new Date(item.created_at).toLocaleDateString() }})</span>
              </div>
              <a
                :href="`/api/v1/me/data-exports/${item.id}/download`"
                target="_blank"
                class="text-brass-300 font-semibold hover:underline"
              >
                Download JSON
              </a>
            </div>
          </div>
        </div>

        <!-- Deletion Request -->
        <div class="pt-4 border-t border-white/[0.06]">
          <h3 class="text-xs font-semibold text-danger-400 uppercase tracking-wider mb-2">Right to Erasure / Account Deletion</h3>
          <div v-if="auth.user?.deletion_requested_at" class="p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-danger-300 flex items-center justify-between">
            <span>Erasure requested on {{ new Date(auth.user.deletion_requested_at).toLocaleDateString() }}.</span>
            <button
              type="button"
              class="text-xs font-semibold underline hover:text-white"
              :disabled="deletionLoading"
              @click="cancelDeletion"
            >
              Cancel request
            </button>
          </div>

          <div v-else class="space-y-3">
            <p class="text-xs text-ink-300">
              Request permanent deletion of your academy user profile and personal data.
            </p>
            <input
              v-model="deletionReason"
              type="text"
              placeholder="Optional reason for account closure"
              class="field-input text-xs max-w-md"
            />
            <button
              type="button"
              class="btn-danger text-xs !py-2 !px-4"
              :disabled="deletionLoading"
              @click="requestDeletion"
            >
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification Preferences Card (Phase 8) -->
    <div class="glass p-6 sm:p-8 space-y-6 rounded-2xl">
      <div class="border-b border-white/[0.06] pb-4">
        <h2 class="text-lg font-bold text-white">Notification Preferences</h2>
        <p class="text-xs text-ink-300 mt-1">
          Customize which automated notifications you receive via Email and SMS. Security verifications and payment receipts are mandatory.
        </p>
      </div>

      <div class="space-y-4 text-xs">
        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <span class="font-bold text-white block">Bootcamp & Workshop Reminders</span>
            <span class="text-ink-400">Receive calendar reminders 24 hours prior to physical event check-in.</span>
          </div>
          <input
            type="checkbox"
            v-model="notifPreferences.event_reminders"
            class="rounded border-slate-700 text-brass-500 focus:ring-brass-500"
          />
        </div>

        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <span class="font-bold text-white block">1-on-1 Tutoring Session Reminders</span>
            <span class="text-ink-400">Receive alerts with video meeting links and studio room numbers before your session.</span>
          </div>
          <input
            type="checkbox"
            v-model="notifPreferences.session_reminders"
            class="rounded border-slate-700 text-brass-500 focus:ring-brass-500"
          />
        </div>

        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <span class="font-bold text-white block">Grading & Evaluation Feedback</span>
            <span class="text-ink-400">Instant notifications when instructors finish rubric evaluations or release exam grades.</span>
          </div>
          <input
            type="checkbox"
            v-model="notifPreferences.assignment_graded"
            class="rounded border-slate-700 text-brass-500 focus:ring-brass-500"
          />
        </div>

        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <span class="font-bold text-white block">Masterclasses & Academy Announcements</span>
            <span class="text-ink-400">Special invitations to guest maestro masterclasses and academy concert tickets.</span>
          </div>
          <input
            type="checkbox"
            v-model="notifPreferences.marketing"
            class="rounded border-slate-700 text-brass-500 focus:ring-brass-500"
          />
        </div>

        <div class="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-ink-400 flex items-start gap-2">
          <span class="text-brass-300">ℹ</span>
          <span>
            <strong>Mandatory Notifications:</strong> Two-factor login challenges, password resets, payment confirmations, and official sequential tax receipts are always sent and cannot be disabled.
          </span>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          type="button"
          class="btn-primary text-xs !py-2.5 !px-5"
          :disabled="notifLoading"
          @click="savePreferences"
        >
          {{ notifLoading ? 'Saving Preferences...' : 'Save Notification Preferences' }}
        </button>
      </div>
    </div>

    <!-- Modal: QR Code 2FA Setup -->
    <Modal :open="qrModalOpen" title="Scan Authenticator QR Code" @close="qrModalOpen = false">
      <div class="text-center space-y-4">
        <p class="text-xs text-ink-300">
          Open your authenticator app (Google Authenticator, Authy) and scan this QR code:
        </p>

        <div v-if="qrData?.svg" class="p-4 bg-white rounded-2xl inline-block mx-auto" v-html="qrData.svg"></div>

        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-brass-300 select-all">
          Secret: {{ qrData?.secret }}
        </div>

        <div>
          <label class="field-label !text-left">Enter 6-digit confirmation code</label>
          <input
            v-model="totpCode"
            type="text"
            maxlength="6"
            placeholder="123456"
            class="field-input text-center text-lg tracking-widest font-mono"
          />
        </div>

        <button
          type="button"
          class="btn-primary w-full !py-2.5"
          :disabled="totpLoading || totpCode.length < 6"
          @click="confirmTwoFactor"
        >
          Confirm & Activate 2FA
        </button>
      </div>
    </Modal>

    <!-- Modal: Recovery Codes -->
    <Modal :open="recoveryCodesModalOpen" title="Two-Factor Recovery Codes" @close="recoveryCodesModalOpen = false">
      <div class="space-y-4">
        <p class="text-xs text-ink-300 leading-relaxed">
          Store these emergency recovery codes in a secure password manager. Each code can only be used once if you lose your phone.
        </p>

        <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-brass-200">
          <div v-for="c in activeRecoveryCodes" :key="c" class="p-1">
            {{ c }}
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button type="button" class="btn-primary text-xs !py-2 !px-4" @click="recoveryCodesModalOpen = false">
            I have saved these codes
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
