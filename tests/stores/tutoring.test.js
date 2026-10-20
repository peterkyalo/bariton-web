import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTutoringStore } from '@/stores/tutoring'
import http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Phase 7 One-on-One Tutoring Store Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches public tutoring packages with pricing and session counts', async () => {
    const store = useTutoringStore()
    const mockPackages = [
      {
        id: 1,
        title: 'Single Private Coaching Session',
        slug: 'single-private-coaching-session',
        session_count: 1,
        price_kes: 500000,
        validity_days: 30,
        is_active: true,
      },
      {
        id: 2,
        title: '5-Session Technique Accelerator',
        slug: '5-session-technique-accelerator',
        session_count: 5,
        price_kes: 2250000,
        validity_days: 90,
        is_active: true,
      },
    ]

    http.get.mockResolvedValueOnce({ data: { data: mockPackages } })

    const res = await store.fetchPackages()
    expect(res).toHaveLength(2)
    expect(store.packages).toHaveLength(2)
    expect(store.packages[0].title).toBe('Single Private Coaching Session')
    expect(store.packages[1].session_count).toBe(5)
  })

  it('fetches student purchased packages and available credits count', async () => {
    const store = useTutoringStore()
    const mockStudentPackages = [
      {
        id: 5,
        user_id: 12,
        total_credits: 5,
        used_credits: 2,
        remaining_credits: 3,
        status: 'active',
        expires_at: '2026-12-31T23:59:59.000Z',
      },
    ]

    http.get.mockResolvedValueOnce({ data: { data: mockStudentPackages } })

    const res = await store.fetchStudentPackages()
    expect(res).toHaveLength(1)
    expect(store.studentPackages[0].remaining_credits).toBe(3)
    expect(store.studentPackages[0].status).toBe('active')
  })

  it('fetches open available slots for an instructor', async () => {
    const store = useTutoringStore()
    const mockSlots = [
      {
        start: '2026-11-01T10:00:00+03:00',
        end: '2026-11-01T11:00:00+03:00',
        duration_minutes: 60,
      },
      {
        start: '2026-11-01T11:15:00+03:00',
        end: '2026-11-01T12:15:00+03:00',
        duration_minutes: 60,
      },
    ]

    http.get.mockResolvedValueOnce({ data: { slots: mockSlots } })

    const res = await store.fetchAvailableSlots(4, { date: '2026-11-01' })
    expect(res).toHaveLength(2)
    expect(store.availableSlots).toHaveLength(2)
    expect(store.availableSlots[0].start).toBe('2026-11-01T10:00:00+03:00')
    expect(http.get).toHaveBeenCalledWith('/api/v1/tutoring/instructors/4/slots', {
      params: { date: '2026-11-01' },
    })
  })

  it('books a tutoring session and decrements remaining credits', async () => {
    const store = useTutoringStore()
    const bookingPayload = {
      student_tutoring_package_id: 5,
      instructor_id: 4,
      scheduled_start: '2026-11-01T10:00:00+03:00',
      scheduled_end: '2026-11-01T11:00:00+03:00',
      mode: 'zoom',
    }

    const mockResponse = {
      message: 'Tutoring session booked successfully.',
      session: {
        id: 101,
        uuid: 'session-uuid-101',
        status: 'scheduled',
        mode: 'zoom',
      },
      remaining_credits: 2,
    }

    http.post.mockResolvedValueOnce({ data: mockResponse })

    const res = await store.bookSession(bookingPayload)
    expect(res.session.status).toBe('scheduled')
    expect(res.remaining_credits).toBe(2)
    expect(http.post).toHaveBeenCalledWith('/api/v1/student/tutoring/book', bookingPayload)
  })

  it('reschedules a session with emergency notice waiver', async () => {
    const store = useTutoringStore()
    const reschedulePayload = {
      scheduled_start: '2026-11-02T14:00:00+03:00',
      scheduled_end: '2026-11-02T15:00:00+03:00',
      waive_notice: true,
      waiver_reason: 'Sudden high fever and laryngitis',
    }

    const mockResponse = {
      message: 'Session rescheduled successfully.',
      session: {
        uuid: 'session-uuid-101',
        status: 'rescheduled',
        notice_waived: true,
        waiver_reason: 'Sudden high fever and laryngitis',
      },
    }

    http.post.mockResolvedValueOnce({ data: mockResponse })

    const res = await store.rescheduleSession('session-uuid-101', reschedulePayload)
    expect(res.session.status).toBe('rescheduled')
    expect(res.session.notice_waived).toBe(true)
    expect(http.post).toHaveBeenCalledWith(
      '/api/v1/student/tutoring/sessions/session-uuid-101/reschedule',
      reschedulePayload
    )
  })

  it('saves instructor weekly availability shifts', async () => {
    const store = useTutoringStore()
    const shifts = [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00', is_active: true },
      { day_of_week: 2, start_time: '09:00', end_time: '17:00', is_active: true },
    ]

    http.put.mockResolvedValueOnce({
      data: {
        message: 'Weekly availability saved successfully.',
        availabilities: shifts,
      },
    })

    const res = await store.setInstructorAvailability(shifts)
    expect(res.availabilities).toHaveLength(2)
    expect(store.instructorAvailabilities).toHaveLength(2)
    expect(http.put).toHaveBeenCalledWith('/api/v1/instructor/tutoring/availability', { shifts })
  })

  it('adds and removes instructor blackout dates', async () => {
    const store = useTutoringStore()
    const blackoutData = {
      start_date: '2026-11-15',
      end_date: '2026-11-20',
      reason: 'Touring in Mombasa',
    }

    http.post.mockResolvedValueOnce({
      data: {
        message: 'Blocked date range added successfully.',
        blocked_date: { id: 7, ...blackoutData },
      },
    })
    http.get.mockResolvedValueOnce({
      data: {
        blocked_dates: [{ id: 7, ...blackoutData }],
      },
    })

    await store.addInstructorBlockedDate(blackoutData)
    expect(store.instructorBlockedDates).toHaveLength(1)

    // Delete
    http.delete.mockResolvedValueOnce({ data: { message: 'Blocked date range removed.' } })
    http.get.mockResolvedValueOnce({ data: { blocked_dates: [] } })

    await store.deleteInstructorBlockedDate(7)
    expect(store.instructorBlockedDates).toHaveLength(0)
  })

  it('marks student attendance with instructor feedback notes', async () => {
    const store = useTutoringStore()
    http.post.mockResolvedValueOnce({
      data: {
        message: 'Attendance recorded.',
        session: { uuid: 'session-uuid-101', status: 'attended' },
      },
    })
    http.get.mockResolvedValueOnce({ data: { data: [] } })

    const res = await store.markSessionAttendance('session-uuid-101', {
      status: 'attended',
      notes: 'Excellent breath control today. Continued work on arpeggio velocity.',
    })

    expect(res.session.status).toBe('attended')
    expect(http.post).toHaveBeenCalledWith(
      '/api/v1/instructor/tutoring/sessions/session-uuid-101/attendance',
      {
        status: 'attended',
        notes: 'Excellent breath control today. Continued work on arpeggio velocity.',
      }
    )
  })

  it('cancels session by instructor and restores credit to student package', async () => {
    const store = useTutoringStore()
    http.post.mockResolvedValueOnce({
      data: {
        message: 'Session cancelled and student credit restored.',
        session: { uuid: 'session-uuid-101', status: 'cancelled_by_instructor' },
      },
    })
    http.get.mockResolvedValueOnce({ data: { data: [] } })

    const res = await store.cancelSessionByInstructor(
      'session-uuid-101',
      'Studio soundproofing maintenance emergency'
    )

    expect(res.session.status).toBe('cancelled_by_instructor')
    expect(http.post).toHaveBeenCalledWith(
      '/api/v1/instructor/tutoring/sessions/session-uuid-101/cancel',
      { reason: 'Studio soundproofing maintenance emergency' }
    )
  })
})
