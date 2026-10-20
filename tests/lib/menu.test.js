import { describe, it, expect } from 'vitest'
import { buildMenu, homeRouteFor } from '@/lib/menu'

describe('Menu Builder', () => {
  it('returns empty array when user has no permissions', () => {
    const menu = buildMenu([])
    expect(menu).toEqual([])
  })

  it('builds student menu with only student allowed items', () => {
    const menu = buildMenu(['dashboard.student'])
    expect(menu.length).toBe(1)
    expect(menu[0].title).toBe('Learn')
    expect(menu[0].items[0].label).toBe('My dashboard')
  })

  it('builds finance staff menu with only finance items', () => {
    const menu = buildMenu(['dashboard.finance'])
    expect(menu.length).toBe(1)
    expect(menu[0].title).toBe('Finance')
    expect(menu[0].items[0].label).toBe('Finance overview')
  })

  it('builds instructor menu with courses item when having courses.teach', () => {
    const menu = buildMenu(['dashboard.instructor', 'courses.teach'])
    expect(menu.length).toBe(1)
    expect(menu[0].title).toBe('Teach')
    expect(menu[0].items.map(i => i.label)).toEqual(['Instructor hub', 'My Courses', 'Grading Studio', 'Exam Grading Studio'])
  })

  it('builds admin menu with courses & curriculum when having courses.manage-all', () => {
    const menu = buildMenu(['dashboard.admin', 'courses.manage-all'])
    expect(menu.length).toBe(1)
    expect(menu[0].title).toBe('Administration')
    expect(menu[0].items.map(i => i.label)).toContain('Courses & Curriculum')
  })

  it('resolves home landing route in proper role precedence order', () => {
    expect(homeRouteFor(['dashboard.admin'])).toEqual({ name: 'dashboard.admin' })
    expect(homeRouteFor(['dashboard.finance'])).toEqual({ name: 'dashboard.finance' })
    expect(homeRouteFor(['dashboard.coordinator'])).toEqual({ name: 'dashboard.coordinator' })
    expect(homeRouteFor(['dashboard.instructor'])).toEqual({ name: 'dashboard.instructor' })
    expect(homeRouteFor(['dashboard.student'])).toEqual({ name: 'dashboard.student' })
    expect(homeRouteFor([])).toEqual({ name: 'profile' })
  })
})
