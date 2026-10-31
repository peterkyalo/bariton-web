import { describe, it, expect } from 'vitest'
import {
  extractYouTubeId,
  getYouTubeThumbnail,
  estimateReadingTime,
  renderRichText,
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
  })
})
