import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCoursesStore } from '@/stores/courses'
import http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Courses Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with clean default state', () => {
    const store = useCoursesStore()
    expect(store.catalog).toEqual([])
    expect(store.currentCourse).toBeNull()
    expect(store.currentEnrollment).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('fetches and populates course catalog', async () => {
    const store = useCoursesStore()
    const mockCourses = [
      { id: 1, title: 'Classical Piano Mastery', slug: 'classical-piano-mastery' },
    ]
    http.get.mockResolvedValueOnce({
      data: { data: mockCourses, meta: { total: 1 } },
    })

    const result = await store.fetchCatalog()

    expect(http.get).toHaveBeenCalledWith('/api/v1/courses', { params: {} })
    expect(result).toEqual(mockCourses)
    expect(store.catalog).toEqual(mockCourses)
  })

  it('fetches and sets single course detail', async () => {
    const store = useCoursesStore()
    const mockCourse = {
      id: 1,
      title: 'Classical Piano Mastery',
      slug: 'classical-piano-mastery',
      pricing: {
        bundle_price_kes: 1700000,
        bundle_price_formatted: '17,000.00',
        bundle_price_usd_formatted: '130.77',
      },
      upgrade_pricing: {
        has_owned_modules: true,
        upgrade_price_kes: 1250000,
      },
    }
    http.get.mockResolvedValueOnce({ data: { course: mockCourse } })

    const res = await store.fetchCourse('classical-piano-mastery')

    expect(http.get).toHaveBeenCalledWith('/api/v1/courses/classical-piano-mastery')
    expect(res).toEqual(mockCourse)
    expect(store.currentCourse).toEqual(mockCourse)
  })

  it('records lesson progress and updates local enrollment progress map', async () => {
    const store = useCoursesStore()
    store.currentEnrollment = {
      id: 10,
      progress_percent: 0,
      progress_map: {},
    }

    http.post.mockResolvedValueOnce({
      data: {
        lesson_id: 42,
        lesson_status: 'completed',
        lesson_progress_percent: 100,
        course_progress_percent: 50.0,
        completed_at: '2026-10-20T12:00:00Z',
      },
    })

    const res = await store.recordLessonProgress('lesson-uuid-42', {
      progress_percent: 100,
      mark_complete: true,
    })

    expect(res.lesson_status).toBe('completed')
    expect(store.currentEnrollment.progress_percent).toBe(50.0)
    expect(store.currentEnrollment.progress_map[42]).toEqual({
      status: 'completed',
      progress_percent: 100,
      completed_at: '2026-10-20T12:00:00Z',
    })
  })
})
