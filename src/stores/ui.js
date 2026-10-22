import { defineStore } from 'pinia'

let nextId = 1

export const useUiStore = defineStore('ui', {
  state: () => ({
    toasts: [],
    sidebarOpen: false,
  }),

  actions: {
    toast(message, type = 'success', timeout = 4000) {
      const id = nextId++
      this.toasts.push({ id, message, type })
      if (timeout) setTimeout(() => this.dismiss(id), timeout)
      return id
    },
    notify(payload) {
      if (!payload) return null
      if (typeof payload === 'string') {
        return this.toast(payload)
      }
      const { type = 'info', title = '', message = '', timeout = 4000 } = payload
      const text = title ? (message ? `${title}: ${message}` : title) : message
      return this.toast(text, type, timeout)
    },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
    toggleSidebar(value) {
      this.sidebarOpen = typeof value === 'boolean' ? value : !this.sidebarOpen
    },
  },
})
