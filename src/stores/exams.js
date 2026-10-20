import { defineStore } from 'pinia'
import http from '@/lib/http'

export const useExamsStore = defineStore('exams', {
  state: () => ({
    examInfo: null,
    activeAttempt: null,
    questions: [],
    certificates: [],
    verificationResult: null,
    examGradingQueue: [],
    currentAttemptToGrade: null,
    adminCertificates: [],
    loading: false,
    autoSaving: false,
    autoSaveStatus: '',
    error: null,
  }),

  actions: {
    async fetchCourseExam(courseSlugOrUuid) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get(`/student/courses/${courseSlugOrUuid}/exam`)
        this.examInfo = res.data.data
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load exam information.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async startExam(examUuid) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post(`/student/exams/${examUuid}/start`)
        this.activeAttempt = res.data.data.attempt
        this.questions = res.data.data.questions || []
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || err.response?.data?.errors?.exam?.[0] || 'Failed to start exam attempt.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchAttempt(attemptUuid) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get(`/student/exams/attempts/${attemptUuid}`)
        this.activeAttempt = res.data.data.attempt
        this.questions = res.data.data.questions || []
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load examination attempt.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async saveAnswers(attemptUuid, answers) {
      this.autoSaving = true
      try {
        const res = await http.post(`/student/exams/attempts/${attemptUuid}/answers`, { answers })
        if (res.data.data.status === 'expired_and_submitted') {
          this.activeAttempt = res.data.data.attempt
          this.autoSaveStatus = 'Time expired - exam auto-submitted.'
        } else {
          this.autoSaveStatus = `Saved at ${new Date().toLocaleTimeString()}`
        }
        return res.data.data
      } catch (err) {
        this.autoSaveStatus = 'Failed to auto-save.'
        throw err
      } finally {
        this.autoSaving = false
      }
    },

    async stopRecording(attemptUuid, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post(`/student/exams/attempts/${attemptUuid}/record-stop`, payload)
        this.activeAttempt = res.data.data.attempt
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to stop timer for recording upload.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async submitExam(attemptUuid, payload = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post(`/student/exams/attempts/${attemptUuid}/submit`, payload)
        this.activeAttempt = res.data.data.attempt
        this.questions = res.data.data.questions || []
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to submit examination.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchStudentCertificates() {
      this.loading = true
      this.error = null
      try {
        const res = await http.get('/student/certificates')
        this.certificates = res.data.data || []
        return this.certificates
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch certificates.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async downloadCertificate(certificateUuid) {
      try {
        const res = await http.get(`/student/certificates/${certificateUuid}/download`, {
          responseType: 'blob',
        })
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Certificate-${certificateUuid.substring(0, 8)}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        this.error = 'Failed to download certificate PDF.'
        throw err
      }
    },

    async verifyCertificate(code) {
      this.loading = true
      this.error = null
      this.verificationResult = null
      try {
        const res = await http.get(`/certificates/verify/${encodeURIComponent(code)}`)
        this.verificationResult = res.data.data
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Certificate verification failed or invalid credential.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchExamGradingQueue() {
      this.loading = true
      this.error = null
      try {
        const res = await http.get('/instructor/exam-grading')
        this.examGradingQueue = res.data.data.data || res.data.data || []
        return this.examGradingQueue
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load exam grading queue.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchExamGradingDetail(attemptUuid) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get(`/instructor/exam-grading/${attemptUuid}`)
        this.currentAttemptToGrade = res.data.data
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load examination grading detail.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async gradeExamAttempt(attemptUuid, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post(`/instructor/exam-grading/${attemptUuid}/grade`, payload)
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to submit examination grades.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async adminFetchCertificates(params = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get('/admin/certificates', { params })
        this.adminCertificates = res.data.data.data || res.data.data || []
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load certificates registry.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async adminRevokeCertificate(uuid, reason) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post(`/admin/certificates/${uuid}/revoke`, { reason })
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to revoke certificate.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async adminReissueCertificate(uuid, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post(`/admin/certificates/${uuid}/reissue`, payload)
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to reissue certificate.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
