import { defineStore } from 'pinia'
import api from '@/lib/http'

export const useCmsStore = defineStore('cms', {
  state: () => ({
    currentPage: null,
    pagesList: [],
    adminPages: [],
    adminPagination: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 20,
    },
    inquiries: [],
    inquiriesPagination: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 20,
    },
    loading: false,
    error: null,
    inquirySubmitting: false,
    inquirySuccess: false,
  }),

  getters: {
    publishedPages: (state) => state.pagesList.filter((p) => p.is_published),
    homeSections: (state) => state.currentPage?.sections || {},
  },

  actions: {
    /**
     * Fetch public single page by slug
     */
    async fetchPage(slug) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/pages/${slug}`)
        this.currentPage = response.data?.data || null
        return this.currentPage
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load page content.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch list of public published pages for menus
     */
    async fetchPages(category = null) {
      try {
        const params = category ? { category } : {}
        const response = await api.get('/pages', { params })
        this.pagesList = response.data?.data || []
        return this.pagesList
      } catch (err) {
        console.error('Error fetching CMS pages list:', err)
        return []
      }
    },

    /**
     * Submit public contact inquiry
     */
    async submitInquiry(payload) {
      this.inquirySubmitting = true
      this.inquirySuccess = false
      this.error = null
      try {
        const response = await api.post('/contact', payload)
        this.inquirySuccess = true
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to submit contact inquiry.'
        throw err
      } finally {
        this.inquirySubmitting = false
      }
    },

    /**
     * Admin: Fetch paginated CMS pages
     */
    async fetchAdminPages(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/admin/cms/pages', { params })
        const paginated = response.data?.data
        this.adminPages = paginated?.data || []
        this.adminPagination = {
          currentPage: paginated?.current_page || 1,
          lastPage: paginated?.last_page || 1,
          total: paginated?.total || 0,
          perPage: paginated?.per_page || 20,
        }
        return this.adminPages
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load CMS pages.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Admin: Fetch single CMS page for editing
     */
    async fetchAdminPage(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/admin/cms/pages/${id}`)
        return response.data?.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load page details.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Admin: Create new CMS page
     */
    async createPage(payload) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/admin/cms/pages', payload)
        return response.data?.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create page.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Admin: Update existing CMS page
     */
    async updatePage(id, payload) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/admin/cms/pages/${id}`, payload)
        return response.data?.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update page.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Admin: Delete CMS page
     */
    async deletePage(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/admin/cms/pages/${id}`)
        this.adminPages = this.adminPages.filter((p) => p.id !== id && p.slug !== id)
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete page.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Admin: Fetch contact inquiries
     */
    async fetchInquiries(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/admin/cms/contact-inquiries', { params })
        const paginated = response.data?.data
        this.inquiries = paginated?.data || []
        this.inquiriesPagination = {
          currentPage: paginated?.current_page || 1,
          lastPage: paginated?.last_page || 1,
          total: paginated?.total || 0,
          perPage: paginated?.per_page || 20,
        }
        return this.inquiries
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load inquiries.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Admin: Update inquiry status and admin notes
     */
    async updateInquiry(id, payload) {
      try {
        const response = await api.put(`/admin/cms/contact-inquiries/${id}`, payload)
        const updated = response.data?.data
        const index = this.inquiries.findIndex((i) => i.id === id || i.uuid === id)
        if (index !== -1 && updated) {
          this.inquiries[index] = updated
        }
        return updated
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update inquiry.'
        throw err
      }
    },
  },
})
