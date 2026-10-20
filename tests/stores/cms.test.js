import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCmsStore } from '@/stores/cms'
import http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('CMS Store Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches a public page by slug and sets currentPage', async () => {
    const store = useCmsStore()
    const mockPage = {
      id: 1,
      slug: 'home',
      title: 'Bariton Conservatory',
      category: 'landing',
      is_published: true,
      sections: {
        hero: { title: 'Welcome to Bariton' },
      },
    }

    http.get.mockResolvedValueOnce({ data: { data: mockPage } })

    const res = await store.fetchPage('home')
    expect(res.slug).toBe('home')
    expect(store.currentPage).toEqual(mockPage)
    expect(store.homeSections).toEqual({ hero: { title: 'Welcome to Bariton' } })
    expect(http.get).toHaveBeenCalledWith('/pages/home')
  })

  it('fetches list of public pages with category filter', async () => {
    const store = useCmsStore()
    const mockPages = [
      { id: 1, slug: 'about', title: 'About Us', is_published: true },
      { id: 2, slug: 'draft-page', title: 'Draft', is_published: false },
    ]

    http.get.mockResolvedValueOnce({ data: { data: mockPages } })

    const res = await store.fetchPages('general')
    expect(res).toHaveLength(2)
    expect(store.pagesList).toHaveLength(2)
    expect(store.publishedPages).toHaveLength(1)
    expect(store.publishedPages[0].slug).toBe('about')
    expect(http.get).toHaveBeenCalledWith('/pages', { params: { category: 'general' } })
  })

  it('submits a public contact inquiry successfully', async () => {
    const store = useCmsStore()
    const payload = {
      full_name: 'Ludwig Beethoven',
      email: 'ludwig@vienna.com',
      subject: 'Piano Audition Inquiry',
      message: 'I would like to inquire about masterclass auditions.',
    }

    http.post.mockResolvedValueOnce({
      data: {
        message: 'Thank you for reaching out.',
        inquiry_uuid: 'inq-12345',
      },
    })

    const res = await store.submitInquiry(payload)
    expect(res.inquiry_uuid).toBe('inq-12345')
    expect(store.inquirySuccess).toBe(true)
    expect(store.inquirySubmitting).toBe(false)
    expect(http.post).toHaveBeenCalledWith('/contact', payload)
  })

  it('handles submission error gracefully', async () => {
    const store = useCmsStore()
    http.post.mockRejectedValueOnce({
      response: { data: { message: 'The email field is required.' } },
    })

    await expect(store.submitInquiry({})).rejects.toBeDefined()
    expect(store.inquirySuccess).toBe(false)
    expect(store.error).toBe('The email field is required.')
  })

  it('fetches admin pages with pagination', async () => {
    const store = useCmsStore()
    const mockAdminResponse = {
      data: {
        data: {
          data: [
            { id: 1, slug: 'home', title: 'Homepage' },
            { id: 2, slug: 'about', title: 'About Us' },
          ],
          current_page: 1,
          last_page: 2,
          total: 25,
          per_page: 20,
        },
      },
    }

    http.get.mockResolvedValueOnce(mockAdminResponse)

    const pages = await store.fetchAdminPages({ search: 'home' })
    expect(pages).toHaveLength(2)
    expect(store.adminPages).toHaveLength(2)
    expect(store.adminPagination.total).toBe(25)
    expect(store.adminPagination.lastPage).toBe(2)
    expect(http.get).toHaveBeenCalledWith('/admin/cms/pages', { params: { search: 'home' } })
  })

  it('creates, updates and deletes admin pages', async () => {
    const store = useCmsStore()

    // 1. Create
    http.post.mockResolvedValueOnce({
      data: { data: { id: 3, slug: 'history', title: 'Our History' } },
    })
    const created = await store.createPage({ slug: 'history', title: 'Our History' })
    expect(created.id).toBe(3)

    // 2. Update
    http.put.mockResolvedValueOnce({
      data: { data: { id: 3, slug: 'history', title: 'Academy History Updated' } },
    })
    const updated = await store.updatePage(3, { title: 'Academy History Updated' })
    expect(updated.title).toBe('Academy History Updated')

    // 3. Delete
    store.adminPages = [{ id: 3, slug: 'history' }]
    http.delete.mockResolvedValueOnce({
      data: { message: 'Page deleted successfully.' },
    })
    await store.deletePage(3)
    expect(store.adminPages).toHaveLength(0)
  })

  it('fetches and updates contact inquiries', async () => {
    const store = useCmsStore()
    const mockInquiries = {
      data: {
        data: {
          data: [
            { id: 1, full_name: 'Wolfgang Mozart', status: 'pending' },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          per_page: 20,
        },
      },
    }

    http.get.mockResolvedValueOnce(mockInquiries)
    await store.fetchInquiries()
    expect(store.inquiries).toHaveLength(1)
    expect(store.inquiries[0].full_name).toBe('Wolfgang Mozart')

    // Update status
    http.put.mockResolvedValueOnce({
      data: {
        data: { id: 1, full_name: 'Wolfgang Mozart', status: 'resolved', admin_notes: 'Replied via phone.' },
      },
    })

    const updated = await store.updateInquiry(1, { status: 'resolved', admin_notes: 'Replied via phone.' })
    expect(updated.status).toBe('resolved')
    expect(store.inquiries[0].status).toBe('resolved')
  })
})
