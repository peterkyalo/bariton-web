import { defineStore } from 'pinia'
import http from '@/lib/http'

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [],
    meta: null,
    roles: [],
    filters: { search: '', role: '', status: '', page: 1 },
    loading: false,
    error: null,
  }),

  actions: {
    async fetch(overrides = {}) {
      Object.assign(this.filters, overrides)
      this.loading = true
      this.error = null
      try {
        const params = Object.fromEntries(Object.entries(this.filters).filter(([, v]) => v !== '' && v !== null))
        const { data } = await http.get('/admin/users', { params })
        this.items = data.data
        this.meta = data.meta
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },

    async fetchRoles() {
      if (this.roles.length) return this.roles
      const { data } = await http.get('/admin/roles')
      this.roles = data.data
      return this.roles
    },

    async get(id) {
      const { data } = await http.get(`/admin/users/${id}`)
      return data.data
    },

    async create(payload) {
      const { data } = await http.post('/admin/users', payload)
      return data.data
    },

    async update(id, payload) {
      const { data } = await http.put(`/admin/users/${id}`, payload)
      return data.data
    },

    async updateRoles(id, roles) {
      const { data } = await http.put(`/admin/users/${id}/roles`, { roles })
      return data.data
    },

    async updateStatus(id, status) {
      const { data } = await http.put(`/admin/users/${id}/status`, { status })
      return data.data
    },
  },
})
