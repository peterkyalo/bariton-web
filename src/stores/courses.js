import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '../lib/http';

export const useCoursesStore = defineStore('courses', () => {
  const catalog = ref([]);
  const catalogMeta = ref(null);
  const currentCourse = ref(null);
  const currentEnrollment = ref(null);
  const currentLesson = ref(null);
  const studentEnrollments = ref([]);
  const instructorCourses = ref([]);
  const adminCourses = ref([]);
  const adminCoursesMeta = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchCatalog(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get('/api/v1/courses', { params });
      catalog.value = res.data.data || [];
      catalogMeta.value = res.data.meta || null;
      return catalog.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load course catalog.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCourse(slug) {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.get(`/api/v1/courses/${slug}`);
      currentCourse.value = res.data.course || null;
      return currentCourse.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load course details.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPreviewLesson(slug, lessonUuid) {
    loading.value = true;
    try {
      const res = await http.get(`/api/v1/courses/${slug}/preview/${lessonUuid}`);
      return res.data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStudentEnrollments() {
    loading.value = true;
    try {
      const res = await http.get('/api/v1/student/enrollments');
      studentEnrollments.value = res.data.data || [];
      return studentEnrollments.value;
    } finally {
      loading.value = false;
    }
  }

  async function fetchEnrollment(uuid) {
    loading.value = true;
    error.value = null;
    currentLesson.value = null;
    try {
      const res = await http.get(`/api/v1/student/enrollments/${uuid}`);
      currentEnrollment.value = res.data.enrollment || null;
      return currentEnrollment.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load course enrollment.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchLesson(uuid) {
    loading.value = true;
    try {
      const res = await http.get(`/api/v1/student/lessons/${uuid}`);
      currentLesson.value = res.data.lesson || null;
      return currentLesson.value;
    } finally {
      loading.value = false;
    }
  }

  async function recordLessonProgress(lessonUuid, payload) {
    try {
      const res = await http.post(`/api/v1/student/lessons/${lessonUuid}/progress`, payload);
      const data = res.data;

      // Update current enrollment progress state locally
      if (currentEnrollment.value) {
        currentEnrollment.value.progress_percent = data.course_progress_percent;
        if (data.course_status) {
          currentEnrollment.value.status = data.course_status;
        }
        if (!currentEnrollment.value.progress_map) {
          currentEnrollment.value.progress_map = {};
        }
        const updatedProg = {
          status: data.lesson_status,
          progress_percent: data.lesson_progress_percent,
          completed_at: data.completed_at,
        };
        currentEnrollment.value.progress_map[data.lesson_id] = updatedProg;

        // Also update lesson.progress and module.progress_percent in the sidebar modules
        if (Array.isArray(currentEnrollment.value.modules)) {
          currentEnrollment.value.modules.forEach((mod) => {
            if (Array.isArray(mod.lessons) && mod.lessons.length > 0) {
              mod.lessons.forEach((les) => {
                if (les.id === data.lesson_id) {
                  les.progress = updatedProg;
                }
              });
              const total = mod.lessons.length;
              const done = mod.lessons.filter(
                (l) => (currentEnrollment.value.progress_map[l.id]?.status || l.progress?.status) === 'completed'
              ).length;
              mod.progress_percent = Math.round((done / total) * 100);
            }
          });
        }

        // Sync with studentEnrollments list if loaded
        const idx = studentEnrollments.value.findIndex((e) => e.id === currentEnrollment.value.id || e.uuid === currentEnrollment.value.uuid);
        if (idx !== -1) {
          studentEnrollments.value[idx].progress_percent = data.course_progress_percent;
          if (data.course_status) {
            studentEnrollments.value[idx].status = data.course_status;
          }
        }
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  async function fetchInstructorCourses() {
    loading.value = true;
    try {
      const res = await http.get('/api/v1/instructor/courses');
      instructorCourses.value = res.data.data || [];
      return instructorCourses.value;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAdminCourses(params = {}) {
    loading.value = true;
    try {
      const res = await http.get('/api/v1/admin/courses', { params });
      adminCourses.value = res.data.data || [];
      adminCoursesMeta.value = res.data.meta || null;
      return adminCourses.value;
    } finally {
      loading.value = false;
    }
  }

  async function saveCourse(formData, courseId = null) {
    loading.value = true;
    try {
      let res;
      if (courseId) {
        res = await http.put(`/api/v1/admin/courses/${courseId}`, formData);
      } else {
        res = await http.post('/api/v1/admin/courses', formData);
      }
      return res.data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAdminCourse(id) {
    const res = await http.get(`/api/v1/admin/courses/${id}`);
    currentCourse.value = res.data.course || null;
    return currentCourse.value;
  }

  async function fetchInstructorCourse(id) {
    const res = await http.get(`/api/v1/instructor/courses/${id}`);
    currentCourse.value = res.data.course || null;
    return currentCourse.value;
  }

  async function saveModule(courseId, moduleData, moduleId = null) {
    let res;
    if (moduleId) {
      res = await http.put(`/api/v1/instructor/modules/${moduleId}`, moduleData);
    } else {
      res = await http.post(`/api/v1/instructor/courses/${courseId}/modules`, moduleData);
    }
    return res.data;
  }

  async function deleteModule(moduleId) {
    const res = await http.delete(`/api/v1/instructor/modules/${moduleId}`);
    return res.data;
  }

  async function saveLesson(moduleId, formData, lessonId = null) {
    let res;
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
    };

    if (lessonId) {
      formData.append('_method', 'PUT');
      res = await http.post(`/api/v1/instructor/lessons/${lessonId}`, formData, config);
    } else {
      res = await http.post(`/api/v1/instructor/modules/${moduleId}/lessons`, formData, config);
    }
    return res.data;
  }

  async function deleteLesson(lessonId) {
    const res = await http.delete(`/api/v1/instructor/lessons/${lessonId}`);
    return res.data;
  }

  /* ---- Course & module rich media: inline images, covers, attachments ---- */
  const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };
  const ownerPath = (ownerType, ownerId) =>
    `/api/v1/instructor/${ownerType === 'course' ? 'courses' : 'modules'}/${ownerId}`;

  async function uploadEditorImage(file) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await http.post('/api/v1/instructor/uploads/images', fd, multipart);
    return res.data;
  }

  async function uploadCover(ownerType, ownerId, file) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await http.post(`${ownerPath(ownerType, ownerId)}/cover`, fd, multipart);
    return res.data;
  }

  async function removeCover(ownerType, ownerId) {
    const res = await http.delete(`${ownerPath(ownerType, ownerId)}/cover`);
    return res.data;
  }

  async function addAttachment(ownerType, ownerId, formData) {
    const res = await http.post(`${ownerPath(ownerType, ownerId)}/attachments`, formData, multipart);
    return res.data;
  }

  async function deleteAttachment(attachmentId) {
    const res = await http.delete(`/api/v1/instructor/attachments/${attachmentId}`);
    return res.data;
  }

  return {
    catalog,
    catalogMeta,
    currentCourse,
    currentEnrollment,
    currentLesson,
    studentEnrollments,
    instructorCourses,
    adminCourses,
    adminCoursesMeta,
    loading,
    error,
    fetchCatalog,
    fetchCourse,
    fetchPreviewLesson,
    fetchStudentEnrollments,
    fetchEnrollment,
    fetchLesson,
    recordLessonProgress,
    fetchInstructorCourses,
    fetchAdminCourses,
    saveCourse,
    fetchAdminCourse,
    fetchInstructorCourse,
    saveModule,
    deleteModule,
    saveLesson,
    deleteLesson,
    uploadEditorImage,
    uploadCover,
    removeCover,
    addAttachment,
    deleteAttachment,
  };
});
