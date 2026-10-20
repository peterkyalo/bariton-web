<script setup>
import { onMounted, ref } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'
import Modal from '@/components/ui/Modal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const usersStore = useUsersStore()
const ui = useUiStore()

const createModalOpen = ref(false)
const rolesModalOpen = ref(false)
const selectedUser = ref(null)

// Create Form
const createForm = ref({
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  roles: ['student'],
  status: 'active',
  password: '',
})
const createLoading = ref(false)
const createErrors = ref({})

// Roles Form
const selectedRoles = ref([])
const rolesLoading = ref(false)

onMounted(async () => {
  await Promise.all([
    usersStore.fetch(),
    usersStore.fetchRoles(),
  ])
})

function applyFilter() {
  usersStore.fetch({ page: 1 })
}

function openCreateModal() {
  createForm.value = {
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    roles: ['student'],
    status: 'active',
    password: '',
  }
  createErrors.value = {}
  createModalOpen.value = true
}

async function handleCreateUser() {
  createLoading.value = true
  createErrors.value = {}
  try {
    await usersStore.create(createForm.value)
    ui.toast('User created successfully.', 'success')
    createModalOpen.value = false
    await usersStore.fetch()
  } catch (err) {
    const { message, errors } = parseError(err)
    createErrors.value = errors
    ui.toast(message, 'error')
  } finally {
    createLoading.value = false
  }
}

function openRolesModal(user) {
  selectedUser.value = user
  selectedRoles.value = [...(user.roles || [])]
  rolesModalOpen.value = true
}

async function handleSaveRoles() {
  if (!selectedUser.value) return
  rolesLoading.value = true
  try {
    await usersStore.updateRoles(selectedUser.value.id, selectedRoles.value)
    ui.toast(`Roles updated for ${selectedUser.value.name}`, 'success')
    rolesModalOpen.value = false
    await usersStore.fetch()
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    rolesLoading.value = false
  }
}

