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
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
    toggleSidebar(value) {
      this.sidebarOpen = typeof value === 'boolean' ? value : !this.sidebarOpen
    },
  },
})
