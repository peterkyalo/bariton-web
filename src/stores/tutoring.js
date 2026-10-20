import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '../lib/http';

export const useTutoringStore = defineStore('tutoring', () => {
  const packages = ref([]);
  const currentPackage = ref(null);
  const studentPackages = ref([]);
  const studentSessions = ref([]);
  const instructorSessions = ref([]);
  const instructorAvailabilities = ref([]);
  const instructorBlockedDates = ref([]);
  const availableSlots = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch public tutoring packages
   */
  async function fetchPackages(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/tutoring/packages', { params });
      packages.value = res.data.data || [];
      return packages.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load tutoring packages.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch single package detail by slug
   */
  async function fetchPackage(slug) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get(`/api/v1/tutoring/packages/${slug}`);
      currentPackage.value = res.data.package || null;
      return currentPackage.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load package details.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch student's purchased tutoring packages and remaining credits
   */
  async function fetchStudentPackages() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/student/tutoring/packages');
      studentPackages.value = res.data.data || [];
      return studentPackages.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load your tutoring packages.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch open available slots for an instructor
   */
  async function fetchAvailableSlots(instructorId, params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get(`/api/v1/tutoring/instructors/${instructorId}/slots`, { params });
      availableSlots.value = res.data.slots || [];
      return availableSlots.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch instructor availability slots.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Book a session using a package credit
   */
  async function bookSession(bookingData) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post('/api/v1/student/tutoring/book', bookingData);
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to book session.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch student's booked sessions
   */
  async function fetchStudentSessions() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/student/tutoring/sessions');
      studentSessions.value = res.data.data || [];
      return studentSessions.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load your tutoring sessions.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Reschedule a session
   */
  async function rescheduleSession(uuid, rescheduleData) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/student/tutoring/sessions/${uuid}/reschedule`, rescheduleData);
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to reschedule session.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: fetch weekly availability
   */
  async function fetchInstructorAvailability() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/instructor/tutoring/availability');
      instructorAvailabilities.value = res.data.availabilities || [];
      return instructorAvailabilities.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load availability.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: set recurring availability shifts
   */
  async function setInstructorAvailability(shifts) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.put('/api/v1/instructor/tutoring/availability', { shifts });
      instructorAvailabilities.value = res.data.availabilities || [];
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to save availability.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: fetch blocked dates
   */
  async function fetchInstructorBlockedDates() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/instructor/tutoring/blocked-dates');
      instructorBlockedDates.value = res.data.blocked_dates || [];
      return instructorBlockedDates.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load blocked dates.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: add blocked date
   */
  async function addInstructorBlockedDate(data) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post('/api/v1/instructor/tutoring/blocked-dates', data);
      await fetchInstructorBlockedDates();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to add blocked date.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: delete blocked date
   */
  async function deleteInstructorBlockedDate(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.delete(`/api/v1/instructor/tutoring/blocked-dates/${id}`);
      await fetchInstructorBlockedDates();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to remove blocked date.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: fetch roster of booked sessions
   */
  async function fetchInstructorSessions(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/instructor/tutoring/sessions', { params });
      instructorSessions.value = res.data.data || [];
      return instructorSessions.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load instructor sessions.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: update meeting link or studio location
   */
  async function updateSessionDetails(uuid, details) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.put(`/api/v1/instructor/tutoring/sessions/${uuid}/details`, details);
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update session details.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: cancel session with credit restored to student
   */
  async function cancelSessionByInstructor(uuid, reason) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/instructor/tutoring/sessions/${uuid}/cancel`, { reason });
      await fetchInstructorSessions();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to cancel session.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Instructor: mark attendance
   */
  async function markSessionAttendance(uuid, { status, notes }) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/instructor/tutoring/sessions/${uuid}/attendance`, { status, notes });
      await fetchInstructorSessions();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to mark attendance.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    packages,
    currentPackage,
    studentPackages,
    studentSessions,
    instructorSessions,
    instructorAvailabilities,
    instructorBlockedDates,
    availableSlots,
    loading,
    error,
    fetchPackages,
    fetchPackage,
    fetchStudentPackages,
    fetchAvailableSlots,
    bookSession,
    fetchStudentSessions,
    rescheduleSession,
    fetchInstructorAvailability,
    setInstructorAvailability,
    fetchInstructorBlockedDates,
    addInstructorBlockedDate,
    deleteInstructorBlockedDate,
    fetchInstructorSessions,
    updateSessionDetails,
    cancelSessionByInstructor,
    markSessionAttendance,
  };
});
