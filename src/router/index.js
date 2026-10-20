import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import GuestLayout from '@/layouts/GuestLayout.vue'
import StudentLayout from '@/layouts/StudentLayout.vue'
import StaffLayout from '@/layouts/StaffLayout.vue'

import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import TwoFactorChallengeView from '@/views/auth/TwoFactorChallengeView.vue'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue'
import VerifyEmailView from '@/views/auth/VerifyEmailView.vue'
import GuardianConfirmView from '@/views/auth/GuardianConfirmView.vue'

import ProfileView from '@/views/profile/ProfileView.vue'

import StudentDashboardView from '@/views/dashboards/StudentDashboardView.vue'
import InstructorDashboardView from '@/views/dashboards/InstructorDashboardView.vue'
import FinanceDashboardView from '@/views/dashboards/FinanceDashboardView.vue'
import CoordinatorDashboardView from '@/views/dashboards/CoordinatorDashboardView.vue'
import AdminDashboardView from '@/views/dashboards/AdminDashboardView.vue'

import UsersView from '@/views/admin/UsersView.vue'
import SettingsView from '@/views/admin/SettingsView.vue'
import ActivityLogView from '@/views/admin/ActivityLogView.vue'
import NotificationLogView from '@/views/admin/NotificationLogView.vue'

import CourseCatalogView from '@/views/catalog/CourseCatalogView.vue'
import CourseDetailView from '@/views/catalog/CourseDetailView.vue'
import StudentCoursesView from '@/views/student/StudentCoursesView.vue'
import LessonPlayerView from '@/views/student/LessonPlayerView.vue'
import InstructorCoursesView from '@/views/instructor/InstructorCoursesView.vue'
import CourseListView from '@/views/admin/courses/CourseListView.vue'
import CourseEditorView from '@/views/admin/courses/CourseEditorView.vue'

import CheckoutView from '@/views/checkout/CheckoutView.vue'
import StudentOrdersView from '@/views/student/StudentOrdersView.vue'
import StudentAssignmentView from '@/views/student/StudentAssignmentView.vue'
import InstructorGradingQueueView from '@/views/instructor/InstructorGradingQueueView.vue'
import InstructorGradingView from '@/views/instructor/InstructorGradingView.vue'
import FinanceCashEntryView from '@/views/finance/FinanceCashEntryView.vue'
import FinancePaymentsView from '@/views/finance/FinancePaymentsView.vue'
import FinanceRefundsView from '@/views/finance/FinanceRefundsView.vue'
import FinanceCreditNotesView from '@/views/finance/FinanceCreditNotesView.vue'

import StudentExamView from '@/views/student/StudentExamView.vue'
import StudentCertificatesView from '@/views/student/StudentCertificatesView.vue'
import CertificateVerificationView from '@/views/public/CertificateVerificationView.vue'
import InstructorExamGradingQueueView from '@/views/instructor/InstructorExamGradingQueueView.vue'
import InstructorExamGradingView from '@/views/instructor/InstructorExamGradingView.vue'
import AdminCertificatesView from '@/views/admin/AdminCertificatesView.vue'

import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'

