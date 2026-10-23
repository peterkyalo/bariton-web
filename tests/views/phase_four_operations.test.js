import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useExamsStore } from '@/stores/exams'
import { useAssignmentsStore } from '@/stores/assignments'
import CertificateVerificationView from '@/views/public/CertificateVerificationView.vue'
import StudentCertificatesView from '@/views/student/StudentCertificatesView.vue'
import InstructorGradingQueueView from '@/views/instructor/InstructorGradingQueueView.vue'
import StudentAssignmentView from '@/views/student/StudentAssignmentView.vue'

// Stubs for Vue Router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { code: 'BMAS-CERT-ABC12345', uuid: 'asgn-uuid-1', slug: 'cello-mastery' },
    query: {},
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

describe('Phase 4: Academic Assessment, Exams & Verifiable Credentials Views', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('CertificateVerificationView (/verify/:code)', () => {
    it('verifies and displays official certificate details with zero sensitive data', async () => {
      const examsStore = useExamsStore()
      const mockResult = {
        certificate_code: 'BMAS-CERT-ABC12345',
        holder_name: 'Wanjiku Kamau',
        course_title: 'Concert Cello Virtuoso Mastery',
        path_type: 'standard',
        status: 'issued',
        issued_at: '2026-10-20T12:00:00Z',
      }

      const verifySpy = vi.spyOn(examsStore, 'verifyCertificate').mockImplementation(async () => {
        examsStore.verificationResult = mockResult
        return mockResult
      })

      const wrapper = mount(CertificateVerificationView, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      })

      expect(verifySpy).toHaveBeenCalledWith('BMAS-CERT-ABC12345')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Official Credential Verification')
      expect(wrapper.text()).toContain('Wanjiku Kamau')
      expect(wrapper.text()).toContain('Concert Cello Virtuoso Mastery')
      expect(wrapper.text()).toContain('BMAS-CERT-ABC12345')
      expect(wrapper.text()).toContain('Credential Verified')
    })

    it('displays revoked warning alert when credential has been revoked', async () => {
      const examsStore = useExamsStore()
      const mockRevoked = {
        certificate_code: 'BMAS-CERT-REVOKED99',
        holder_name: 'John Doe',
        course_title: 'Jazz Piano Fundamentals',
        path_type: 'standard',
        status: 'revoked',
        issued_at: '2026-09-01T08:00:00Z',
      }

      vi.spyOn(examsStore, 'verifyCertificate').mockImplementation(async () => {
        examsStore.verificationResult = mockRevoked
        return mockRevoked
      })

      const wrapper = mount(CertificateVerificationView, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Certificate Revoked')
      expect(wrapper.text()).toContain('John Doe')
    })

    it('displays validation path badge when student passed assessment-only track', async () => {
      const examsStore = useExamsStore()
      const mockValidation = {
        certificate_code: 'BMAS-CERT-VAL777',
        holder_name: 'Sarah Musician',
        course_title: 'Advanced Violin Repertoire',
        path_type: 'validation',
        status: 'issued',
        issued_at: '2026-10-21T09:00:00Z',
      }

      vi.spyOn(examsStore, 'verifyCertificate').mockImplementation(async () => {
        examsStore.verificationResult = mockValidation
        return mockValidation
      })

      const wrapper = mount(CertificateVerificationView, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Skills Validation')
      expect(wrapper.text()).toContain('Assessment Only')
    })
  })

  describe('StudentCertificatesView (/student/certificates)', () => {
    it('renders issued student certificates and triggers PDF download', async () => {
      const examsStore = useExamsStore()
      const mockCerts = [
        {
          id: 1,
          uuid: 'cert-uuid-1',
          certificate_code: 'BMAS-CERT-0001',
          holder_name: 'Wanjiku Kamau',
          course_title: 'Classical Vocal Mastery',
          path_type: 'standard',
          status: 'issued',
          issued_at: '2026-10-22T10:00:00Z',
        },
      ]

      const fetchSpy = vi.spyOn(examsStore, 'fetchStudentCertificates').mockImplementation(async () => {
        examsStore.certificates = mockCerts
        return mockCerts
      })
      const downloadSpy = vi.spyOn(examsStore, 'downloadCertificate').mockResolvedValue()

      const wrapper = mount(StudentCertificatesView, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      })

      expect(fetchSpy).toHaveBeenCalled()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('My Official Certificates')
      expect(wrapper.text()).toContain('Classical Vocal Mastery')
      expect(wrapper.text()).toContain('BMAS-CERT-0001')

      // Trigger download
      const downloadBtn = wrapper.find('button')
      expect(downloadBtn.exists()).toBe(true)
      await downloadBtn.trigger('click')

      expect(downloadSpy).toHaveBeenCalledWith('cert-uuid-1')
    })
  })

  describe('InstructorGradingQueueView (/instructor/grading)', () => {
    it('renders submission queue with rubric status and student details', async () => {
      const assignmentsStore = useAssignmentsStore()
      const mockQueue = [
        {
          id: 50,
          uuid: 'sub-50',
          student: { name: 'Alice Violinist', email: 'alice@bmas.test' },
          assignment: {
            title: 'Paganini Caprice No. 24 Excerpt',
            module: {
              title: 'Virtuoso Bowing & Fingerwork',
              course: { title: 'Conservatory Violin Mastery' },
            },
          },
          attempt_number: 1,
          status: 'submitted',
          created_at: '2026-10-22T14:30:00Z',
        },
      ]

      const fetchSpy = vi.spyOn(assignmentsStore, 'fetchGradingQueue').mockImplementation(async () => {
        assignmentsStore.gradingQueue = mockQueue
        return mockQueue
      })

      const wrapper = mount(InstructorGradingQueueView, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      })

      expect(fetchSpy).toHaveBeenCalledWith({ status: undefined })
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Instructor Grading Queue')
      expect(wrapper.text()).toContain('Alice Violinist')
      expect(wrapper.text()).toContain('Paganini Caprice No. 24 Excerpt')
      expect(wrapper.text()).toContain('Attempt #1')
    })
  })

  describe('StudentAssignmentView (/student/assignments/:uuid)', () => {
    it('renders assignment instructions, rubric criteria and submissions list', async () => {
      const assignmentsStore = useAssignmentsStore()
      const mockAssignment = {
        id: 1,
        uuid: 'asgn-uuid-1',
        title: 'Bach Cello Prelude Performance',
        instructions: 'Record an uninterrupted video performance of the complete Prelude.',
        submission_type: 'video',
        allowed_formats: ['video/mp4', 'video/webm'],
        max_file_size_bytes: 209715200,
        rubric: {
          title: 'Conservatory Performance Rubric',
          criteria: [
            { id: 1, title: 'Intonation & Pitch Accuracy', max_points: 30 },
            { id: 2, title: 'Rhythm & Tempo Stability', max_points: 30 },
            { id: 3, title: 'Tone Quality & Dynamics', max_points: 40 },
          ],
        },
      }

      const mockSubmissions = [
        {
          id: 1,
          attempt_number: 1,
          status: 'graded',
          score_percent: 85,
          passed: true,
          feedback: 'Superb phrasing and clean string crossings!',
          created_at: '2026-10-21T16:00:00Z',
        },
      ]

      vi.spyOn(assignmentsStore, 'fetchAssignment').mockImplementation(async () => {
        assignmentsStore.currentAssignment = mockAssignment
        assignmentsStore.submissions = mockSubmissions
        return { assignment: mockAssignment, submissions: mockSubmissions }
      })

      const wrapper = mount(StudentAssignmentView, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
            ChunkedUploader: { template: '<div>ChunkedUploader</div>' },
          },
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Bach Cello Prelude Performance')
      expect(wrapper.text()).toContain('Record an uninterrupted video performance')
      expect(wrapper.text()).toContain('Intonation & Pitch Accuracy')
      expect(wrapper.text()).toContain('Superb phrasing and clean string crossings!')
      expect(wrapper.text()).toContain('85%')
    })
  })
})
