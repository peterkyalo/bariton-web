import { defineStore } from 'pinia'
import http from '@/lib/http'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    groups: [],
    publicSettings: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetch() {
      this.loading = true
      this.error = null
      try {
        const { data } = await http.get('/admin/settings')
        this.groups = data.data
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },

    async save(values) {
      const { data } = await http.put('/admin/settings', { settings: values })
      this.groups = data.data
      this.publicSettings = null
      return this.groups
    },

    async fetchPublic() {
      if (this.publicSettings) return this.publicSettings
      const { data } = await http.get('/settings/public')
      this.publicSettings = data.data
      return this.publicSettings
    },
  },
})
