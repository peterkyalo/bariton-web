import { defineStore } from 'pinia'
import http from '@/lib/http'

/** Activity log and notification delivery log (admin audit domain). */
export const useAuditStore = defineStore('audit', {
  state: () => ({
    activity: [],
    activityMeta: null,
    notifications: [],
    notificationsMeta: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchActivity(page = 1) {
      this.loading = true
      this.error = null
      try {
        const { data } = await http.get('/admin/activity-log', { params: { page } })
        this.activity = data.data
        this.activityMeta = data.meta
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },

    async fetchNotifications(page = 1) {
      this.loading = true
      this.error = null
      try {
        const { data } = await http.get('/admin/notification-logs', { params: { page } })
        this.notifications = data.data
        this.notificationsMeta = data.meta
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },

    async sendTestSms(payload) {
      const { data } = await http.post('/admin/test-sms', payload)
      return data
    },
  },
})
