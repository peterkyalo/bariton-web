import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '../lib/http';

export const useDashboardStore = defineStore('dashboard', () => {
  const adminMetrics = ref(null);
  const financeMetrics = ref(null);
  const instructorMetrics = ref(null);
  const coordinatorMetrics = ref(null);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch Executive Admin Dashboard Metrics
   */
  async function fetchAdminMetrics(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/dashboards/admin', { params });
      adminMetrics.value = res.data;
      return adminMetrics.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load admin metrics.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Export Admin Metrics CSV
   */
  async function downloadAdminCsv(params = {}) {
    const res = await http.get('/api/v1/dashboards/admin/export-csv', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bmas-admin-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Fetch Finance Directorate Metrics
   */
  async function fetchFinanceMetrics(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/dashboards/finance', { params });
      financeMetrics.value = res.data;
      return financeMetrics.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load finance metrics.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Export Finance Ledger CSV
   */
  async function downloadFinanceCsv(params = {}) {
    const res = await http.get('/api/v1/dashboards/finance/export-csv', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bmas-finance-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Fetch Instructor Studio Metrics
   */
  async function fetchInstructorMetrics() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/dashboards/instructor');
      instructorMetrics.value = res.data;
      return instructorMetrics.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load instructor metrics.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch Coordinator Events Metrics
   */
  async function fetchCoordinatorMetrics() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/dashboards/coordinator');
      coordinatorMetrics.value = res.data;
      return coordinatorMetrics.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load coordinator metrics.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    adminMetrics,
    financeMetrics,
    instructorMetrics,
    coordinatorMetrics,
    loading,
    error,
    fetchAdminMetrics,
    downloadAdminCsv,
    fetchFinanceMetrics,
    downloadFinanceCsv,
    fetchInstructorMetrics,
    fetchCoordinatorMetrics,
  };
});
