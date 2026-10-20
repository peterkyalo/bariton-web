import { defineStore } from 'pinia'
import http from '@/lib/http'

export const useAssignmentsStore = defineStore('assignments', {
  state: () => ({
    currentAssignment: null,
    moduleAssignments: [],
    submissions: [],
    gradingQueue: [],
    currentSubmissionToGrade: null,
    rubrics: [],
    loading: false,
    error: null,
    uploadProgress: 0,
    uploadStatusText: '',
  }),

  actions: {
    async fetchModuleAssignments(moduleUuid) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get(`/student/modules/${moduleUuid}/assignments`)
        this.moduleAssignments = res.data.assignments || []
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load module assignments.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchAssignment(assignmentUuid) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get(`/student/assignments/${assignmentUuid}`)
        this.currentAssignment = res.data.assignment
        this.submissions = res.data.submissions || []
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load assignment details.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async submitAssignment(assignmentUuid, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post(`/student/assignments/${assignmentUuid}/submit`, payload)
        await this.fetchAssignment(assignmentUuid)
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to submit assignment.'
        throw err
      } finally {
        this.loading = false
      }
    },

    // Resumable Chunked Upload Methods
    async initiateChunkedUpload({ filename, fileSizeBytes, chunkSizeBytes = 5 * 1024 * 1024, mimeType }) {
      const res = await http.post('/uploads/chunked/initiate', {
        filename,
        file_size_bytes: fileSizeBytes,
        chunk_size_bytes: chunkSizeBytes,
        mime_type: mimeType,
      })
      return res.data.upload
    },

    async uploadChunk(uploadUuid, chunkIndex, chunkBlob) {
      const formData = new FormData()
      formData.append('chunk_index', chunkIndex)
      formData.append('chunk', chunkBlob)

      const res = await http.post(`/uploads/chunked/${uploadUuid}/chunk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.upload
    },

    async getChunkedUploadStatus(uploadUuid) {
      const res = await http.get(`/uploads/chunked/${uploadUuid}/status`)
      return res.data.upload
    },

    async completeChunkedUpload(uploadUuid) {
      const res = await http.post(`/uploads/chunked/${uploadUuid}/complete`)
      return res.data
    },

    /**
     * Resumable upload orchestrator that slices a file into chunks,
     * checks for missing chunks, and resumes after disconnections.
     */
    async uploadFileInChunks(file, onProgress = null) {
      const chunkSize = 2 * 1024 * 1024 // 2MB chunk for responsive progress
      const totalSize = file.size

      this.uploadProgress = 0
      this.uploadStatusText = 'Initializing upload session...'

      const uploadInfo = await this.initiateChunkedUpload({
        filename: file.name,
        fileSizeBytes: totalSize,
        chunkSizeBytes: chunkSize,
        mimeType: file.type || 'video/mp4',
      })

      const uploadUuid = uploadInfo.uuid
      const totalChunks = uploadInfo.total_chunks
      let completedChunks = new Set(uploadInfo.chunks_completed || [])

      for (let index = 0; index < totalChunks; index++) {
        if (completedChunks.has(index)) {
          continue // Skip already uploaded chunk (resumption)
        }

        const start = index * chunkSize
        const end = Math.min(start + chunkSize, totalSize)
        const chunkBlob = file.slice(start, end)

        this.uploadStatusText = `Uploading chunk ${index + 1} of ${totalChunks}...`

        // Upload chunk with auto-retry
        let attempts = 0
        let success = false
        while (!success && attempts < 3) {
          try {
            attempts++
            await this.uploadChunk(uploadUuid, index, chunkBlob)
            success = true
            completedChunks.add(index)
          } catch (err) {
            if (attempts >= 3) throw err
            await new Promise((r) => setTimeout(r, 1000 * attempts))
          }
        }

        const percent = Math.round((completedChunks.size / totalChunks) * 100)
        this.uploadProgress = percent
        if (onProgress) onProgress(percent)
      }

      this.uploadStatusText = 'Assembling and verifying file on server...'
      const finalizeRes = await this.completeChunkedUpload(uploadUuid)
      this.uploadProgress = 100
      this.uploadStatusText = 'Upload completed successfully!'

      return {
        chunked_upload_uuid: uploadUuid,
        file_path: finalizeRes.file_path,
        original_filename: file.name,
      }
    },

    // Instructor Grading Operations
    async fetchGradingQueue(params = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get('/instructor/grading', { params })
        this.gradingQueue = res.data.data || []
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load grading queue.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchSubmissionForGrading(submissionUuid) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get(`/instructor/grading/${submissionUuid}`)
        this.currentSubmissionToGrade = res.data
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load submission for grading.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async submitGrade(submissionUuid, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post(`/instructor/grading/${submissionUuid}/grade`, payload)
        if (this.currentSubmissionToGrade) {
          this.currentSubmissionToGrade.submission = res.data.submission
        }
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to submit grade.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchRubrics() {
      this.loading = true
      try {
        const res = await http.get('/instructor/rubrics')
        this.rubrics = res.data.data || []
        return this.rubrics
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load rubrics.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
