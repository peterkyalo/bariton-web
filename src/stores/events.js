import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '../lib/http';

export const useEventsStore = defineStore('events', () => {
  const events = ref([]);
  const currentEvent = ref(null);
  const studentBookings = ref([]);
  const currentBooking = ref(null);
  const studentWaitlists = ref([]);
  const coordinatorEvents = ref([]);
  const coordinatorAttendees = ref([]);
  const coordinatorStats = ref(null);
  const financeRefunds = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch public events catalog
   */
  async function fetchEvents() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/events');
      events.value = res.data.data || [];
      return events.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch upcoming workshops and bootcamps.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch event details by slug
   */
  async function fetchEvent(slug) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get(`/api/v1/events/${slug}`);
      currentEvent.value = res.data.event || null;
      return currentEvent.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch event details.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Book a seat (creates online hold & order)
   */
  async function bookSeat(slug, bookingType = 'training_only') {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/events/${slug}/book`, { booking_type: bookingType });
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to book seat.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Join waitlist for full event
   */
  async function joinWaitlist(slug, bookingType = 'training_only') {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/events/${slug}/waitlist`, { booking_type: bookingType });
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to join waitlist.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch student's own event bookings
   */
  async function fetchStudentBookings() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/student/events/bookings');
      studentBookings.value = res.data.data || [];
      return studentBookings.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load bookings.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch specific student booking by uuid
   */
  async function fetchStudentBooking(uuid) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get(`/api/v1/student/events/bookings/${uuid}`);
      currentBooking.value = res.data.booking || null;
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load booking.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Submit refund request with reason and proof document
   */
  async function submitRefundRequest(uuid, { reason, proofDocument }) {
    loading.value = true;
    error.value = null;
    try {
      const formData = new FormData();
      formData.append('reason', reason);
      if (proofDocument) {
        formData.append('proof_document', proofDocument);
      }
      const res = await http.post(`/api/v1/student/events/bookings/${uuid}/refund`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to submit refund request.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch student's waitlist entries
   */
  async function fetchStudentWaitlists() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/student/events/waitlists');
      studentWaitlists.value = res.data.data || [];
      return studentWaitlists.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load waitlist entries.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Coordinator: fetch all managed events
   */
  async function fetchCoordinatorEvents() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/coordinator/events');
      coordinatorEvents.value = res.data.data || [];
      return coordinatorEvents.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load coordinator events.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Coordinator: fetch attendees roster for an event
   */
  async function fetchCoordinatorAttendees(eventId, params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get(`/api/v1/coordinator/events/${eventId}/attendees`, { params });
      coordinatorAttendees.value = res.data.attendees || [];
      coordinatorStats.value = res.data.stats || null;
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load event attendees.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Coordinator: check in attendee
   */
  async function checkInAttendee(uuid) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/coordinator/events/bookings/${uuid}/checkin`);
      // Update local state if present
      const found = coordinatorAttendees.value.find((b) => b.uuid === uuid);
      if (found) {
        found.status = 'attended';
        found.checked_in_at = new Date().toISOString();
        if (coordinatorStats.value) {
          coordinatorStats.value.attended = (coordinatorStats.value.attended || 0) + 1;
        }
      }
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to check in attendee.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Coordinator: send batch reminders
   */
  async function sendReminders(eventId) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/coordinator/events/${eventId}/reminders`);
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to send reminders.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Finance: place 48h cash hold
   */
  async function createCashHold(slug, attendeeId, bookingType = 'training_only') {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/finance/events/${slug}/cash-hold`, {
        attendee_id: attendeeId,
        booking_type: bookingType,
      });
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to place cash hold.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Finance: fetch event refunds
   */
  async function fetchFinanceRefunds(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/finance/event-refunds', { params });
      financeRefunds.value = res.data.refund_requests || [];
      return financeRefunds.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load event refunds.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Finance: approve event refund
   */
  async function approveRefund(uuid, manualReference = null) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/finance/event-refunds/${uuid}/approve`, {
        manual_reference: manualReference,
      });
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to approve refund.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Finance: reject event refund
   */
  async function rejectRefund(uuid, reason) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/finance/event-refunds/${uuid}/reject`, { reason });
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to reject refund.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    events,
    currentEvent,
    studentBookings,
    currentBooking,
    studentWaitlists,
    coordinatorEvents,
    coordinatorAttendees,
    coordinatorStats,
    financeRefunds,
    loading,
    error,
    fetchEvents,
    fetchEvent,
    bookSeat,
    joinWaitlist,
    fetchStudentBookings,
    fetchStudentBooking,
    submitRefundRequest,
    fetchStudentWaitlists,
    fetchCoordinatorEvents,
    fetchCoordinatorAttendees,
    checkInAttendee,
    sendReminders,
    createCashHold,
    fetchFinanceRefunds,
    approveRefund,
    rejectRefund,
  };
});
