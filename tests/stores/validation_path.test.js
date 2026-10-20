import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCoursesStore } from '@/stores/courses'
import { useOrdersStore } from '@/stores/orders'
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

describe('Phase 5 Professional Validation Path Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('populates course detail with professional validation pricing and upgrade status', async () => {
    const coursesStore = useCoursesStore()
    const mockCourse = {
      id: 5,
      title: 'Advanced Classical Piano Virtuosity',
      slug: 'advanced-classical-piano-virtuosity',
      is_open_for_validation: true,
      validation_pricing: {
        is_open_for_validation: true,
        price_kes: 1200000,
        price_kes_formatted: '12,000.00',
        price_usd_cents: 9231,
        price_usd_formatted: '92.31',
      },
      upgrade_pricing: {
        has_owned_modules: false,
        is_validation_path: true,
        total_paid_kes: 1200000,
        upgrade_price_kes: 800000,
        upgrade_price_formatted: '8,000.00',
      },
    }

    http.get.mockResolvedValueOnce({ data: { course: mockCourse } })

    const res = await coursesStore.fetchCourse('advanced-classical-piano-virtuosity')
    expect(res.is_open_for_validation).toBe(true)
    expect(res.validation_pricing.price_kes_formatted).toBe('12,000.00')
    expect(res.upgrade_pricing.is_validation_path).toBe(true)
    expect(res.upgrade_pricing.upgrade_price_kes).toBe(800000)
  })

  it('creates an assessment package order via orders store', async () => {
    const ordersStore = useOrdersStore()
    const mockOrder = {
      id: 88,
      uuid: 'ord-val-88',
      pricing: {
        total_kes: 1200000,
        total_kes_formatted: '12,000.00',
      },
      items: [
        {
          id: 1,
          item_type: 'assessment_package',
          item_id: 5,
          title: 'Professional Skills Validation Package',
          price_kes: 1200000,
        },
      ],
    }

    http.post.mockResolvedValueOnce({
      data: { message: 'Order created successfully.', order: mockOrder },
    })

    const res = await ordersStore.createOrder('assessment_package', 5)
    expect(http.post).toHaveBeenCalledWith('/api/v1/orders', {
      item_type: 'assessment_package',
      item_id: 5,
    })
    expect(res.uuid).toBe('ord-val-88')
    expect(ordersStore.activeOrder.items[0].item_type).toBe('assessment_package')
  })

  it('fetches validation path enrollment with lessons excluded and assignments accessible', async () => {
    const coursesStore = useCoursesStore()
    const mockEnrollment = {
      id: 12,
      uuid: 'enr-val-12',
      path_type: 'validation',
      is_validation_path: true,
      modules: [
        {
          id: 1,
          title: 'Module 1: Baroque Preludes',
          lessons: [], // Lessons hidden
          assignments: [
            {
              id: 101,
              uuid: 'asgn-101',
              title: 'Prelude Performance Recital',
            },
          ],
        },
      ],
    }

    http.get.mockResolvedValueOnce({
      data: { enrollment: mockEnrollment },
    })

    const res = await coursesStore.fetchEnrollmentDetail('enr-val-12')
    expect(res.path_type).toBe('validation')
    expect(res.is_validation_path).toBe(true)
    expect(res.modules[0].lessons).toHaveLength(0)
    expect(res.modules[0].assignments).toHaveLength(1)
  })

  it('verifies a validation certificate and exposes assessment note and track title', async () => {
    const examsStore = useExamsStore()
    const mockVerification = {
      certificate_code: 'BMAS-CERT-VAL9988',
      holder_name: 'Elena Rostova',
      course_title: 'Professional Violin Virtuosity',
      path_type: 'validation',
      is_validation_path: true,
      certificate_type_title: 'Certificate of Skills Validation',
      assessment_note: 'The holder completed assessment examination only.',
      status: 'issued',
    }

    http.get.mockResolvedValueOnce({
      data: { status: 'success', data: mockVerification },
    })

    const res = await examsStore.verifyCertificate('BMAS-CERT-VAL9988')
    expect(http.get).toHaveBeenCalledWith('/api/v1/certificates/verify/BMAS-CERT-VAL9988')
    expect(res.path_type).toBe('validation')
    expect(res.certificate_type_title).toBe('Certificate of Skills Validation')
    expect(res.assessment_note).toBe('The holder completed assessment examination only.')
    expect(examsStore.verificationResult.is_validation_path).toBe(true)
  })
})