const routes = [
  // Landing / Home
  {
    path: '/',
    name: 'home',
    beforeEnter: (to, from, next) => {
      const auth = useAuthStore()
      if (auth.isAuthenticated) {
        next(auth.homeRoute)
      } else {
        next({ name: 'login' })
      }
    },
  },

  // Auth Routes (Guest)
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { layout: GuestLayout, guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { layout: GuestLayout, guest: true },
  },
  {
    path: '/two-factor-challenge',
    name: 'auth.two-factor-challenge',
    component: TwoFactorChallengeView,
    meta: { layout: GuestLayout },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { layout: GuestLayout, guest: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordView,
    meta: { layout: GuestLayout, guest: true },
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: VerifyEmailView,
    meta: { layout: GuestLayout },
  },
  {
    path: '/guardian/confirm',
    name: 'guardian.confirm',
    component: GuardianConfirmView,
    meta: { layout: GuestLayout },
  },

  // Authenticated User Profile
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      auth: true,
      layout: (auth) => (auth.isStaff ? StaffLayout : StudentLayout),
    },
  },

  // Role Dashboards
  {
    path: '/student',
    name: 'dashboard.student',
    component: StudentDashboardView,
    meta: { layout: StudentLayout, auth: true, permission: 'dashboard.student' },
  },
  {
    path: '/instructor',
    name: 'dashboard.instructor',
    component: InstructorDashboardView,
    meta: { layout: StaffLayout, auth: true, permission: 'dashboard.instructor' },
  },
  {
    path: '/finance',
    name: 'dashboard.finance',
    component: FinanceDashboardView,
    meta: { layout: StaffLayout, auth: true, permission: 'dashboard.finance' },
  },
  {
    path: '/coordinator',
    name: 'dashboard.coordinator',
    component: CoordinatorDashboardView,
    meta: { layout: StaffLayout, auth: true, permission: 'dashboard.coordinator' },
  },
  {
    path: '/admin',
    name: 'dashboard.admin',
    component: AdminDashboardView,
    meta: { layout: StaffLayout, auth: true, permission: 'dashboard.admin' },
  },

  // Admin Management Views
  {
    path: '/admin/courses',
    name: 'admin.courses',
    component: CourseListView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.manage-all' },
  },
  {
    path: '/admin/courses/create',
    name: 'admin.courses.create',
    component: CourseEditorView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.manage-all' },
  },
  {
    path: '/admin/courses/:id/edit',
    name: 'admin.courses.edit',
    component: CourseEditorView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.manage-all' },
  },
  {
    path: '/admin/users',
    name: 'admin.users',
    component: UsersView,
    meta: { layout: StaffLayout, auth: true, permission: 'users.view' },
  },
  {
    path: '/admin/settings',
    name: 'admin.settings',
    component: SettingsView,
    meta: { layout: StaffLayout, auth: true, permission: 'settings.view' },
  },
  {
    path: '/admin/activity',
    name: 'admin.activity',
    component: ActivityLogView,
    meta: { layout: StaffLayout, auth: true, permission: 'activity-log.view' },
  },
  {
    path: '/admin/notifications',
    name: 'admin.notifications',
    component: NotificationLogView,
    meta: { layout: StaffLayout, auth: true, permission: 'notifications.view' },
  },
  {
    path: '/admin/certificates',
    name: 'admin.certificates',
    component: AdminCertificatesView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.manage-all' },
  },

  // Instructor Courses
  {
    path: '/instructor/courses',
    name: 'instructor.courses',
    component: InstructorCoursesView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.teach' },
  },
  {
    path: '/instructor/grading',
    name: 'instructor.grading',
    component: InstructorGradingQueueView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.teach' },
  },
  {
    path: '/instructor/grading/:uuid',
    name: 'instructor.grading.detail',
    component: InstructorGradingView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.teach' },
  },
  {
    path: '/instructor/exam-grading',
    name: 'instructor.exam-grading',
    component: InstructorExamGradingQueueView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.teach' },
  },
  {
    path: '/instructor/exam-grading/:uuid',
    name: 'instructor.exam-grading.detail',
    component: InstructorExamGradingView,
    meta: { layout: StaffLayout, auth: true, permission: 'courses.teach' },
  },

  // Student Enrolled Courses & Player
  {
    path: '/student/courses',
    name: 'student.courses',
    component: StudentCoursesView,
    meta: { layout: StudentLayout, auth: true, permission: 'courses.enroll' },
  },
  {
    path: '/student/courses/:uuid/player',
    name: 'student.player',
    component: LessonPlayerView,
    meta: { layout: GuestLayout, auth: true, permission: 'courses.enroll' },
  },
  {
    path: '/student/orders',
    name: 'student.orders',
    component: StudentOrdersView,
    meta: { layout: StudentLayout, auth: true, permission: 'courses.enroll' },
  },
  {
    path: '/student/assignments/:uuid',
    name: 'student.assignment',
    component: StudentAssignmentView,
    meta: { layout: StudentLayout, auth: true, permission: 'courses.enroll' },
  },
  {
    path: '/student/courses/:slug/exam',
    name: 'student.exam',
    component: StudentExamView,
    meta: { layout: StudentLayout, auth: true, permission: 'courses.enroll' },
  },
  {
    path: '/student/certificates',
    name: 'student.certificates',
    component: StudentCertificatesView,
    meta: { layout: StudentLayout, auth: true, permission: 'courses.enroll' },
  },

  // Checkout View
  {
    path: '/checkout',
    name: 'checkout',
    component: CheckoutView,
    meta: { layout: StudentLayout, auth: true },
  },

  // Finance Staff Operations
  {
    path: '/finance/cash-entry',
    name: 'finance.cash',
    component: FinanceCashEntryView,
    meta: { layout: StaffLayout, auth: true, permission: 'dashboard.finance' },
  },
  {
    path: '/finance/payments',
    name: 'finance.payments',
    component: FinancePaymentsView,
    meta: { layout: StaffLayout, auth: true, permission: 'dashboard.finance' },
  },
  {
    path: '/finance/refunds',
    name: 'finance.refunds',
    component: FinanceRefundsView,
    meta: { layout: StaffLayout, auth: true, permission: 'dashboard.finance' },
  },
  {
    path: '/finance/credit-notes',
    name: 'finance.credit-notes',
    component: FinanceCreditNotesView,
    meta: { layout: StaffLayout, auth: true, permission: 'dashboard.finance' },
  },

  // Public Course Catalog
  {
    path: '/courses',
    name: 'courses.catalog',
    component: CourseCatalogView,
    meta: {
      layout: (auth) => (auth.isAuthenticated ? (auth.isStaff ? StaffLayout : StudentLayout) : GuestLayout),
    },
  },
  {
    path: '/courses/:slug',
    name: 'courses.detail',
    component: CourseDetailView,
    meta: {
      layout: (auth) => (auth.isAuthenticated ? (auth.isStaff ? StaffLayout : StudentLayout) : GuestLayout),
    },
  },

  // Public Certificate Verification
  {
    path: '/verify/:code',
    name: 'certificate.verify',
    component: CertificateVerificationView,
    meta: { layout: GuestLayout },
  },

  // Error States
  {
    path: '/403',
    name: 'forbidden',
    component: ForbiddenView,
    meta: { layout: GuestLayout },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { layout: GuestLayout },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// Route Guards
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Initialize session user on first navigation
  await auth.init()

  // 1. Guest-only guard
  if (to.meta.guest && auth.isAuthenticated) {
    return next(auth.homeRoute)
  }

  // 2. Auth guard
  if (to.meta.auth && !auth.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // 3. Permission guard
  if (to.meta.permission && !auth.can(to.meta.permission)) {
    return next({ name: 'forbidden' })
  }

  next()
})

export default router
