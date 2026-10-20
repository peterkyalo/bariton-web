<script setup>
import { onMounted } from 'vue'
import { useAuditStore } from '@/stores/audit'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const audit = useAuditStore()

onMounted(() => {
  audit.fetchActivity()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-white">System Activity Log</h1>
      <p class="text-xs text-ink-400 mt-1">Immutable audit log of user provisioning, role assignments, and settings edits.</p>
    </div>

    <div class="glass overflow-hidden">
      <div v-if="audit.loading" class="py-12">
        <LoadingSpinner text="Loading audit trail..." />
      </div>

      <div v-else-if="audit.activity.length === 0">
        <EmptyState title="No activity recorded" description="Actions performed by administrators will appear here." />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action Description</th>
              <th>Performed By</th>
              <th>Target Model</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="act in audit.activity" :key="act.id">
              <td class="text-xs font-mono text-ink-400 whitespace-nowrap">
                {{ new Date(act.created_at).toLocaleString() }}
              </td>
              <td>
                <span class="text-xs font-medium text-white">{{ act.description }}</span>
              </td>
              <td>
                <span v-if="act.causer" class="text-xs text-brass-300">
                  {{ act.causer.name }} ({{ act.causer.email }})
                </span>
                <span v-else class="text-xs text-ink-500">System</span>
              </td>
              <td class="text-xs text-ink-400 font-mono">
                <span v-if="act.subject_type">{{ act.subject_type }} #{{ act.subject_id }}</span>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="audit.activityMeta && audit.activityMeta.last_page > 1"
        class="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-ink-400"
      >
        <span>Page {{ audit.activityMeta.current_page }} of {{ audit.activityMeta.last_page }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-secondary text-xs !py-1 !px-2.5"
            :disabled="audit.activityMeta.current_page <= 1"
            @click="audit.fetchActivity(audit.activityMeta.current_page - 1)"
          >
            Previous
          </button>
          <button
            type="button"
            class="btn-secondary text-xs !py-1 !px-2.5"
            :disabled="audit.activityMeta.current_page >= audit.activityMeta.last_page"
            @click="audit.fetchActivity(audit.activityMeta.current_page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
