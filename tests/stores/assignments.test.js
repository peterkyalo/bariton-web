import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAssignmentsStore } from '@/stores/assignments'
import http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Assignments Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with clean default state', () => {
    const store = useAssignmentsStore()
    expect(store.currentAssignment).toBeNull()
    expect(store.moduleAssignments).toEqual([])
    expect(store.submissions).toEqual([])
    expect(store.gradingQueue).toEqual([])
    expect(store.rubrics).toEqual([])
    expect(store.uploadProgress).toBe(0)
    expect(store.loading).toBe(false)
  })

  it('fetches module assignments', async () => {
    const store = useAssignmentsStore()
    const mockAssignments = [
      { id: 1, uuid: 'asgn-1', title: 'Prelude Performance' },
      { id: 2, uuid: 'asgn-2', title: 'Arpeggios Video' },
    ]

    http.get.mockResolvedValueOnce({
      data: { assignments: mockAssignments },
    })

    const res = await store.fetchModuleAssignments('mod-123')

    expect(http.get).toHaveBeenCalledWith('/student/modules/mod-123/assignments')
    expect(store.moduleAssignments).toEqual(mockAssignments)
    expect(res.assignments).toEqual(mockAssignments)
  })

  it('fetches assignment detail and submission attempts', async () => {
    const store = useAssignmentsStore()
    const mockAssignment = { id: 1, uuid: 'asgn-1', title: 'Prelude Performance' }
    const mockSubmissions = [
      { id: 10, attempt_number: 1, status: 'submitted' },
    ]

    http.get.mockResolvedValueOnce({
      data: { assignment: mockAssignment, submissions: mockSubmissions },
    })

    const res = await store.fetchAssignment('asgn-1')

    expect(http.get).toHaveBeenCalledWith('/student/assignments/asgn-1')
    expect(store.currentAssignment).toEqual(mockAssignment)
    expect(store.submissions).toEqual(mockSubmissions)
    expect(res.assignment).toEqual(mockAssignment)
  })

  it('orchestrates chunked upload and assembles file', async () => {
    const store = useAssignmentsStore()

    // Mock initiate
    http.post.mockResolvedValueOnce({
      data: {
        upload: {
          uuid: 'upl-uuid-1',
          total_chunks: 2,
          chunks_completed: [],
        },
      },
    })

    // Mock chunk 0
    http.post.mockResolvedValueOnce({
      data: {
        upload: {
          uuid: 'upl-uuid-1',
          total_chunks: 2,
          chunks_completed: [0],
        },
      },
    })

    // Mock chunk 1
    http.post.mockResolvedValueOnce({
      data: {
        upload: {
          uuid: 'upl-uuid-1',
          total_chunks: 2,
          chunks_completed: [0, 1],
        },
      },
    })

    // Mock complete
    http.post.mockResolvedValueOnce({
      data: {
        file_path: 'submissions/1/video.mp4',
      },
    })

    const fakeBlob = new Blob(['sample-video-binary-content-for-testing-chunks'], { type: 'video/mp4' })
    const fakeFile = new File([fakeBlob], 'performance.mp4', { type: 'video/mp4' })

    const progressTracker = []
    const result = await store.uploadFileInChunks(fakeFile, (percent) => {
      progressTracker.push(percent)
    })

    expect(http.post).toHaveBeenCalledWith('/uploads/chunked/initiate', expect.any(Object))
    expect(http.post).toHaveBeenCalledWith('/uploads/chunked/upl-uuid-1/complete')
    expect(result.chunked_upload_uuid).toBe('upl-uuid-1')
    expect(result.file_path).toBe('submissions/1/video.mp4')
    expect(store.uploadProgress).toBe(100)
  })

  it('submits assignment with chunked upload token', async () => {
    const store = useAssignmentsStore()

    http.post.mockResolvedValueOnce({
      data: { message: 'Assignment submitted successfully.' },
    })
    http.get.mockResolvedValueOnce({
      data: { assignment: { uuid: 'asgn-1' }, submissions: [] },
    })

    await store.submitAssignment('asgn-1', {
      chunked_upload_uuid: 'upl-uuid-1',
      notes: 'Recorded with Steinway grand',
    })

    expect(http.post).toHaveBeenCalledWith('/student/assignments/asgn-1/submit', {
      chunked_upload_uuid: 'upl-uuid-1',
      notes: 'Recorded with Steinway grand',
    })
  })

  it('fetches instructor grading queue and grades submission', async () => {
    const store = useAssignmentsStore()
    const mockQueue = [
      { id: 1, uuid: 'sub-1', status: 'submitted' },
    ]

    http.get.mockResolvedValueOnce({
      data: { data: mockQueue },
    })

    await store.fetchGradingQueue({ status: 'submitted' })
    expect(http.get).toHaveBeenCalledWith('/instructor/grading', { params: { status: 'submitted' } })
    expect(store.gradingQueue).toEqual(mockQueue)

    // Grade submission
    const mockGraded = { id: 1, uuid: 'sub-1', status: 'graded', passed: true, score_percent: 90 }
    http.post.mockResolvedValueOnce({
      data: {
        message: 'Submission graded successfully: Passed.',
        submission: mockGraded,
      },
    })

    const gradeRes = await store.submitGrade('sub-1', {
      rubric_scores: [{ criterion_id: 1, level_id: 2 }],
      feedback: 'Excellent phrasing!',
    })

    expect(http.post).toHaveBeenCalledWith('/instructor/grading/sub-1/grade', {
      rubric_scores: [{ criterion_id: 1, level_id: 2 }],
      feedback: 'Excellent phrasing!',
    })
    expect(gradeRes.submission).toEqual(mockGraded)
  })
})
