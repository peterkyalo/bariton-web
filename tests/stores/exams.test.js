import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExamsStore } from '@/stores/exams'
import http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Exams Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with clean default state', () => {
    const store = useExamsStore()
    expect(store.examInfo).toBeNull()
    expect(store.activeAttempt).toBeNull()
    expect(store.questions).toEqual([])
    expect(store.certificates).toEqual([])
    expect(store.verificationResult).toBeNull()
    expect(store.examGradingQueue).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('fetches course exam details and eligibility', async () => {
    const store = useExamsStore()
    const mockData = {
      exam: { uuid: 'exam-1', title: 'Final Certification Exam' },
      eligibility: { allowed: true, attempts_used: 0, attempt_limit: 3 },
    }

    http.get.mockResolvedValueOnce({
      data: { status: 'success', data: mockData },
    })

    const res = await store.fetchCourseExam('classical-piano-mastery')

    expect(http.get).toHaveBeenCalledWith('/student/courses/classical-piano-mastery/exam')
    expect(store.examInfo).toEqual(mockData)
    expect(res).toEqual(mockData)
  })

  it('starts exam attempt and stores questions', async () => {
    const store = useExamsStore()
    const mockAttempt = { uuid: 'att-1', attempt_number: 1, status: 'in_progress', remaining_seconds: 3600 }
    const mockQuestions = [
      { uuid: 'q-1', question_type: 'multiple_choice', prompt: 'Question 1' },
      { uuid: 'q-2', question_type: 'theory', prompt: 'Question 2' },
    ]

    http.post.mockResolvedValueOnce({
      data: { status: 'success', data: { attempt: mockAttempt, questions: mockQuestions } },
    })

    const res = await store.startExam('exam-1')

    expect(http.post).toHaveBeenCalledWith('/student/exams/exam-1/start')
    expect(store.activeAttempt).toEqual(mockAttempt)
    expect(store.questions).toEqual(mockQuestions)
    expect(res.attempt).toEqual(mockAttempt)
  })

  it('saves answers and updates status', async () => {
    const store = useExamsStore()
    const mockAnswers = [{ question_uuid: 'q-1', selected_option: 'b' }]

    http.post.mockResolvedValueOnce({
      data: { status: 'success', data: { status: 'saved' } },
    })

    const res = await store.saveAnswers('att-1', mockAnswers)

    expect(http.post).toHaveBeenCalledWith('/student/exams/attempts/att-1/answers', { answers: mockAnswers })
    expect(res.status).toBe('saved')
    expect(store.autoSaveStatus).toContain('Saved at')
  })

  it('stops timer for recording upload and sets grace period', async () => {
    const store = useExamsStore()
    const mockAttempt = { uuid: 'att-1', is_grace_period: true, remaining_seconds: 900 }

    http.post.mockResolvedValueOnce({
      data: { status: 'success', data: { attempt: mockAttempt } },
    })

    const res = await store.stopRecording('att-1', { question_uuid: 'q-3', media_path: 'vid.mp4' })

    expect(http.post).toHaveBeenCalledWith('/student/exams/attempts/att-1/record-stop', {
      question_uuid: 'q-3',
      media_path: 'vid.mp4',
    })
    expect(store.activeAttempt.is_grace_period).toBe(true)
    expect(res.attempt).toEqual(mockAttempt)
  })

  it('submits exam attempt', async () => {
    const store = useExamsStore()
    const mockAttempt = { uuid: 'att-1', status: 'grading' }

    http.post.mockResolvedValueOnce({
      data: { status: 'success', data: { attempt: mockAttempt } },
    })

    const res = await store.submitExam('att-1', { answers: [] })

    expect(http.post).toHaveBeenCalledWith('/student/exams/attempts/att-1/submit', { answers: [] })
    expect(store.activeAttempt.status).toBe('grading')
    expect(res.attempt).toEqual(mockAttempt)
  })

  it('verifies certificate credential via public endpoint', async () => {
    const store = useExamsStore()
    const mockResult = {
      certificate_code: 'BMAS-CERT-ABC123',
      holder_name: 'Seraphina Vance',
      course_title: 'Classical Piano Mastery',
      status: 'issued',
    }

    http.get.mockResolvedValueOnce({
      data: { status: 'success', data: mockResult },
    })

    const res = await store.verifyCertificate('BMAS-CERT-ABC123')

    expect(http.get).toHaveBeenCalledWith('/certificates/verify/BMAS-CERT-ABC123')
    expect(store.verificationResult).toEqual(mockResult)
    expect(res).toEqual(mockResult)
  })

  it('grades exam attempt in instructor studio', async () => {
    const store = useExamsStore()
    const mockGraded = {
      attempt: { uuid: 'att-1', status: 'graded', passed: true, score_percent: 92 },
    }

    http.post.mockResolvedValueOnce({
      data: { status: 'success', data: mockGraded },
    })

    const res = await store.gradeExamAttempt('att-1', { evaluations: [], overall_feedback: 'Well done' })

    expect(http.post).toHaveBeenCalledWith('/instructor/exam-grading/att-1/grade', {
      evaluations: [],
      overall_feedback: 'Well done',
    })
    expect(res).toEqual(mockGraded)
  })
})
