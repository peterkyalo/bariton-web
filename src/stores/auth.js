import { defineStore } from 'pinia'
import http from '@/lib/http'
import { buildMenu, homeRouteFor } from '@/lib/menu'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    initialized: false,
    initPromise: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    permissions: (state) => state.user?.permissions ?? [],
    roles: (state) => state.user?.roles ?? [],
    isVerified: (state) => !!state.user?.email_verified,
    needsTwoFactorSetup: (state) => !!state.user?.two_factor_required && !state.user?.two_factor_enabled,
    menu() {
      return buildMenu(this.permissions)
    },
    homeRoute() {
      return homeRouteFor(this.permissions)
    },
    isStaff() {
      return this.permissions.some((p) => p !== 'dashboard.student')
    },
  },

  actions: {
    can(permission) {
      if (!permission) return true
      const list = Array.isArray(permission) ? permission : [permission]
      return list.every((p) => this.permissions.includes(p))
    },

    async init() {
      if (this.initialized) return
      if (!this.initPromise) {
        this.initPromise = this.fetchUser().finally(() => {
          this.initialized = true
          this.initPromise = null
        })
      }
      return this.initPromise
    },

    async fetchUser() {
      try {
        const { data } = await http.get('/me', { skipAuthRedirect: true })
        this.user = data.data
      } catch {
        this.user = null
      }
      return this.user
    },

    clear() {
      this.user = null
    },

    async login(credentials) {
      const { data } = await http.post('/auth/login', credentials)
      if (data?.two_factor) return { twoFactor: true }
      await this.fetchUser()
      return { twoFactor: false }
    },

    async twoFactorChallenge(payload) {
      await http.post('/auth/two-factor-challenge', payload)
      await this.fetchUser()
    },

    async register(payload) {
      const { data } = await http.post('/auth/register', payload)
      if (data.status === 'active') await this.fetchUser()
      return data
    },

    async logout() {
      try {
        await http.post('/auth/logout')
      } finally {
        this.user = null
      }
    },

    forgotPassword(email) {
      return http.post('/auth/forgot-password', { email })
    },

    resetPassword(payload) {
      return http.post('/auth/reset-password', payload)
    },

    async verifyEmail({ id, hash, expires, signature }) {
      await http.get(`/auth/email/verify/${id}/${hash}`, { params: { expires, signature } })
      await this.fetchUser()
    },

    resendVerification() {
      return http.post('/auth/email/verification-notification')
    },

    confirmGuardian(token) {
      return http.post('/guardian/confirm', { token })
    },

    async updateProfile(payload) {
      const { data } = await http.put('/me', payload)
      this.user = data.data
      return this.user
    },

    updatePassword(payload) {
      return http.put('/auth/user/password', payload)
    },

    // Two-factor authentication (Fortify)
    enableTwoFactor() {
      return http.post('/auth/user/two-factor-authentication')
    },
    async twoFactorQrCode() {
      const { data } = await http.get('/auth/user/two-factor-qr-code')
      return data
    },
    async twoFactorSecret() {
      const { data } = await http.get('/auth/user/two-factor-secret-key')
      return data.secretKey
    },
    async confirmTwoFactor(code) {
      await http.post('/auth/user/confirmed-two-factor-authentication', { code })
      await this.fetchUser()
    },
    async recoveryCodes() {
      const { data } = await http.get('/auth/user/two-factor-recovery-codes')
      return data
    },
    async regenerateRecoveryCodes() {
      await http.post('/auth/user/two-factor-recovery-codes')
      return this.recoveryCodes()
    },
    async disableTwoFactor() {
      await http.delete('/auth/user/two-factor-authentication')
      await this.fetchUser()
    },

    // Privacy
    async dataExports() {
      const { data } = await http.get('/me/data-exports')
      return data.data
    },
    async requestDataExport() {
      const { data } = await http.post('/me/data-exports')
      return data.data
    },
    async dataExportUrl(id) {
      const { data } = await http.get(`/me/data-exports/${id}/download`)
      return data.url
    },
    async requestDeletion(reason) {
      const { data } = await http.post('/me/deletion-request', { reason })
      this.user = data.data
    },
    async cancelDeletion() {
      const { data } = await http.delete('/me/deletion-request')
      this.user = data.data
    },
  },
})