async function toggleStatus(user) {
  const newStatus = user.status === 'active' ? 'suspended' : 'active'
  if (!confirm(`Are you sure you want to mark ${user.name} as ${newStatus}?`)) return
  try {
    await usersStore.updateStatus(user.id, newStatus)
    ui.toast(`Status updated to ${newStatus}`, 'success')
    await usersStore.fetch()
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-white">User Administration & RBAC</h1>
        <p class="text-xs text-ink-400 mt-1">Manage accounts, assign system roles, and configure authorization.</p>
      </div>
      <button type="button" class="btn-primary text-xs !py-2 !px-4" @click="openCreateModal">
        + Create New User
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="glass p-4 flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="usersStore.filters.search"
          type="text"
          placeholder="Search by name, email, phone..."
          class="field-input text-xs !py-2"
          @keyup.enter="applyFilter"
        />
      </div>

      <div class="w-40">
        <select
          v-model="usersStore.filters.role"
          class="field-input text-xs !py-2"
          @change="applyFilter"
        >
          <option value="">All Roles</option>
          <option v-for="r in usersStore.roles" :key="r.id" :value="r.name">{{ r.name }}</option>
        </select>
      </div>

      <div class="w-36">
        <select
          v-model="usersStore.filters.status"
          class="field-input text-xs !py-2"
          @change="applyFilter"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending_guardian">Pending Guardian</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <button type="button" class="btn-secondary text-xs !py-2 !px-3" @click="applyFilter">
        Filter
      </button>
    </div>

    <!-- Data Table -->
    <div class="glass overflow-hidden">
      <div v-if="usersStore.loading" class="py-12">
        <LoadingSpinner text="Loading users..." />
      </div>

      <div v-else-if="usersStore.items.length === 0">
        <EmptyState title="No users found" description="Try adjusting your search or filters." />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>2FA</th>
              <th>Roles</th>
              <th>Created</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usersStore.items" :key="u.id">
              <td>
                <div class="font-medium text-white">{{ u.name }}</div>
                <div class="text-xs text-ink-400">{{ u.email }} <span v-if="u.phone">• {{ u.phone }}</span></div>
              </td>
              <td>
                <span v-if="u.status === 'active'" class="badge-success">Active</span>
                <span v-else-if="u.status === 'pending_guardian'" class="badge-brass">Pending Guardian</span>
                <span v-else class="badge-danger">Suspended</span>
              </td>
              <td>
                <span v-if="u.two_factor_enabled" class="badge-success" title="2FA Active">✓ Enabled</span>
                <span v-else-if="u.two_factor_required" class="badge-danger" title="Mandatory for Staff">Required</span>
                <span v-else class="text-xs text-ink-500">Off</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="r in u.roles"
                    :key="r"
                    class="badge-aria text-[10px]"
                  >
                    {{ r }}
                  </span>
                </div>
              </td>
              <td class="text-xs text-ink-400">
                {{ new Date(u.created_at).toLocaleDateString() }}
              </td>
              <td class="text-right space-x-2">
                <button
                  type="button"
                  class="btn-ghost text-xs !py-1 !px-2"
                  @click="openRolesModal(u)"
                >
                  Roles
                </button>
                <button
                  type="button"
                  class="btn-ghost text-xs !py-1 !px-2"
                  :class="u.status === 'active' ? 'text-danger-400 hover:text-danger-300' : 'text-success-400 hover:text-success-300'"
                  @click="toggleStatus(u)"
                >
                  {{ u.status === 'active' ? 'Suspend' : 'Activate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="usersStore.meta && usersStore.meta.last_page > 1"
        class="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-ink-400"
      >
        <span>Page {{ usersStore.meta.current_page }} of {{ usersStore.meta.last_page }} ({{ usersStore.meta.total }} total)</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-secondary text-xs !py-1 !px-2.5"
            :disabled="usersStore.meta.current_page <= 1"
            @click="usersStore.fetch({ page: usersStore.meta.current_page - 1 })"
          >
            Previous
          </button>
          <button
            type="button"
            class="btn-secondary text-xs !py-1 !px-2.5"
            :disabled="usersStore.meta.current_page >= usersStore.meta.last_page"
            @click="usersStore.fetch({ page: usersStore.meta.current_page + 1 })"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Create User -->
    <Modal :open="createModalOpen" title="Create New Academy User" @close="createModalOpen = false">
      <form @submit.prevent="handleCreateUser" class="space-y-4">
        <div>
          <label class="field-label">Full Name</label>
          <input v-model="createForm.name" type="text" required class="field-input" :aria-invalid="!!createErrors.name" />
          <p v-if="createErrors.name" class="field-error">{{ createErrors.name }}</p>
        </div>

        <div>
          <label class="field-label">Email Address</label>
          <input v-model="createForm.email" type="email" required class="field-input" :aria-invalid="!!createErrors.email" />
          <p v-if="createErrors.email" class="field-error">{{ createErrors.email }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Phone</label>
            <input v-model="createForm.phone" type="tel" class="field-input" placeholder="+254..." />
          </div>
          <div>
            <label class="field-label">Date of Birth</label>
            <input v-model="createForm.date_of_birth" type="date" class="field-input" />
          </div>
        </div>

        <div>
          <label class="field-label">Assign Roles</label>
          <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <label v-for="r in usersStore.roles" :key="r.id" class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="createForm.roles"
                type="checkbox"
                :value="r.name"
                class="rounded border-white/20 bg-ink-850 text-brass-400"
              />
              <span class="text-white">{{ r.name }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="field-label">Initial Password</label>
          <input v-model="createForm.password" type="password" required class="field-input" placeholder="Min 8 characters" />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn-ghost text-xs" @click="createModalOpen = false">Cancel</button>
          <button type="submit" class="btn-primary text-xs" :disabled="createLoading">
            {{ createLoading ? 'Creating...' : 'Create User' }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal: Edit Roles -->
    <Modal :open="rolesModalOpen" :title="`Edit Roles: ${selectedUser?.name}`" @close="rolesModalOpen = false">
      <div class="space-y-4">
        <p class="text-xs text-ink-300">Select one or more system roles for this account:</p>

        <div class="space-y-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
          <label v-for="r in usersStore.roles" :key="r.id" class="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg">
            <input
              v-model="selectedRoles"
              type="checkbox"
              :value="r.name"
              class="rounded border-white/20 bg-ink-850 text-brass-400"
            />
            <div>
              <p class="font-semibold text-white">{{ r.name }}</p>
              <p class="text-[10px] text-ink-400">Perms: {{ r.permissions?.join(', ') || 'None' }}</p>
            </div>
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn-ghost text-xs" @click="rolesModalOpen = false">Cancel</button>
          <button type="button" class="btn-primary text-xs" :disabled="rolesLoading" @click="handleSaveRoles">
            {{ rolesLoading ? 'Saving...' : 'Save Roles' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
