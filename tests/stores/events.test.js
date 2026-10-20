import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventsStore } from '@/stores/events'
import http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Phase 6 Bootcamps and Workshops Store Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches upcoming physical events schedule', async () => {
    const store = useEventsStore()
    const mockEvents = [
      {
        id: 1,
        slug: 'nairobi-jazz-masterclass',
        title: 'Nairobi Jazz Masterclass',
        capacity: 25,
        occupied_seats_count: 10,
        available_seats_count: 15,
        training_fee_kes: 3500000,
        has_accommodation: true,
        accommodation_fee_kes: 1500000,
        is_full: false,
      },
    ]

    http.get.mockResolvedValueOnce({ data: { data: mockEvents } })

    const res = await store.fetchEvents()
    expect(res).toHaveLength(1)
    expect(store.events).toHaveLength(1)
    expect(store.events[0].title).toBe('Nairobi Jazz Masterclass')
    expect(store.events[0].available_seats_count).toBe(15)
  })

  it('places an online seat hold and returns order for checkout', async () => {
    const store = useEventsStore()
    const mockResponse = {
      message: 'Seat held successfully.',
      booking: {
        id: 10,
        uuid: 'book-uuid-10',
        booking_type: 'training_and_accommodation',
        status: 'held',
        hold_type: 'online',
        seconds_remaining_on_hold: 900,
        total_fee_kes: 5000000,
      },
      order: {
        id: 42,
        uuid: 'ord-uuid-42',
        total_kes: 5000000,
      },
    }

    http.post.mockResolvedValueOnce({ data: mockResponse })

    const result = await store.bookSeat('nairobi-jazz-masterclass', 'training_and_accommodation')
    expect(result.booking.status).toBe('held')
    expect(result.order.uuid).toBe('ord-uuid-42')
    expect(http.post).toHaveBeenCalledWith('/api/v1/events/nairobi-jazz-masterclass/book', {
      booking_type: 'training_and_accommodation',
    })
  })

  it('joins the priority waitlist when an event is fully booked', async () => {
    const store = useEventsStore()
    const mockWaitlistRes = {
      message: 'You have joined the waitlist.',
      waitlist: {
        id: 7,
        uuid: 'wl-uuid-7',
        status: 'waiting',
        booking_type: 'training_only',
      },
    }

    http.post.mockResolvedValueOnce({ data: mockWaitlistRes })

    const result = await store.joinWaitlist('nairobi-jazz-masterclass', 'training_only')
    expect(result.waitlist.status).toBe('waiting')
    expect(http.post).toHaveBeenCalledWith('/api/v1/events/nairobi-jazz-masterclass/waitlist', {
      booking_type: 'training_only',
    })
  })

  it('submits a student refund request with supporting document', async () => {
    const store = useEventsStore()
    const mockRes = {
      message: 'Refund request submitted successfully.',
      refund_request: {
        id: 99,
        uuid: 'ref-uuid-99',
        status: 'pending',
        reason: 'Emergency medical surgery',
      },
    }

    http.post.mockResolvedValueOnce({ data: mockRes })

    const file = new File(['proof content'], 'medical.pdf', { type: 'application/pdf' })
    const result = await store.submitRefundRequest('book-uuid-10', {
      reason: 'Emergency medical surgery',
      proofDocument: file,
    })

    expect(result.refund_request.status).toBe('pending')
    expect(http.post).toHaveBeenCalledWith(
      '/api/v1/student/events/bookings/book-uuid-10/refund',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
    )
  })

  it('coordinator checks in attendee at the door and dispatches reminders', async () => {
    const store = useEventsStore()

    // Mock coordinator attendees
    store.coordinatorAttendees = [
      {
        id: 1,
        uuid: 'book-attendee-01',
        status: 'confirmed',
        user: { name: 'Alice Musician' },
      },
    ]

    http.post.mockResolvedValueOnce({
      data: {
        message: 'Attendee checked in.',
        booking: { status: 'attended' },
      },
    })

    await store.checkInAttendee('book-attendee-01')
    expect(store.coordinatorAttendees[0].status).toBe('attended')

    // Mock reminders
    http.post.mockResolvedValueOnce({
      data: {
        message: 'Successfully dispatched reminders to 1 confirmed attendees.',
        dispatched_count: 1,
      },
    })

    const remRes = await store.sendReminders(1)
    expect(remRes.dispatched_count).toBe(1)
  })
})
