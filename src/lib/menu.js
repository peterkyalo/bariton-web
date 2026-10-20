/**
 * Navigation items. Each item lists the permission it needs.
 * Menus are built from permissions, never from role names.
 */
export const MENU = [
  { section: 'Learn', label: 'My dashboard', to: { name: 'dashboard.student' }, icon: 'home', permission: 'dashboard.student' },

  { section: 'Teach', label: 'Instructor hub', to: { name: 'dashboard.instructor' }, icon: 'music', permission: 'dashboard.instructor' },

  { section: 'Finance', label: 'Finance overview', to: { name: 'dashboard.finance' }, icon: 'wallet', permission: 'dashboard.finance' },

  { section: 'Events', label: 'Events overview', to: { name: 'dashboard.coordinator' }, icon: 'calendar', permission: 'dashboard.coordinator' },

  { section: 'Administration', label: 'Admin overview', to: { name: 'dashboard.admin' }, icon: 'shield', permission: 'dashboard.admin' },
  { section: 'Administration', label: 'Users', to: { name: 'admin.users' }, icon: 'users', permission: 'users.view' },
  { section: 'Administration', label: 'Settings', to: { name: 'admin.settings' }, icon: 'sliders', permission: 'settings.view' },
  { section: 'Administration', label: 'Activity log', to: { name: 'admin.activity' }, icon: 'list', permission: 'activity-log.view' },
  { section: 'Administration', label: 'Notifications', to: { name: 'admin.notifications' }, icon: 'bell', permission: 'notifications.view' },
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
