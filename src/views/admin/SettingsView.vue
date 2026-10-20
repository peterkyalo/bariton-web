<script setup>
import { onMounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const settingsStore = useSettingsStore()
const ui = useUiStore()

const formData = ref({})
const saving = ref(false)

onMounted(async () => {
  await load()
})

async function load() {
  await settingsStore.fetch()
  const map = {}
  for (const group of settingsStore.groups) {
    for (const item of group.items) {
      map[item.key] = item.type === 'json' ? JSON.stringify(item.value, null, 2) : item.value
    }
  }
  formData.value = map
}

async function save() {
  saving.value = true
  try {
    const payload = {}
    for (const [key, val] of Object.entries(formData.value)) {
      // Find setting type
      let type = 'string'
      for (const group of settingsStore.groups) {
        const found = group.items.find((i) => i.key === key)
        if (found) {
          type = found.type
          break
        }
      }

      if (type === 'integer') payload[key] = parseInt(val, 10)
      else if (type === 'float') payload[key] = parseFloat(val)
      else if (type === 'boolean') payload[key] = Boolean(val)
      else if (type === 'json') {
        try {
          payload[key] = typeof val === 'string' ? JSON.parse(val) : val
        } catch {
          payload[key] = val
        }
      } else {
        payload[key] = val
      }
    }

    await settingsStore.save(payload)
    ui.toast('System settings updated successfully. Cached across all workers.', 'success')
  } catch (err) {
    const { message } = parseError(err)
    ui.toast(message, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-white">System Settings & Defaults</h1>
        <p class="text-xs text-ink-400 mt-1">Configure limits, financial exchange rates, exam pass marks, and business rules.</p>
      </div>

      <button
        type="button"
        class="btn-primary text-xs !py-2 !px-5"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? 'Saving Changes...' : 'Save All Settings' }}
      </button>
    </div>

    <div v-if="settingsStore.loading" class="py-16">
      <LoadingSpinner text="Loading system settings..." />
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="group in settingsStore.groups"
        :key="group.group"
        class="glass p-6 sm:p-7"
      >
        <div class="pb-3 mb-4 border-b border-white/[0.08] flex items-center justify-between">
          <h2 class="text-sm font-semibold text-white uppercase tracking-wider">
            {{ group.group }} settings
          </h2>
          <span class="badge-brass text-[10px]">{{ group.items.length }} parameters</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div v-for="item in group.items" :key="item.key" class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label :for="item.key" class="field-label !mb-0 font-medium">
                {{ item.label }}
              </label>
              <span class="text-[10px] font-mono text-ink-500">{{ item.key }}</span>
            </div>

            <!-- Integer / Float -->
            <input
              v-if="item.type === 'integer' || item.type === 'float'"
              :id="item.key"
              v-model="formData[item.key]"
              type="number"
              step="any"
              class="field-input text-xs"
            />

            <!-- Boolean -->
            <label
              v-else-if="item.type === 'boolean'"
              class="flex items-center gap-2.5 p-2 rounded-xl bg-ink-850 cursor-pointer text-xs text-white"
            >
              <input
                v-model="formData[item.key]"
                type="checkbox"
                class="rounded border-white/20 bg-ink-900 text-brass-400"
              />
              <span>Enabled</span>
            </label>

            <!-- JSON Textarea -->
            <textarea
              v-else-if="item.type === 'json'"
              :id="item.key"
              v-model="formData[item.key]"
              rows="3"
              class="field-input text-xs font-mono"
            ></textarea>

            <!-- String Default -->
            <input
              v-else
              :id="item.key"
              v-model="formData[item.key]"
              type="text"
              class="field-input text-xs"
            />

            <p class="field-hint text-[11px]">{{ item.description }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          type="button"
          class="btn-primary text-xs !py-2.5 !px-6"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Saving Changes...' : 'Save All Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>
