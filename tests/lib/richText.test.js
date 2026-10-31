import { describe, it, expect } from 'vitest'
import {
  extractYouTubeId,
  getYouTubeThumbnail,
  estimateReadingTime,
  sanitizeHtml,
  renderRichText,
  resolveMediaUrl,
  extractFirstImageUrl,
  stripRichTextToPlain,
} from '@/lib/richText'

describe('richText utility tests', () => {
  describe('extractYouTubeId', () => {
    it('returns raw 11-char ID untouched', () => {
      expect(extractYouTubeId('Mh4f9AYRCZY')).toBe('Mh4f9AYRCZY')
      expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('extracts ID from standard watch URL', () => {
      expect(extractYouTubeId('https://www.youtube.com/watch?v=Mh4f9AYRCZY')).toBe('Mh4f9AYRCZY')
      expect(extractYouTubeId('https://youtube.com/watch?v=Mh4f9AYRCZY&t=120s')).toBe('Mh4f9AYRCZY')
    })

    it('extracts ID from youtu.be short URL', () => {
      expect(extractYouTubeId('https://youtu.be/Mh4f9AYRCZY')).toBe('Mh4f9AYRCZY')
      expect(extractYouTubeId('https://youtu.be/Mh4f9AYRCZY?si=xyz123')).toBe('Mh4f9AYRCZY')
    })

    it('extracts ID from embed and shorts URLs', () => {
      expect(extractYouTubeId('https://www.youtube.com/embed/Mh4f9AYRCZY')).toBe('Mh4f9AYRCZY')
      expect(extractYouTubeId('https://www.youtube.com/shorts/Mh4f9AYRCZY')).toBe('Mh4f9AYRCZY')
    })

    it('strips trailing query or playlist params from raw 11-char IDs', () => {
      expect(extractYouTubeId('vlHpWvsW040&list')).toBe('vlHpWvsW040')
      expect(extractYouTubeId('vlHpWvsW040&list=RDvlHpWvsW040')).toBe('vlHpWvsW040')
      expect(extractYouTubeId('vlHpWvsW040?si=abc123')).toBe('vlHpWvsW040')
    })

    it('handles empty or invalid inputs gracefully', () => {
      expect(extractYouTubeId('')).toBe('')
      expect(extractYouTubeId(null)).toBe('')
    })
  })

  describe('getYouTubeThumbnail', () => {
    it('returns high/medium quality thumbnail URL', () => {
      expect(getYouTubeThumbnail('Mh4f9AYRCZY')).toBe('https://img.youtube.com/vi/Mh4f9AYRCZY/mqdefault.jpg')
      expect(getYouTubeThumbnail('https://youtu.be/Mh4f9AYRCZY', 'hqdefault')).toBe('https://img.youtube.com/vi/Mh4f9AYRCZY/hqdefault.jpg')
    })
  })

  describe('estimateReadingTime', () => {
    it('calculates words and reading minutes correctly', () => {
      const shortText = 'One two three four five six seven eight nine ten.'
      const res = estimateReadingTime(shortText)
      expect(res.words).toBe(10)
      expect(res.minutes).toBe(1)

      const words250 = new Array(250).fill('music').join(' ')
      const res250 = estimateReadingTime(words250)
      expect(res250.words).toBe(250)
      expect(res250.minutes).toBe(2)
    })
  })

  describe('renderRichText', () => {
    it('renders Markdown headings, bold, lists and callouts into clean HTML', () => {
      const markdown = `# Classical Piano Masterclass\n\n## Harmonic Analysis\n\nPractice **legato** and *staccato* with precision.\n\n- Scale in C Major\n- Arpeggio in G Major\n\n> [!NOTE] Keep your wrists relaxed.`
      const html = renderRichText(markdown, { dark: true })

      expect(html).toContain('<h1')
      expect(html).toContain('Classical Piano Masterclass')
      expect(html).toContain('<h2')
      expect(html).toContain('Harmonic Analysis')
      expect(html).toContain('<strong')
      expect(html).toContain('legato')
      expect(html).toContain('<em>staccato</em>')
      expect(html).toContain('<li')
      expect(html).toContain('Scale in C Major')
      expect(html).toContain('Keep your wrists relaxed')
    })

    it('renders Markdown inline images into figure and img elements', () => {
      const markdown = 'Look at the fretboard diagram:\n\n![C Major Chord](/storage/editor-images/chord.png)'
      const html = renderRichText(markdown, { dark: true })
      expect(html).toContain('<img src="/storage/editor-images/chord.png"')
      expect(html).toContain('alt="C Major Chord"')
    })

    it('sanitizes dangerous script tags and event handlers in HTML input', () => {
      const unsafe = '<p onclick="evil()">Safe paragraph</p><script>alert(1)</script><img src="/storage/a.png" onerror="alert(2)">'
      const clean = sanitizeHtml(unsafe)
      expect(clean).toContain('Safe paragraph')
      expect(clean).not.toContain('<script')
      expect(clean).not.toContain('onclick')
      expect(clean).not.toContain('onerror')
    })

    it('properly formats CRLF (\\r\\n) bold paragraphs and numbered lists into <ol><li> elements', () => {
      const crlfContent = '**Lorem ipsum dolor sit amet**. Quisque faucibus.\r\n\r\n1. First violin exercise.\r\n2. Second bowing exercise.\r\n\r\nFinal paragraph.'
      const html = renderRichText(crlfContent, { dark: true })
      expect(html).toContain('<strong')
      expect(html).toContain('Lorem ipsum dolor sit amet')
      expect(html).toContain('<ol')
      expect(html).toContain('<li')
      expect(html).toContain('First violin exercise.')
      expect(html).toContain('Second bowing exercise.')
    })

    it('resolves relative storage paths and portless localhost storage URLs via resolveMediaUrl', () => {
      expect(resolveMediaUrl('course-covers/test.png')).toContain('/storage/course-covers/test.png')
      expect(resolveMediaUrl('http://localhost/storage/editor-images/pic.jpg')).toContain(':8000/storage/editor-images/pic.jpg')
    })

    it('extracts first inline image URL and strips rich text to plain summary', () => {
      const md = 'Intro paragraph\n\n![Guitar](http://localhost:8000/storage/editor-images/guitar.jpg)\n\nMore **bold** text.'
      expect(extractFirstImageUrl(md)).toBe('http://localhost:8000/storage/editor-images/guitar.jpg')
      expect(stripRichTextToPlain(md)).toBe('Intro paragraph More bold text.')
    })
  })
})

