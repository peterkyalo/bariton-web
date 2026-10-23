import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useOrdersStore } from '@/stores/orders'
import FinanceCashEntryView from '@/views/finance/FinanceCashEntryView.vue'
import FinancePaymentsView from '@/views/finance/FinancePaymentsView.vue'
import FinanceRefundsView from '@/views/finance/FinanceRefundsView.vue'

// Mock router-link and components if needed
const globalStubs = {
  RouterLink: {
    template: '<a><slot /></a>',
  },
}

describe('Finance Operations Views Testing', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('FinanceCashEntryView (/finance/cash-entry)', () => {
    it('renders header, fetches pending orders, and displays order row', async () => {
      const ordersStore = useOrdersStore()
      const mockOrder = {
        id: 101,
        order_number: 'BMAS-ORD-202610-TEST01',
        user: { name: 'Alice Student', email: 'alice@bmas.test', phone: '0711000111' },
        items: [{ id: 1, title: 'Classical Piano Level 1' }],
        total_kes: 500000,
        total_kes_formatted: '5,000.00',
        status: 'pending',
      }

      vi.spyOn(ordersStore, 'fetchFinanceOrders').mockImplementation(async () => {
        ordersStore.financeOrders = [mockOrder]
        return [mockOrder]
      })

      const wrapper = mount(FinanceCashEntryView, {
        global: {
          plugins: [pinia],
          stubs: globalStubs,
        },
      })

      expect(ordersStore.fetchFinanceOrders).toHaveBeenCalledWith({
        search: '',
        status: 'pending',
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Cash Payment Reception')
      expect(wrapper.text()).toContain('BMAS-ORD-202610-TEST01')
      expect(wrapper.text()).toContain('Alice Student')
      expect(wrapper.text()).toContain('KES 5,000.00')
      expect(wrapper.text()).toContain('Record Cash')
    })

    it('submits cash payment and triggers receipt issuance', async () => {
      const ordersStore = useOrdersStore()
      const mockOrder = {
        id: 101,
        order_number: 'BMAS-ORD-202610-TEST01',
        user: { name: 'Alice Student', email: 'alice@bmas.test' },
        total_kes: 500000,
        total_kes_formatted: '5,000.00',
        status: 'pending',
      }

      ordersStore.financeOrders = [mockOrder]
      vi.spyOn(ordersStore, 'fetchFinanceOrders').mockResolvedValue([mockOrder])
      const recordCashSpy = vi.spyOn(ordersStore, 'recordCashPayment').mockResolvedValue({
        message: 'Cash payment recorded.',
        receipt: {
          uuid: 'rct-uuid-001',
          receipt_number: 'BMAS-RCT-000001',
          amount_kes_formatted: '5,000.00',
        },
      })

      const wrapper = mount(FinanceCashEntryView, {
        global: {
          plugins: [pinia],
          stubs: globalStubs,
        },
      })

      // Click "Record Cash" to open modal
      const recordBtn = wrapper.find('button.btn-primary.text-xs.py-1\\.5')
      expect(recordBtn.exists()).toBe(true)
      await recordBtn.trigger('click')

      expect(wrapper.vm.isModalOpen).toBe(true)
      expect(wrapper.vm.form.amount_kes).toBe(5000)

      // Submit cash payment
      await wrapper.vm.submitCashPayment()

      expect(recordCashSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 101,
          amountKes: 500000,
          payerName: 'Alice Student',
        })
      )
      expect(wrapper.vm.isSuccessModalOpen).toBe(true)
    })
  })

  describe('FinancePaymentsView (/finance/payments)', () => {
    it('renders payment ledger transactions and filters', async () => {
      const ordersStore = useOrdersStore()
      const mockPayments = [
        {
          id: 1,
          uuid: 'pay-001',
          reference: 'QWE1234567',
          order: { order_number: 'BMAS-ORD-111', user: { name: 'Bob Singer', email: 'bob@test.com' } },
          gateway: 'mpesa',
          gateway_name: 'Safaricom M-Pesa',
          amount_kes: 450000,
          amount_kes_formatted: '4,500.00',
          currency: 'KES',
          status: 'successful',
          created_at: '2026-10-22T10:00:00Z',
          receipt: { uuid: 'rct-001', receipt_number: 'BMAS-RCT-000101' },
        },
      ]

      const fetchSpy = vi.spyOn(ordersStore, 'fetchFinancePayments').mockImplementation(async () => {
        ordersStore.financePayments = mockPayments
        return mockPayments
      })

      const wrapper = mount(FinancePaymentsView, {
        global: {
          plugins: [pinia],
          stubs: globalStubs,
        },
      })

      expect(fetchSpy).toHaveBeenCalledWith({
        gateway: undefined,
        status: undefined,
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Payment Transactions Ledger')
      expect(wrapper.text()).toContain('QWE1234567')
      expect(wrapper.text()).toContain('Bob Singer')
      expect(wrapper.text()).toContain('KES 4,500.00')
      expect(wrapper.text()).toContain('BMAS-RCT-000101')
    })
  })

  describe('FinanceRefundsView (/finance/refunds)', () => {
    it('renders refund requests queue and allows approving refund', async () => {
      const ordersStore = useOrdersStore()
      const mockRefund = {
        id: 1,
        uuid: 'ref-001',
        order_number: 'BMAS-ORD-222',
        student: { name: 'Clara Pianist', email: 'clara@test.com' },
        item_title: 'Vocal Warmups Module',
        payment_method: 'mpesa',
        amount_kes: 250000,
        amount_kes_formatted: '2,500.00',
        amount_usd_formatted: '19.23',
        reason: 'Duplicate purchase by accident.',
        status: 'pending',
        created_at: '2026-10-21T08:00:00Z',
        credit_note: null,
      }

      const fetchRefundsSpy = vi.spyOn(ordersStore, 'fetchFinanceRefunds').mockImplementation(async () => {
        ordersStore.financeRefunds = [mockRefund]
        return [mockRefund]
      })

      const reviewSpy = vi.spyOn(ordersStore, 'reviewRefundRequest').mockResolvedValue({
        message: 'Refund approved successfully.',
        refund_request: { ...mockRefund, status: 'approved' },
      })

      const wrapper = mount(FinanceRefundsView, {
        global: {
          plugins: [pinia],
          stubs: globalStubs,
        },
      })

      expect(fetchRefundsSpy).toHaveBeenCalledWith({ status: undefined })
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Refund Review Queue')
      expect(wrapper.text()).toContain('BMAS-ORD-222')
      expect(wrapper.text()).toContain('Clara Pianist')
      expect(wrapper.text()).toContain('Duplicate purchase by accident.')

      // Open review modal
      wrapper.vm.openReviewModal(mockRefund)
      expect(wrapper.vm.showReviewModal).toBe(true)
      expect(wrapper.vm.decision).toBe('approved')

      // Submit approval
      wrapper.vm.reviewNotes = 'Approved - within 14 day grace period.'
      wrapper.vm.refundReference = 'REV-MPESA-888999'
      await wrapper.vm.submitReview()

      expect(reviewSpy).toHaveBeenCalledWith('ref-001', {
        decision: 'approved',
        review_notes: 'Approved - within 14 day grace period.',
        refund_reference: 'REV-MPESA-888999',
      })
      expect(wrapper.vm.showReviewModal).toBe(false)
    })

    it('requires explanation notes when rejecting a refund', async () => {
      const ordersStore = useOrdersStore()
      const mockRefund = {
        id: 2,
        uuid: 'ref-002',
        order: { order_number: 'BMAS-ORD-333', user: { name: 'David' } },
        amount_kes_formatted: '3,000.00',
        status: 'pending',
      }

      ordersStore.financeRefunds = [mockRefund]
      vi.spyOn(ordersStore, 'fetchFinanceRefunds').mockResolvedValue([mockRefund])
      const reviewSpy = vi.spyOn(ordersStore, 'reviewRefundRequest')

      const wrapper = mount(FinanceRefundsView, {
        global: {
          plugins: [pinia],
          stubs: globalStubs,
        },
      })

      wrapper.vm.openReviewModal(mockRefund)
      wrapper.vm.decision = 'rejected'
      wrapper.vm.reviewNotes = ''

      await wrapper.vm.submitReview()

      expect(wrapper.vm.reviewError).toContain('Please state the reason')
      expect(reviewSpy).not.toHaveBeenCalled()
    })
  })
})
