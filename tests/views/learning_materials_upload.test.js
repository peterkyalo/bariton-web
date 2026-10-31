import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'
import MediaPanel from '@/components/ui/MediaPanel.vue'
import MaterialList from '@/components/ui/MaterialList.vue'
import PdfViewer from '@/components/ui/PdfViewer.vue'
import { useCoursesStore } from '@/stores/courses'

describe('Course & Module Rich Media + Learning Materials Frontend', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('RichTextEditor.vue', () => {
    it('renders write, split view, and preview mode tabs', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: '# Vocal Warmups\n\nSing descending 5-note scales on *mi-me-ma*.',
        },
      })

      expect(wrapper.text()).toContain('Write')
      expect(wrapper.text()).toContain('Split View')
      expect(wrapper.text()).toContain('Preview')
      expect(wrapper.text()).toContain('words')

      // Check textarea has the text
      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toContain('Vocal Warmups')
    })

    it('emits update:modelValue when text is typed', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: '',
        },
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('## Polyphonic Counterpoint')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['## Polyphonic Counterpoint'])
    })

    it('renders live HTML preview when switching to preview tab', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: '### Dynamics Guide\n\nPlay **pianissimo** with a light touch.',
        },
      })

      const buttons = wrapper.findAll('button')
      const previewBtn = buttons.find(b => b.text() === 'Preview')
      expect(previewBtn).toBeTruthy()
      await previewBtn.trigger('click')

      expect(wrapper.html()).toContain('pianissimo')
      expect(wrapper.html()).toContain('Dynamics Guide')
    })

    it('uploads an inline image via coursesStore.uploadEditorImage and inserts markdown image syntax', async () => {
      const coursesStore = useCoursesStore()
      vi.spyOn(coursesStore, 'uploadEditorImage').mockResolvedValue({
        url: '/storage/editor-images/2026/10/fingering-chart.png',
        markdown: '![fingering-chart](/storage/editor-images/2026/10/fingering-chart.png)',
      })

      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: 'Intro text',
        },
      })

      const imgBtn = wrapper.find('[data-testid="rte-image-btn"]')
      expect(imgBtn.exists()).toBe(true)

      const fileInput = wrapper.find('[data-testid="rte-image-input"]')
      const fakeFile = new File(['png-bytes'], 'fingering-chart.png', { type: 'image/png' })
      Object.defineProperty(fileInput.element, 'files', {
        value: [fakeFile],
      })

      await fileInput.trigger('change')
      await flushPromises()

      expect(coursesStore.uploadEditorImage).toHaveBeenCalledWith(fakeFile)
      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      const latestVal = emitted[emitted.length - 1][0]
      expect(latestVal).toContain('![fingering-chart](/storage/editor-images/2026/10/fingering-chart.png)')
    })
  })

  describe('MaterialList.vue', () => {
    it('renders YouTube videos, images, audio tracks, and inline scrollable PDF reader', async () => {
      const attachments = [
        {
          id: 1,
          uuid: 'att-yt',
          kind: 'youtube',
          title: 'Course Trailer Video',
          youtube_video_id: 'Mh4f9AYRCZY',
          embed_url: 'https://www.youtube.com/embed/Mh4f9AYRCZY',
        },
        {
          id: 2,
          uuid: 'att-img',
          kind: 'image',
          title: 'Fretboard Diagram',
          url: '/storage/attachments/fretboard.png',
        },
        {
          id: 3,
          uuid: 'att-aud',
          kind: 'audio',
          title: 'Backing Track in A Minor',
          file_name: 'backing.mp3',
          url: 'https://api.test/media/attachments/att-aud',
        },
        {
          id: 4,
          uuid: 'att-pdf',
          kind: 'pdf',
          title: 'Complete Syllabus Score PDF',
          file_name: 'syllabus.pdf',
          url: 'https://api.test/media/attachments/att-pdf',
        },
      ]

      const wrapper = mount(MaterialList, {
        props: {
          attachments,
          dark: true,
        },
      })

      expect(wrapper.text()).toContain('Course Trailer Video')
      expect(wrapper.find('iframe').attributes('src')).toContain('Mh4f9AYRCZY')
      expect(wrapper.text()).toContain('Fretboard Diagram')
      expect(wrapper.text()).toContain('Backing Track in A Minor')
      expect(wrapper.find('audio').attributes('src')).toBe('https://api.test/media/attachments/att-aud')
      expect(wrapper.text()).toContain('Complete Syllabus Score PDF')

      // Click "Open & Read PDF" inside MaterialList to open inline scrollable PDF reader
      const toggleBtn = wrapper.find('[data-testid="pdf-toggle-btn"]')
      expect(toggleBtn.exists()).toBe(true)
      await toggleBtn.trigger('click')

      const pdfIframe = wrapper.find('[data-testid="pdf-iframe"]')
      expect(pdfIframe.exists()).toBe(true)
      expect(pdfIframe.attributes('src')).toContain('https://api.test/media/attachments/att-pdf#toolbar=1&navpanes=1&scrollbar=1&view=FitH')
    })
  })

  describe('PdfViewer.vue', () => {
    it('supports defaultOpen inline reading and fullscreen modal reader', async () => {
      const wrapper = mount(PdfViewer, {
        props: {
          src: 'https://api.test/media/lessons/lesson-pdf-1',
          title: 'Bach Cello Suite No. 1 Score.pdf',
          fileSizeBytes: 512000,
          defaultOpen: true,
        },
        global: {
          stubs: {
            teleport: true,
          },
        },
      })

      // Inline iframe is immediately rendered when defaultOpen is true
      const inlineIframe = wrapper.find('[data-testid="pdf-iframe"]')
      expect(inlineIframe.exists()).toBe(true)
      expect(inlineIframe.attributes('src')).toContain('https://api.test/media/lessons/lesson-pdf-1#toolbar=1&navpanes=1&scrollbar=1&view=FitH')
      expect(wrapper.text()).toContain('500 KB')

      // Clicking Expand opens the fullscreen modal reader
      await wrapper.find('[data-testid="pdf-expand-btn"]').trigger('click')
      const fullscreenIframe = wrapper.find('[data-testid="pdf-fullscreen-iframe"]')
      expect(fullscreenIframe.exists()).toBe(true)
    })
  })

  describe('MediaPanel.vue', () => {
    it('displays cover image and allows adding a YouTube attachment to a course or module', async () => {
      const coursesStore = useCoursesStore()
      vi.spyOn(coursesStore, 'addAttachment').mockResolvedValue({
        id: 99,
        kind: 'youtube',
        title: 'Module 1 Overview',
        youtube_video_id: 'Mh4f9AYRCZY',
      })

      const wrapper = mount(MediaPanel, {
        props: {
          ownerType: 'module',
          owner: {
            id: 42,
            title: 'Beginner Fundamentals',
            image_url: '/storage/modules/covers/mod42.jpg',
            attachments: [],
          },
        },
      })

      expect(wrapper.text()).toContain('Module Image')
      expect(wrapper.find('img').attributes('src')).toBe('/storage/modules/covers/mod42.jpg')

      const inputs = wrapper.findAll('input[type="text"]')
      await inputs[0].setValue('Module 1 Overview')
      await wrapper.find('[data-testid="material-youtube"]').setValue('https://youtu.be/Mh4f9AYRCZY')

      await wrapper.find('[data-testid="add-material-btn"]').trigger('click')
      await flushPromises()

      expect(coursesStore.addAttachment).toHaveBeenCalledTimes(1)
      expect(wrapper.emitted('changed')).toBeTruthy()
    })
  })
})

