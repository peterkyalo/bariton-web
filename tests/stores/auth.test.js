import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('evaluates permissions correctly with can()', () => {
    const auth = useAuthStore()
    auth.user = {
      id: 1,
      name: 'Test Student',
      permissions: ['dashboard.student'],
      roles: ['student'],
    }

    expect(auth.can('dashboard.student')).toBe(true)
    expect(auth.can('users.view')).toBe(false)
    expect(auth.can(['dashboard.student'])).toBe(true)
    expect(auth.can(['dashboard.student', 'users.create'])).toBe(false)
  })

  it('resolves home route based on dashboard priority', () => {
    const auth = useAuthStore()

    // Student
    auth.user = { permissions: ['dashboard.student'] }
    expect(auth.homeRoute).toEqual({ name: 'dashboard.student' })

    // Finance staff
    auth.user = { permissions: ['dashboard.finance'] }
    expect(auth.homeRoute).toEqual({ name: 'dashboard.finance' })

    // Admin
    auth.user = { permissions: ['dashboard.admin', 'users.view', 'settings.view'] }
    expect(auth.homeRoute).toEqual({ name: 'dashboard.admin' })
  })

  it('filters navigation menu strictly according to user permissions', () => {
    const auth = useAuthStore()

    // Student should only see Learn section
    auth.user = { permissions: ['dashboard.student'] }
    const studentMenu = auth.menu
    expect(studentMenu.length).toBe(1)
    expect(studentMenu[0].title).toBe('Learn')
    expect(studentMenu[0].items[0].label).toBe('My dashboard')

    // Admin should see Admin section with user & settings items
    auth.user = {
      permissions: ['dashboard.admin', 'users.view', 'settings.view', 'activity-log.view', 'notifications.view'],
    }
    const adminMenu = auth.menu
    expect(adminMenu.some((s) => s.title === 'Administration')).toBe(true)
    const adminSection = adminMenu.find((s) => s.title === 'Administration')
    expect(adminSection.items.some((i) => i.label === 'Users')).toBe(true)
    expect(adminSection.items.some((i) => i.label === 'Settings')).toBe(true)
  })

  it('identifies when two factor setup is required for staff roles', () => {
    const auth = useAuthStore()

    auth.user = {
      two_factor_required: true,
      two_factor_enabled: false,
    }
    expect(auth.needsTwoFactorSetup).toBe(true)

    auth.user.two_factor_enabled = true
    expect(auth.needsTwoFactorSetup).toBe(false)
  })
})
