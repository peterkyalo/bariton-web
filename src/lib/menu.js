/**
 * Navigation items. Each item lists the permission it needs.
 * Menus are built from permissions, never from role names.
 */
export const MENU = [
  { section: 'Learn', label: 'My dashboard', to: { name: 'dashboard.student' }, icon: 'home', permission: 'dashboard.student' },
  { section: 'Learn', label: '1-on-1 Tutoring Sessions', to: { name: 'student-tutoring' }, icon: 'music', permission: 'tutoring.book' },
  { section: 'Learn', label: 'My Bootcamps & Workshops', to: { name: 'student-event-bookings' }, icon: 'calendar', permission: 'events.book' },
  { section: 'Learn', label: 'My Orders & Receipts', to: { name: 'student.orders' }, icon: 'receipt', permission: 'courses.enroll' },
  { section: 'Learn', label: 'My Certificates', to: { name: 'student.certificates' }, icon: 'shield', permission: 'courses.enroll' },

  { section: 'Teach', label: 'Instructor hub', to: { name: 'dashboard.instructor' }, icon: 'music', permission: 'dashboard.instructor' },
  { section: 'Teach', label: 'Tutoring Studio & Hours', to: { name: 'instructor-tutoring-schedule' }, icon: 'calendar', permission: 'tutoring.manage-availability' },
  { section: 'Teach', label: 'My Courses', to: { name: 'instructor.courses' }, icon: 'music', permission: 'courses.teach' },
  { section: 'Teach', label: 'Grading Studio', to: { name: 'instructor.grading' }, icon: 'layers', permission: 'courses.teach' },
  { section: 'Teach', label: 'Exam Grading Studio', to: { name: 'instructor.exam-grading' }, icon: 'layers', permission: 'courses.teach' },

  { section: 'Finance', label: 'Finance overview', to: { name: 'dashboard.finance' }, icon: 'wallet', permission: 'dashboard.finance' },
  { section: 'Finance', label: 'Cash Reception', to: { name: 'finance.cash' }, icon: 'cash', permission: 'dashboard.finance' },
  { section: 'Finance', label: 'Payment Ledger', to: { name: 'finance.payments' }, icon: 'list', permission: 'dashboard.finance' },
  { section: 'Finance', label: 'Refund Requests', to: { name: 'finance.refunds' }, icon: 'layers', permission: 'dashboard.finance' },
  { section: 'Finance', label: 'Event Refunds', to: { name: 'finance.event-refunds' }, icon: 'calendar', permission: 'dashboard.finance' },
  { section: 'Finance', label: 'Credit Notes', to: { name: 'finance.credit-notes' }, icon: 'receipt', permission: 'dashboard.finance' },

  { section: 'Events', label: 'Events overview', to: { name: 'dashboard.coordinator' }, icon: 'calendar', permission: 'dashboard.coordinator' },
  { section: 'Events', label: 'Cohort Events Manager', to: { name: 'coordinator-events-manage' }, icon: 'calendar', permission: 'events.manage' },
  { section: 'Events', label: 'Attendee Check-In Roster', to: { name: 'coordinator-events' }, icon: 'users', permission: 'events.manage' },
  { section: 'Events', label: 'Public Events Schedule', to: { name: 'events-catalog' }, icon: 'calendar', permission: 'events.view' },
  { section: 'Events', label: '1-on-1 Mentorship Packs', to: { name: 'tutoring-packages' }, icon: 'music', permission: 'tutoring.view' },

  { section: 'Administration', label: 'Admin overview', to: { name: 'dashboard.admin' }, icon: 'shield', permission: 'dashboard.admin' },
  { section: 'Administration', label: 'Courses & Curriculum', to: { name: 'admin.courses' }, icon: 'layers', permission: 'courses.manage-all' },
  { section: 'Administration', label: 'Tutoring Packages', to: { name: 'admin.tutoring.packages' }, icon: 'layers', permission: 'tutoring.manage-packages' },
  { section: 'Administration', label: 'Certificates Registry', to: { name: 'admin.certificates' }, icon: 'shield', permission: 'courses.manage-all' },
  { section: 'Administration', label: 'Users', to: { name: 'admin.users' }, icon: 'users', permission: 'users.view' },
  { section: 'Administration', label: 'Settings', to: { name: 'admin.settings' }, icon: 'sliders', permission: 'settings.view' },
  { section: 'Administration', label: 'Activity log', to: { name: 'admin.activity' }, icon: 'list', permission: 'activity-log.view' },
  { section: 'Administration', label: 'Notifications Log', to: { name: 'admin.notifications' }, icon: 'bell', permission: 'notifications.view' },
  { section: 'Administration', label: 'Message Templates', to: { name: 'admin.notification-templates' }, icon: 'layers', permission: 'notifications.view' },
  { section: 'Administration', label: 'CMS Website Pages', to: { name: 'admin.cms.pages' }, icon: 'layers', permission: 'settings.view' },
  { section: 'Administration', label: 'Contact Inquiries', to: { name: 'admin.cms.inquiries' }, icon: 'bell', permission: 'settings.view' },
]

/** Order used to pick a user's landing dashboard. */
export const DASHBOARD_PRIORITY = [
  ['dashboard.admin', 'dashboard.admin'],
  ['dashboard.finance', 'dashboard.finance'],
  ['dashboard.coordinator', 'dashboard.coordinator'],
  ['dashboard.instructor', 'dashboard.instructor'],
  ['dashboard.student', 'dashboard.student'],
]

export function buildMenu(permissions = []) {
  const allowed = new Set(permissions)
  const sections = []
  for (const item of MENU) {
    if (item.permission && !allowed.has(item.permission)) continue
    let section = sections.find((s) => s.title === item.section)
    if (!section) {
      section = { title: item.section, items: [] }
      sections.push(section)
    }
    section.items.push(item)
  }
  return sections
}

export function homeRouteFor(permissions = []) {
  const allowed = new Set(permissions)
  const match = DASHBOARD_PRIORITY.find(([permission]) => allowed.has(permission))
  return match ? { name: match[1] } : { name: 'profile' }
}
