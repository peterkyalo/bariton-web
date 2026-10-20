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
})
