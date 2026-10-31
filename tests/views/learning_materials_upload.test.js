import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'

describe('Course Learning Materials Frontend Enhancement', () => {
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

      // Click Preview button
      const buttons = wrapper.findAll('button')
      const previewBtn = buttons.find(b => b.text() === 'Preview')
      expect(previewBtn).toBeTruthy()
      await previewBtn.trigger('click')

      expect(wrapper.html()).toContain('pianissimo')
      expect(wrapper.html()).toContain('Dynamics Guide')
    })
  })
})

