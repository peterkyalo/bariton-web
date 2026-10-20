import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOrdersStore } from '@/stores/orders'
import http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Orders Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with clean default state', () => {
    const store = useOrdersStore()
    expect(store.activeOrder).toBeNull()
    expect(store.studentOrders).toEqual([])
    expect(store.financeOrders).toEqual([])
    expect(store.financePayments).toEqual([])
    expect(store.paymentStatus).toBe('idle')
    expect(store.loading).toBe(false)
  })

  it('creates an order and sets activeOrder', async () => {
    const store = useOrdersStore()
    const mockOrder = {
      id: 1,
      uuid: 'ord-uuid-1234',
      order_number: 'BMAS-ORD-202610-ABC123',
      total_kes: 720000,
      total_kes_formatted: '7,200.00',
      status: 'pending',
    }

    http.post.mockResolvedValueOnce({
      data: { order: mockOrder },
    })

    const result = await store.createOrder('course_bundle', 10)

    expect(http.post).toHaveBeenCalledWith('/orders', {
      item_type: 'course_bundle',
      item_id: 10,
      currency: 'KES',
    })
    expect(result).toEqual(mockOrder)
    expect(store.activeOrder).toEqual(mockOrder)
    expect(store.loading).toBe(false)
  })

  it('initiates M-Pesa STK push and transitions to polling', async () => {
    const store = useOrdersStore()
    const mockRes = {
      message: 'STK push dispatched to phone.',
      checkout_request_id: 'ws_CO_12345',
    }

    http.post.mockResolvedValueOnce({ data: mockRes })

    const res = await store.initiateMpesa('ord-uuid-1234', '0712345678')

    expect(http.post).toHaveBeenCalledWith('/orders/ord-uuid-1234/pay/mpesa', {
      phone: '0712345678',
    })
    expect(store.paymentStatus).toBe('polling')
    expect(res).toEqual(mockRes)
  })

  it('fetches student order history', async () => {
    const store = useOrdersStore()
    const mockOrders = [
      { id: 1, order_number: 'BMAS-ORD-001', status: 'paid' },
      { id: 2, order_number: 'BMAS-ORD-002', status: 'pending' },
    ]

    http.get.mockResolvedValueOnce({
      data: {
        data: mockOrders,
        meta: { current_page: 1, last_page: 1, total: 2 },
      },
    })

    const res = await store.fetchStudentOrders()

    expect(http.get).toHaveBeenCalledWith('/student/orders', { params: { page: 1 } })
    expect(store.studentOrders).toEqual(mockOrders)
    expect(res).toEqual(mockOrders)
  })

  it('records finance cash payment and issues receipt', async () => {
    const store = useOrdersStore()
    const mockReceipt = {
      receipt_number: 'BMAS-RCT-000001',
      amount_kes: 720000,
    }

    http.post.mockResolvedValueOnce({
      data: {
        message: 'Cash payment recorded and official receipt issued.',
        receipt: mockReceipt,
      },
    })

    const res = await store.recordCashPayment({
      orderId: 1,
      amountKes: 720000,
      payerName: 'Parent Alice',
      notes: 'Main counter',
      paymentDate: '2026-10-20',
    })

    expect(http.post).toHaveBeenCalledWith('/finance/cash-payment', {
      order_id: 1,
      amount_kes: 720000,
      payer_name: 'Parent Alice',
      notes: 'Main counter',
      payment_date: '2026-10-20',
    })
    expect(res.receipt).toEqual(mockReceipt)
  })

  it('fetches finance payments transaction ledger', async () => {
    const store = useOrdersStore()
    const mockPayments = [
      { id: 1, gateway: 'mpesa', amount_kes: 720000, status: 'successful' },
      { id: 2, gateway: 'cash', amount_kes: 300000, status: 'successful' },
    ]

    http.get.mockResolvedValueOnce({
      data: {
        data: mockPayments,
        meta: { current_page: 1, last_page: 1, total: 2 },
      },
    })

    const res = await store.fetchFinancePayments({ gateway: 'mpesa' })

    expect(http.get).toHaveBeenCalledWith('/finance/payments', {
      params: { gateway: 'mpesa' },
    })
    expect(store.financePayments).toEqual(mockPayments)
    expect(res).toEqual(mockPayments)
  })

  it('initiates Stripe card payment session and confirms payment', async () => {
    const store = useOrdersStore()
    store.activeOrder = { uuid: 'ord-123', status: 'pending' }

    http.post
      .mockResolvedValueOnce({
        data: {
          client_secret: 'pi_test_123_secret_abc',
          payment_intent_id: 'pi_test_123',
        },
      })
      .mockResolvedValueOnce({
        data: {
          message: 'Card payment confirmed successfully and access granted.',
          order_status: 'paid',
        },
      })

    const initRes = await store.initiateStripe('ord-123')
    expect(http.post).toHaveBeenCalledWith('/orders/ord-123/pay/stripe')
    expect(initRes.payment_intent_id).toBe('pi_test_123')

    const confirmRes = await store.confirmStripe('ord-123', {
      payment_intent_id: 'pi_test_123',
    })
    expect(http.post).toHaveBeenCalledWith('/orders/ord-123/pay/stripe/confirm', {
      payment_intent_id: 'pi_test_123',
    })
    expect(confirmRes.order_status).toBe('paid')
    expect(store.activeOrder.status).toBe('paid')
    expect(store.paymentStatus).toBe('successful')
  })

  it('initiates PayPal order and captures payment', async () => {
    const store = useOrdersStore()
    store.activeOrder = { uuid: 'ord-paypal-123', status: 'pending' }

    http.post
      .mockResolvedValueOnce({
        data: {
          paypal_order_id: 'PAYPAL-ORD-999',
          approve_link: 'https://sandbox.paypal.com/checkout?token=999',
          amount_usd: 55.38,
        },
      })
      .mockResolvedValueOnce({
        data: {
          message: 'PayPal payment captured successfully and access granted.',
          order_status: 'paid',
        },
      })

    const initRes = await store.initiatePaypal('ord-paypal-123')
    expect(http.post).toHaveBeenCalledWith('/orders/ord-paypal-123/pay/paypal')
    expect(initRes.paypal_order_id).toBe('PAYPAL-ORD-999')

    const captureRes = await store.capturePaypal('ord-paypal-123', {
      paypal_order_id: 'PAYPAL-ORD-999',
    })
    expect(http.post).toHaveBeenCalledWith('/orders/ord-paypal-123/pay/paypal/capture', {
      paypal_order_id: 'PAYPAL-ORD-999',
    })
    expect(captureRes.order_status).toBe('paid')
    expect(store.activeOrder.status).toBe('paid')
  })

  it('submits a student refund request and fetches student refunds', async () => {
    const store = useOrdersStore()
    const mockRefund = {
      id: 1,
      uuid: 'ref-uuid-001',
      order_number: 'BMAS-ORD-001',
      status: 'pending',
      amount_kes_formatted: '4,000.00',
    }

    http.post.mockResolvedValueOnce({
      data: {
        message: 'Refund request submitted.',
        refund_request: mockRefund,
      },
    })

    const submitRes = await store.requestRefund('ord-001', {
      order_item_id: 10,
      reason: 'Course schedule conflicted with school exams.',
    })

    expect(http.post).toHaveBeenCalledWith('/student/orders/ord-001/refund-requests', {
      order_item_id: 10,
      reason: 'Course schedule conflicted with school exams.',
    })
    expect(submitRes.refund_request).toEqual(mockRefund)

    http.get.mockResolvedValueOnce({
      data: { data: [mockRefund] },
    })

    const listRes = await store.fetchStudentRefunds()
    expect(http.get).toHaveBeenCalledWith('/student/refund-requests', { params: { page: 1 } })
    expect(store.studentRefunds).toEqual([mockRefund])
    expect(listRes).toEqual([mockRefund])
  })

  it('reviews refund request as finance manager and fetches credit notes', async () => {
    const store = useOrdersStore()
    const mockReviewed = {
      id: 1,
      status: 'approved',
      credit_note: {
        uuid: 'crn-uuid-001',
        credit_note_number: 'BMAS-CRN-000001',
      },
    }

    http.post.mockResolvedValueOnce({
      data: {
        message: 'Refund approved successfully.',
        refund_request: mockReviewed,
      },
    })

    const reviewRes = await store.reviewRefundRequest('ref-uuid-001', {
      action: 'approve',
      notes: 'Approved per policy within 14 days.',
    })

    expect(http.post).toHaveBeenCalledWith('/finance/refund-requests/ref-uuid-001/review', {
      action: 'approve',
      notes: 'Approved per policy within 14 days.',
      manual_reference: null,
    })
    expect(reviewRes.refund_request).toEqual(mockReviewed)

    const mockCreditNotes = [
      {
        id: 1,
        credit_note_number: 'BMAS-CRN-000001',
        amount_kes_formatted: '4,000.00',
      },
    ]

    http.get.mockResolvedValueOnce({
      data: { data: mockCreditNotes },
    })

    const creditNotesRes = await store.fetchFinanceCreditNotes()
    expect(http.get).toHaveBeenCalledWith('/finance/credit-notes', { params: {} })
    expect(store.financeCreditNotes).toEqual(mockCreditNotes)
    expect(creditNotesRes).toEqual(mockCreditNotes)
  })
})

