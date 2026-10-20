import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '../lib/http';

export const useNotificationTemplateStore = defineStore('notificationTemplates', () => {
  const templates = ref([]);
  const currentTemplate = ref(null);
  const preferences = ref(null);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch all message templates
   */
  async function fetchTemplates(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/admin/notification-templates', { params });
      templates.value = res.data.data || [];
      return templates.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load templates.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch single template
   */
  async function fetchTemplate(key) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get(`/api/v1/admin/notification-templates/${key}`);
      currentTemplate.value = res.data.template || null;
      return currentTemplate.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load template.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update message template
   */
  async function updateTemplate(key, data) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.put(`/api/v1/admin/notification-templates/${key}`, data);
      await fetchTemplates();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update template.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dispatch test notification
   */
  async function testSend(key) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.post(`/api/v1/admin/notification-templates/${key}/test-send`);
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to dispatch test notification.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch student notification preferences
   */
  async function fetchPreferences() {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/student/notification-preferences');
      preferences.value = res.data.preferences || {};
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load preferences.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update student notification preferences
   */
  async function updatePreferences(prefs) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.put('/api/v1/student/notification-preferences', prefs);
      preferences.value = res.data.preferences || {};
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update preferences.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    templates,
    currentTemplate,
    preferences,
    loading,
    error,
    fetchTemplates,
    fetchTemplate,
    updateTemplate,
    testSend,
    fetchPreferences,
    updatePreferences,
  };
});
