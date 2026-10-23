import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useCmsStore } from '@/stores/cms'
import http from '@/lib/http'
import AdminDashboardView from '@/views/dashboards/AdminDashboardView.vue'
import FinanceDashboardView from '@/views/dashboards/FinanceDashboardView.vue'
import ContactView from '@/views/public/ContactView.vue'
import CmsPagesListView from '@/views/admin/CmsPagesListView.vue'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

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

describe('Phase 8 & 9: Multi-Role Dashboards & CMS Engine Views Testing', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('AdminDashboardView (/admin)', () => {
    it('renders executive revenue metrics, gateway breakdown, and triggers CSV export', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: 1, name: 'Director Waweru', email: 'director@bmas.test' }

      const mockAdminMetrics = {
        revenue: {
          total_kes: 12500000,
          total_usd: 961.54,
          breakdown: [
            { label: 'M-Pesa STK Push', amount: 8000000, percentage: 64 },
            { label: 'Stripe (Card)', amount: 3000000, percentage: 24 },
            { label: 'PayPal (USD)', amount: 1000000, percentage: 8 },
            { label: 'Bursar Cash', amount: 500000, percentage: 4 },
          ],
          by_category: {
            course_bundle: 7000000,
            module: 2500000,
            event: 2000000,
            tutoring: 1000000,
          },
        },
        enrollments: {
          total: 45,
          standard: 35,
          assessment_only: 10,
        },
        exams: {
          pass_rate_percentage: 88,
          passed: 44,
          total_graded: 50,
        },
        events: {
          occupancy_percentage: 92,
          occupied_seats: 46,
          total_capacity: 50,
        },
        tutoring: {
          utilization_percentage: 75,
          total_booked: 30,
          total_credits: 40,
        },
      }

      http.get.mockImplementation((url) => {
        if (url.includes('/dashboards/admin/export-csv')) {
          return Promise.resolve({ data: 'id,metric,value\n1,revenue,12500000' })
        }
        return Promise.resolve({ data: mockAdminMetrics })
      })

      const wrapper = mount(AdminDashboardView, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Executive Dashboard')
      expect(wrapper.text()).toContain('Director Waweru')
      expect(wrapper.text()).toContain('Institutional Intelligence')
      expect(wrapper.text()).toContain('Metrics Filtering & Analytics Window')
      expect(wrapper.text()).toContain('KES 12,500,000')

      // Trigger CSV export
      await wrapper.vm.handleExportCsv()
      expect(http.get).toHaveBeenCalledWith(
        '/api/v1/dashboards/admin/export-csv',
        expect.any(Object)
      )
    })
  })

  describe('FinanceDashboardView (/finance)', () => {
    it('renders finance inflows, cashier metrics, and triggers finance CSV export', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: 2, name: 'Bursar Mary', email: 'bursar@bmas.test' }

      const mockFinanceMetrics = {
        summary: {
          total_revenue_kes: 9500000,
          cash_total_kes: 1200000,
          cash_entries_count: 8,
          pending_refunds_count: 2,
          pending_refunds_amount_kes: 500000,
          credit_notes_count: 5,
          credit_notes_total_kes: 850000,
        },
        daily_collections: [
          { date: '2026-10-22', total_kes: 450000, count: 3 },
        ],
        recent_payments: [
          {
            id: 1,
            reference: 'MPE123456',
            gateway: 'mpesa',
            amount_kes: 500000,
            status: 'successful',
            created_at: '2026-10-22T10:00:00Z',
          },
        ],
      }

      http.get.mockImplementation((url) => {
        if (url.includes('/dashboards/finance/export-csv')) {
          return Promise.resolve({ data: 'id,date,gateway,amount\n1,2026-10-22,mpesa,500000' })
        }
        return Promise.resolve({ data: mockFinanceMetrics })
      })

      const wrapper = mount(FinanceDashboardView, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Financial Ledger: Bursar Mary')
      expect(wrapper.text()).toContain('Finance Directorate · Ledger & Cash Operations')
      expect(wrapper.text()).toContain('KES 9,500,000')
      expect(wrapper.text()).toContain('KES 1,200,000')

      // Export CSV
      await wrapper.vm.handleExportCsv()
      expect(http.get).toHaveBeenCalledWith(
        '/api/v1/dashboards/finance/export-csv',
        expect.any(Object)
      )
    })
  })

  describe('ContactView (/contact)', () => {
    it('submits contact inquiry message to API and shows confirmation', async () => {
      http.post.mockResolvedValueOnce({
        data: { message: 'Your inquiry has been received. Our conservatory admissions office will reply within 24 hours.' },
      })

      const wrapper = mount(ContactView, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      })

      expect(wrapper.text()).toContain('Contact Us')
      expect(wrapper.text()).toContain('We Are Here to Assist Your Musical Journey')

      // Fill in contact form
      wrapper.vm.form.name = 'Wanjiku Kamau'
      wrapper.vm.form.email = 'wanjiku@test.com'
      wrapper.vm.form.phone = '+254712345678'
      wrapper.vm.form.subject = 'Audition consult for Cello Diploma'
      wrapper.vm.form.message = 'I would like to inquire about audition requirements.'

      await wrapper.vm.handleSubmit()

      expect(http.post).toHaveBeenCalledWith('/contact', {
        name: 'Wanjiku Kamau',
        email: 'wanjiku@test.com',
        phone: '+254712345678',
        subject: 'Audition consult for Cello Diploma',
        message: 'I would like to inquire about audition requirements.',
      })
      expect(wrapper.vm.successMessage).toContain('Your inquiry has been received')
    })
  })

  describe('CmsPagesListView (/admin/cms/pages)', () => {
    it('renders published CMS pages list with status badges and categories', async () => {
      const mockPages = [
        {
          id: 1,
          title: 'Terms of Service',
          slug: 'terms',
          category: 'legal',
          is_published: true,
          hero_heading: 'Conservatory Policies & Terms',
          updated_at: '2026-10-20T10:00:00Z',
        },
        {
          id: 2,
          title: 'Conservatory Heritage',
          slug: 'about-heritage',
          category: 'company',
          is_published: false,
          hero_heading: 'A Legacy of African Musical Excellence',
          updated_at: '2026-10-21T12:00:00Z',
        },
      ]

      http.get.mockResolvedValueOnce({
        data: {
          data: mockPages,
          meta: { current_page: 1, total: 2 },
        },
      })

      const wrapper = mount(CmsPagesListView, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('CMS Pages Management')
      expect(wrapper.text()).toContain('Terms of Service')
      expect(wrapper.text()).toContain('/terms')
      expect(wrapper.text()).toContain('legal')
      expect(wrapper.text()).toContain('Conservatory Heritage')
    })
  })
})
