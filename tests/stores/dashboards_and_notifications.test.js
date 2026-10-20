import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import { useNotificationTemplateStore } from '@/stores/notificationTemplates'
import http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Phase 8 Dashboards & Notification Templates Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches admin executive dashboard metrics with gateway breakdown', async () => {
    const store = useDashboardStore()
    const mockAdminData = {
      period: { from: '2026-01-01', to: '2026-12-31' },
      revenue: {
        total_kes: 45000000,
        total_usd: 3461.54,
        by_method: {
          mpesa: { total_kes: 30000000, count: 120 },
          stripe: { total_kes: 15000000, count: 45 },
        },
        by_item_type: {
          course: { total_kes: 35000000, count: 100 },
          event_seat: { total_kes: 10000000, count: 65 },
        },
      },
      enrollments: { total: 100, standard: 80, assessment_only: 20 },
      exams: { total_graded: 75, passed: 70, failed: 5, pass_rate_percentage: 93.3 },
      events: { total_events: 3, total_capacity: 75, occupied_seats: 65, occupancy_percentage: 86.7 },
      tutoring: { credits_sold: 45, sessions_booked: 40, attended: 35, missed: 5 },
    }

    http.get.mockResolvedValueOnce({ data: mockAdminData })

    const res = await store.fetchAdminMetrics({ from: '2026-01-01', to: '2026-12-31' })
    expect(res.revenue.total_kes).toBe(45000000)
    expect(store.adminMetrics.exams.pass_rate_percentage).toBe(93.3)
    expect(store.adminMetrics.events.occupancy_percentage).toBe(86.7)
    expect(http.get).toHaveBeenCalledWith('/api/v1/dashboards/admin', {
      params: { from: '2026-01-01', to: '2026-12-31' },
    })
  })

  it('fetches finance directorate ledger metrics', async () => {
    const store = useDashboardStore()
    const mockFinanceData = {
      summary: {
        total_revenue_kes: 52000000,
        cash_entries_count: 14,
        cash_total_kes: 7000000,
        pending_refunds_count: 2,
        credit_notes_count: 5,
      },
      daily_totals: [{ date: '2026-10-20', total_kes: 1500000, transaction_count: 8 }],
      recent_payments: [],
    }

    http.get.mockResolvedValueOnce({ data: mockFinanceData })

    const res = await store.fetchFinanceMetrics()
    expect(res.summary.total_revenue_kes).toBe(52000000)
    expect(store.financeMetrics.summary.cash_entries_count).toBe(14)
  })

  it('fetches instructor studio queues and coordinator event metrics', async () => {
    const store = useDashboardStore()
    http.get.mockResolvedValueOnce({
      data: {
        pending_assignments_count: 4,
        pending_exams_count: 2,
        upcoming_sessions_count: 3,
        courses: [],
        upcoming_sessions: [],
      },
    })

    const instructorRes = await store.fetchInstructorMetrics()
    expect(instructorRes.pending_assignments_count).toBe(4)

    http.get.mockResolvedValueOnce({
      data: {
        events_count: 3,
        total_attendees_checked_in: 25,
        total_active_bookings: 60,
        events: [],
      },
    })

    const coordRes = await store.fetchCoordinatorMetrics()
    expect(coordRes.total_active_bookings).toBe(60)
  })

  it('manages notification templates and dispatches live test messages', async () => {
    const store = useNotificationTemplateStore()
    const mockTemplates = [
      { id: 1, key: 'registration', name: 'Welcome', channel: 'both', is_active: true },
      { id: 2, key: 'payment_received', name: 'Payment Confirmed', channel: 'both', is_active: true },
    ]

    http.get.mockResolvedValueOnce({ data: { data: mockTemplates } })

    const res = await store.fetchTemplates()
    expect(res).toHaveLength(2)
    expect(store.templates[0].key).toBe('registration')

    // Update
    http.put.mockResolvedValueOnce({ data: { message: 'Updated' } })
    http.get.mockResolvedValueOnce({ data: { data: mockTemplates } })

    await store.updateTemplate('registration', {
      email_subject: 'Karibu Bariton Academy!',
    })
    expect(http.put).toHaveBeenCalledWith('/api/v1/admin/notification-templates/registration', {
      email_subject: 'Karibu Bariton Academy!',
    })

    // Test Send
    http.post.mockResolvedValueOnce({
      data: {
        message: 'Test notification processed.',
        result: { status: 'dispatched', channels: { email: 'sent', sms: 'sent' } },
      },
    })

    const testRes = await store.testSend('payment_received')
    expect(testRes.result.status).toBe('dispatched')
  })

  it('fetches and updates student notification preferences', async () => {
    const store = useNotificationTemplateStore()
    http.get.mockResolvedValueOnce({
      data: {
        preferences: {
          event_reminders: true,
          session_reminders: true,
          assignment_graded: true,
          marketing: false,
          payment_received: true,
        },
      },
    })

    const res = await store.fetchPreferences()
    expect(res.preferences.event_reminders).toBe(true)

    http.put.mockResolvedValueOnce({
      data: {
        preferences: {
          event_reminders: false,
          session_reminders: true,
          assignment_graded: true,
          marketing: false,
          payment_received: true,
        },
      },
    })

    const updated = await store.updatePreferences({ event_reminders: false })
    expect(updated.preferences.event_reminders).toBe(false)
  })
})
