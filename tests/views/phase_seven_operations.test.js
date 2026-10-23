import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useTutoringStore } from '@/stores/tutoring'
import { useAuthStore } from '@/stores/auth'
import TutoringPackagesView from '@/views/tutoring/TutoringPackagesView.vue'
import StudentTutoringView from '@/views/student/StudentTutoringView.vue'
import InstructorTutoringScheduleView from '@/views/instructor/InstructorTutoringScheduleView.vue'

// Stubs for Vue Router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

describe('Phase 7: One-on-One Tutoring & Availability Views Testing', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('TutoringPackagesView (/tutoring)', () => {
    it('renders private mentoring packages, session counts, and currency toggle', async () => {
      const tutoringStore = useTutoringStore()
      const mockPackages = [
        {
          id: 1,
          slug: 'vocal-mentorship-pack-5',
          title: 'Master Vocal Coaching 5-Pack',
          description: 'Five 1-on-1 private studio sessions with conservatory faculty.',
          session_count: 5,
          price_kes: 2500000,
          validity_days: 90,
          is_active: true,
        },
      ]

      const fetchSpy = vi.spyOn(tutoringStore, 'fetchPackages').mockImplementation(async () => {
        tutoringStore.packages = mockPackages
        return mockPackages
      })

      const wrapper = mount(TutoringPackagesView, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      await flushPromises()

      expect(fetchSpy).toHaveBeenCalled()
      expect(wrapper.text()).toContain('Private Studio Tutoring & Technique Coaching')
      expect(wrapper.text()).toContain('Master Vocal Coaching 5-Pack')
      expect(wrapper.text()).toContain('5 Sessions')
      expect(wrapper.text()).toContain('KES 2,500,000')

      // Test currency toggle to USD
      const usdButton = wrapper.findAll('button').find(b => b.text().includes('USD'))
      expect(usdButton).toBeDefined()
      await usdButton.trigger('click')

      expect(wrapper.vm.selectedCurrency).toBe('USD')
    })
  })

  describe('StudentTutoringView (/student/tutoring)', () => {
    it('renders available credits and scheduled private tutoring sessions', async () => {
      const tutoringStore = useTutoringStore()
      const mockStudentPackages = [
        {
          id: 10,
          status: 'active',
          remaining_credits: 4,
          package: {
            title: 'Piano Technique Mentorship',
            session_count: 5,
          },
          expires_at: '2026-12-31T23:59:59Z',
        },
      ]
      const mockStudentSessions = [
        {
          id: 100,
          uuid: 'session-uuid-100',
          instructor: { name: 'Maestro David', email: 'david@bmas.test' },
          date: '2026-11-05',
          start_time: '14:00:00',
          end_time: '15:00:00',
          mode: 'zoom',
          meeting_link: 'https://zoom.us/j/123456789',
          status: 'scheduled',
        },
      ]

      vi.spyOn(tutoringStore, 'fetchStudentPackages').mockImplementation(async () => {
        tutoringStore.studentPackages = mockStudentPackages
        return mockStudentPackages
      })
      vi.spyOn(tutoringStore, 'fetchStudentSessions').mockImplementation(async () => {
        tutoringStore.studentSessions = mockStudentSessions
        return mockStudentSessions
      })

      const wrapper = mount(StudentTutoringView, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('My Booked Sessions')
      expect(wrapper.text()).toContain('Available Credits')
      expect(wrapper.text()).toContain('4') // 4 remaining credits
      expect(wrapper.text()).toContain('Maestro David')
      expect(wrapper.text()).toContain('scheduled')
    })
  })

  describe('InstructorTutoringScheduleView (/instructor/tutoring)', () => {
    it('renders shifts editor and session roster with attendance control', async () => {
      const tutoringStore = useTutoringStore()
      const mockAvail = [
        { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', is_active: true },
        { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', is_active: true },
      ]
      const mockSessions = [
        {
          id: 201,
          uuid: 'sess-roster-01',
          student: { name: 'Alice Violinist', email: 'alice@bmas.test' },
          package_title: 'Conservatory Performance Pack',
          session_date: '2026-11-10',
          start_time: '10:00:00',
          end_time: '11:00:00',
          mode: 'nairobi_studio',
          location: 'Studio B, BMAS Campus',
          status: 'scheduled',
        },
      ]

      vi.spyOn(tutoringStore, 'fetchInstructorAvailability').mockImplementation(async () => {
        tutoringStore.instructorAvailability = mockAvail
        return mockAvail
      })
      vi.spyOn(tutoringStore, 'fetchInstructorBlockedDates').mockResolvedValue([])
      vi.spyOn(tutoringStore, 'fetchInstructorSessions').mockImplementation(async () => {
        tutoringStore.instructorSessions = mockSessions
        return mockSessions
      })

      const wrapper = mount(InstructorTutoringScheduleView, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('1-on-1 Tutoring Studio & Schedule')
      expect(wrapper.text()).toContain('Weekly Teaching Availability')
      expect(wrapper.text()).toContain('Monday')
      expect(wrapper.text()).toContain('Save Weekly Schedule')

      // Switch to roster tab
      wrapper.vm.activeTab = 'roster'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Alice Violinist')
      expect(wrapper.text()).toContain('Studio B, BMAS Campus')
    })
  })
})
