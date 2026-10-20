import { defineStore } from 'pinia'
import http from '@/lib/http'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    activeOrder: null,
    studentOrders: [],
    financeOrders: [],
    financePayments: [],
    pagination: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
    },
    loading: false,
    paymentStatus: 'idle', // idle, initiating, polling, successful, failed, expired
    paymentMessage: '',
    error: null,
  }),

  actions: {
    async createOrder(itemType, itemId, currency = 'KES') {
      this.loading = true
      this.error = null
      this.paymentStatus = 'idle'
      try {
        const res = await http.post('/orders', {
          item_type: itemType,
          item_id: itemId,
          currency,
        })
        this.activeOrder = res.data.order
        return this.activeOrder
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not initialize order.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchOrder(uuid) {
      this.loading = true
      this.error = null
      try {
        const res = await http.get(`/orders/${uuid}`)
        this.activeOrder = res.data.order
        return this.activeOrder
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not load order.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async initiateMpesa(uuid, phone) {
      this.loading = true
      this.error = null
      this.paymentStatus = 'initiating'
      this.paymentMessage = 'Sending M-Pesa STK push prompt to your phone...'

      try {
        const res = await http.post(`/orders/${uuid}/pay/mpesa`, { phone })
        this.paymentStatus = 'polling'
        this.paymentMessage = res.data.message || 'Check your phone and enter your M-Pesa PIN.'
        return res.data
      } catch (err) {
        this.paymentStatus = 'failed'
        this.error = err.response?.data?.message || 'Failed to dispatch M-Pesa prompt.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async pollOrderStatus(uuid, maxAttempts = 24, intervalMs = 2500) {
      this.paymentStatus = 'polling'
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs))
        try {
          const res = await http.get(`/orders/${uuid}/status`)
          const status = res.data.order_status
          if (status === 'paid') {
            this.paymentStatus = 'successful'
            this.paymentMessage = 'Payment confirmed! Your enrollment is active.'
            if (this.activeOrder) {
              this.activeOrder.status = 'paid'
            }
            return { status: 'paid', order: res.data }
          }
          if (status === 'expired') {
            this.paymentStatus = 'expired'
            this.paymentMessage = 'This order has expired.'
            if (this.activeOrder) {
              this.activeOrder.status = 'expired'
            }
            return { status: 'expired' }
          }
        } catch {
          // Continue polling on transient errors
        }
      }

      this.paymentStatus = 'idle'
      this.paymentMessage = 'Verification timed out. If you completed payment, please check your orders page shortly.'
      return { status: 'timeout' }
    },

    async fetchStudentOrders(page = 1) {
      this.loading = true
      try {
        const res = await http.get('/student/orders', { params: { page } })
        this.studentOrders = res.data.data || []
        this.pagination = {
          currentPage: res.data.meta?.current_page || 1,
          lastPage: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || this.studentOrders.length,
        }
        return this.studentOrders
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not load your orders.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async downloadReceiptPdf(receiptUuid, receiptNumber = 'BMAS-Receipt') {
      try {
        const res = await http.get(`/student/receipts/${receiptUuid}/download`, {
          responseType: 'blob',
        })
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${receiptNumber}.pdf`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (err) {
        this.error = 'Unable to download receipt PDF.'
        throw err
      }
    },

    // Finance Operations
    async fetchFinanceOrders(params = {}) {
      this.loading = true
      try {
        const res = await http.get('/finance/orders', { params })
        this.financeOrders = res.data.data || []
        this.pagination = {
          currentPage: res.data.meta?.current_page || 1,
          lastPage: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || this.financeOrders.length,
        }
        return this.financeOrders
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch orders.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async recordCashPayment({ orderId, amountKes, payerName, notes, paymentDate }) {
      this.loading = true
      this.error = null
      try {
        const res = await http.post('/finance/cash-payment', {
          order_id: orderId,
          amount_kes: amountKes,
          payer_name: payerName,
          notes,
          payment_date: paymentDate,
        })
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to record cash payment.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchFinancePayments(params = {}) {
      this.loading = true
      try {
        const res = await http.get('/finance/payments', { params })
        this.financePayments = res.data.data || []
        this.pagination = {
          currentPage: res.data.meta?.current_page || 1,
          lastPage: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || this.financePayments.length,
        }
        return this.financePayments
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch payments.'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
