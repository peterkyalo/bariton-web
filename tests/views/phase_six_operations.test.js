import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '@/stores/events'
import EventsCatalogView from '@/views/events/EventsCatalogView.vue'
import StudentEventBookingsView from '@/views/student/StudentEventBookingsView.vue'
import CoordinatorEventAttendeesView from '@/views/coordinator/CoordinatorEventAttendeesView.vue'

// Stubs for Vue Router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { slug: 'nairobi-cello-masterclass' },
    query: {},
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

describe('Phase 6: Physical Bootcamps & Workshops Views Testing', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('EventsCatalogView (/events)', () => {
    it('renders upcoming bootcamps, capacity occupancy bars, and badges', async () => {
      const eventsStore = useEventsStore()
      const mockEvents = [
        {
          id: 1,
          slug: 'cello-bootcamp-2026',
          title: 'Conservatory Cello Intensive Bootcamp',
          description: 'Intense 3-day conservatory chamber music workshop.',
          type: 'bootcamp',
          venue: 'Bariton Main Concert Hall, Nairobi',
          start_date: '2026-11-15T09:00:00Z',
          end_date: '2026-11-17T18:00:00Z',
          capacity: 20,
          occupied_seats_count: 15,
          available_seats_count: 5,
          training_fee_kes: 1500000,
          accommodation_fee_kes: 600000,
          has_accommodation: true,
          is_full: false,
        },
        {
          id: 2,
          slug: 'vocal-masterclass-2026',
          title: 'Opera Virtuoso Masterclass',
          description: 'Solo vocal technique with international guest faculty.',
          type: 'masterclass',
          venue: 'Studio A, BMAS Campus',
          start_date: '2026-12-01T10:00:00Z',
          end_date: '2026-12-02T16:00:00Z',
          capacity: 10,
          occupied_seats_count: 10,
          available_seats_count: 0,
          training_fee_kes: 2000000,
          has_accommodation: false,
          is_full: true,
        },
      ]

      const fetchSpy = vi.spyOn(eventsStore, 'fetchEvents').mockImplementation(async () => {
        eventsStore.events = mockEvents
        return mockEvents
      })

      const wrapper = mount(EventsCatalogView, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      expect(fetchSpy).toHaveBeenCalled()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Experience Live Music Mastery at Bariton')
      expect(wrapper.text()).toContain('Conservatory Cello Intensive Bootcamp')
      expect(wrapper.text()).toContain('Bariton Main Concert Hall, Nairobi')
      expect(wrapper.text()).toContain('Lodging & Meals Package Available')
      expect(wrapper.text()).toContain('Reserve Seat')

      // Sold out event shows waitlist
      expect(wrapper.text()).toContain('Opera Virtuoso Masterclass')
      expect(wrapper.text()).toContain('Sold Out')
      expect(wrapper.text()).toContain('Join Waitlist')
    })
  })

  describe('StudentEventBookingsView (/student/events)', () => {
    it('displays active seat hold timer and booked tickets roster', async () => {
      const eventsStore = useEventsStore()
      const mockBookings = [
        {
          id: 10,
          uuid: 'book-held-01',
          booking_reference: 'BMAS-EVT-HOLD123',
          event: {
            title: 'Chamber Strings Workshop',
            venue: 'Nairobi Conservatory Studio 1',
            start_date: '2026-11-20T09:00:00Z',
            end_date: '2026-11-21T17:00:00Z',
          },
          status: 'held',
          seconds_remaining_on_hold: 720,
          package_type: 'training_and_accommodation',
          total_fee_kes: 2100000,
          order: { uuid: 'ord-evt-99' },
        },
        {
          id: 11,
          uuid: 'book-conf-02',
          booking_reference: 'BMAS-EVT-CONF456',
          event: {
            title: 'Jazz Improvisation Intensive',
            venue: 'Auditorium B',
            start_date: '2026-11-25T10:00:00Z',
            end_date: '2026-11-26T18:00:00Z',
          },
          status: 'confirmed',
          package_type: 'training_only',
          total_fee_kes: 1200000,
          checked_in_at: null,
        },
      ]

      vi.spyOn(eventsStore, 'fetchStudentBookings').mockImplementation(async () => {
        eventsStore.studentBookings = mockBookings
        return mockBookings
      })
      vi.spyOn(eventsStore, 'fetchStudentWaitlists').mockResolvedValue([])

      const wrapper = mount(StudentEventBookingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('My Bootcamps & Workshops')
      expect(wrapper.text()).toContain('Seat Hold Active for Chamber Strings Workshop')
      expect(wrapper.text()).toContain('Pay KES 21,000 Now')
      expect(wrapper.text()).toContain('Jazz Improvisation Intensive')
      expect(wrapper.text()).toContain('Booking #book-con')
    })
  })

  describe('CoordinatorEventAttendeesView (/coordinator/events)', () => {
    it('renders attendance metrics, attendee roster, and performs check-in', async () => {
      const eventsStore = useEventsStore()
      const mockCoordinatorEvents = [
        { id: 1, title: 'Bariton Chamber Music Intensive', start_date: '2026-11-15' },
      ]
      const mockStats = {
        total_bookings: 20,
        confirmed: 18,
        attended: 12,
        training_only: 14,
        with_accommodation: 4,
      }
      const mockAttendees = [
        {
          id: 101,
          uuid: 'book-att-01',
          user: { name: 'Grace Attendee', email: 'grace@bmas.test', phone: '+254700112233' },
          booking_type: 'training_and_accommodation',
          total_fee_kes: 2100000,
          status: 'confirmed',
          checked_in_at: null,
          created_at: '2026-10-20T10:00:00Z',
        },
      ]

      vi.spyOn(eventsStore, 'fetchCoordinatorEvents').mockImplementation(async () => {
        eventsStore.coordinatorEvents = mockCoordinatorEvents
        return mockCoordinatorEvents
      })
      vi.spyOn(eventsStore, 'fetchCoordinatorAttendees').mockImplementation(async () => {
        eventsStore.coordinatorStats = mockStats
        eventsStore.coordinatorAttendees = mockAttendees
        return { stats: mockStats, attendees: mockAttendees }
      })
      const checkInSpy = vi.spyOn(eventsStore, 'checkInAttendee').mockResolvedValue({
        message: 'Attendee checked in successfully.',
      })

      const wrapper = mount(CoordinatorEventAttendeesView, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      // Simulate selected event
      wrapper.vm.selectedEventId = 1
      await wrapper.vm.loadAttendees()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Event Attendance & Check-In Roster')
      expect(wrapper.text()).toContain('Confirmed Seats')
      expect(wrapper.text()).toContain('Grace Attendee')
      expect(wrapper.text()).toContain('#book-att')
      expect(wrapper.text()).toContain('Training + Lodging')

      // Perform check-in
      await wrapper.vm.handleCheckIn(mockAttendees[0].uuid)
      expect(checkInSpy).toHaveBeenCalledWith('book-att-01')
    })
  })
})
