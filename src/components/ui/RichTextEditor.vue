<template>
  <div class="rich-text-editor rounded-xl border border-slate-700 bg-navy-950 overflow-hidden flex flex-col">
    <!-- Top Bar: Mode Tabs & Reading Stats -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-navy-900/80">
      <div class="flex items-center gap-1 bg-navy-950/80 p-0.5 rounded-lg border border-slate-800">
        <button
          type="button"
          :class="[
            'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer',
            mode === 'write' ? 'bg-gold-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          ]"
          @click="mode = 'write'"
        >
          Write
        </button>
        <button
          type="button"
          :class="[
            'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer',
            mode === 'split' ? 'bg-gold-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          ]"
          @click="mode = 'split'"
        >
          Split View
        </button>
        <button
          type="button"
          :class="[
            'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer',
            mode === 'preview' ? 'bg-gold-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          ]"
          @click="mode = 'preview'"
        >
          Preview
        </button>
      </div>

      <div class="flex items-center gap-2 text-[11px] text-slate-400">
        <span>{{ readingStats.words }} words</span>
        <span>·</span>
        <span class="text-gold-400">{{ readingStats.minutes }} min read</span>
      </div>
    </div>

    <!-- Formatting Toolbar (Visible in 'write' and 'split' modes) -->
    <div
      v-if="mode !== 'preview'"
      class="flex flex-wrap items-center gap-1 p-2 border-b border-slate-800 bg-navy-900/40 text-slate-300 text-xs"
    >
      <!-- Headings -->
      <button
        type="button"
        title="Heading 1"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-bold cursor-pointer"
        @click="insertLinePrefix('# ')"
      >
        H1
      </button>
      <button
        type="button"
        title="Heading 2"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-bold cursor-pointer"
        @click="insertLinePrefix('## ')"
      >
        H2
      </button>
      <button
        type="button"
        title="Heading 3"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-bold cursor-pointer"
        @click="insertLinePrefix('### ')"
      >
        H3
      </button>

      <span class="w-px h-4 bg-slate-800 mx-1"></span>

      <!-- Bold / Italic / Strikethrough -->
      <button
        type="button"
        title="Bold"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-bold cursor-pointer"
        @click="wrapSelection('**', '**')"
      >
        B
      </button>
      <button
        type="button"
        title="Italic"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white italic cursor-pointer"
        @click="wrapSelection('*', '*')"
      >
        I
      </button>
      <button
        type="button"
        title="Strikethrough"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white line-through cursor-pointer"
        @click="wrapSelection('~~', '~~')"
      >
        S
      </button>

      <span class="w-px h-4 bg-slate-800 mx-1"></span>

      <!-- Lists -->
      <button
        type="button"
        title="Bullet list"
        class="p-1.5 rounded hover:bg-slate-800 hover:text-white cursor-pointer"
        @click="insertList(false)"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        title="Numbered list"
        class="p-1.5 rounded hover:bg-slate-800 hover:text-white cursor-pointer"
        @click="insertList(true)"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </button>

      <span class="w-px h-4 bg-slate-800 mx-1"></span>

      <!-- Quote / Callout -->
      <button
        type="button"
        title="Blockquote"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-serif cursor-pointer"
        @click="insertLinePrefix('> ')"
      >
        &ldquo;
      </button>
      <button
        type="button"
        title="Note Box"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-gold-300 font-semibold text-[11px] cursor-pointer"
        @click="insertLinePrefix('> [!NOTE] ')"
      >
        + Note
      </button>

      <span class="w-px h-4 bg-slate-800 mx-1"></span>

      <!-- Code block -->
      <button
        type="button"
        title="Code block"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-mono text-xs cursor-pointer"
        @click="wrapSelection('```\n', '\n```')"
      >
        &lt;/&gt;
      </button>

      <!-- Image upload -->
      <button
        v-if="allowImages"
        type="button"
        title="Upload & insert image"
        :disabled="uploadingImage"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-50 flex items-center gap-1 cursor-pointer"
        data-testid="rte-image-btn"
        @click="imageInput?.click()"
      >
        <svg v-if="!uploadingImage" class="w-3.5 h-3.5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-[11px] font-semibold">{{ uploadingImage ? 'Uploading...' : 'Image' }}</span>
      </button>
      <input
        v-if="allowImages"
        ref="imageInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        data-testid="rte-image-input"
        @change="handleImageSelected"
      />

      <!-- Link -->
      <button
        type="button"
        title="Insert Link"
        class="p-1.5 rounded hover:bg-slate-800 hover:text-white cursor-pointer"
        @click="insertLink"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>

      <!-- Divider -->
      <button
        type="button"
        title="Horizontal rule"
        class="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-bold text-xs cursor-pointer"
        @click="insertFormat('\n---\n', '')"
      >
        &mdash;
      </button>
    </div>

    <!-- Editor Stage -->
    <p v-if="imageError" class="px-3 py-1.5 text-[11px] text-red-400 bg-red-500/10 border-b border-red-500/20">{{ imageError }}</p>
    <div :class="['grid', mode === 'split' ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800' : 'grid-cols-1']">
      <!-- Text Area (Write / Split) -->
      <div v-show="mode !== 'preview'" class="relative">
        <textarea
          ref="textareaRef"
          :value="modelValue"
          :placeholder="placeholder"
          :rows="rows"
          class="w-full max-h-[280px] overflow-y-auto p-4 bg-navy-950 text-slate-100 text-xs sm:text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-gold-500/50"
          @input="handleInput"
          @keydown="handleKeydown"
        ></textarea>
      </div>

      <!-- Live Rendered Preview (Always visible below in 'write' mode when content exists, or side-by-side in 'split' / full in 'preview') -->
      <div
        v-show="mode !== 'write' || (modelValue && modelValue.trim().length > 0)"
        :class="[
          'p-5 overflow-y-auto bg-navy-900/30',
          mode === 'write' ? 'border-t border-slate-800 max-h-[260px]' : '',
          mode === 'preview' ? 'min-h-[260px] max-h-[420px]' : 'max-h-[420px]'
        ]"
        data-testid="rte-live-preview"
      >
        <div v-if="mode === 'write'" class="text-[10px] font-bold uppercase tracking-wider text-gold-400 mb-2 flex items-center justify-between">
          <span>Live Formatted &amp; Media Preview</span>
        </div>
        <div v-if="!modelValue?.trim()" class="text-xs text-slate-500 italic py-8 text-center">
          No content written yet. Switch to "Write" mode to compose learning material.
        </div>
        <div v-else class="prose prose-invert rich-text-content max-w-none text-xs sm:text-sm">
          <div v-html="renderedHtml"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { renderRichText, estimateReadingTime } from '@/lib/richText'
import { useCoursesStore } from '@/stores/courses'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Write comprehensive instructional lesson content, sheet music guidance, harmonic analysis, or rehearsal notes here...',
  },
  rows: {
    type: Number,
    default: 10,
  },
  allowImages: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const coursesStore = useCoursesStore()
const textareaRef = ref(null)
const imageInput = ref(null)
const uploadingImage = ref(false)
const imageError = ref('')
const mode = ref('write') // 'write', 'split', 'preview'

const readingStats = computed(() => estimateReadingTime(props.modelValue))
const renderedHtml = computed(() => renderRichText(props.modelValue, { dark: true }))

async function handleImageSelected(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  imageError.value = ''
  uploadingImage.value = true
  try {
    const { url } = await coursesStore.uploadEditorImage(file)
    const alt = file.name.replace(/\.[^.]+$/, '').replace(/[\[\]()]/g, '')
    insertFormat(`\n![${alt}](${url})\n`, '')
  } catch (err) {
    const errors = err.response?.data?.errors
    imageError.value = (errors && Object.values(errors)[0]?.[0]) || err.response?.data?.message || 'Image upload failed.'
  } finally {
    uploadingImage.value = false
  }
}

function handleInput(e) {
  emit('update:modelValue', e.target.value)
}

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    wrapSelection('**', '**')
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault()
    wrapSelection('*', '*')
  }
}

function wrapSelection(prefix, suffix) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const val = props.modelValue || ''
  const selected = val.substring(start, end)

  const replacement = `${prefix}${selected || 'text'}${suffix}`
  const newVal = val.substring(0, start) + replacement + val.substring(end)
  emit('update:modelValue', newVal)

  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4))
  }, 0)
}

function insertLinePrefix(prefix) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const val = props.modelValue || ''

  // Find start of the current line
  const lineStart = val.lastIndexOf('\n', start - 1) + 1
  const beforeLine = val.substring(0, lineStart)
  const selectedOrRest = val.substring(lineStart, end)
  const after = val.substring(end)

  // Toggle or replace existing heading/quote prefix on the line
  const cleanedLine = selectedOrRest.replace(/^(#{1,3}\s+|>\s*(\[!NOTE\]\s*)?)/, '')
  const newVal = `${beforeLine}${prefix}${cleanedLine}${after}`
  emit('update:modelValue', newVal)

  setTimeout(() => {
    textarea.focus()
    const newCursor = beforeLine.length + prefix.length + cleanedLine.length
    textarea.setSelectionRange(newCursor, newCursor)
  }, 0)
}

function insertList(ordered = false) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const val = props.modelValue || ''

  const lineStart = val.lastIndexOf('\n', start - 1) + 1
  const lineEndIdx = val.indexOf('\n', end)
  const lineEnd = lineEndIdx === -1 ? val.length : lineEndIdx

  const before = val.substring(0, lineStart)
  const targetBlock = val.substring(lineStart, lineEnd)
  const after = val.substring(lineEnd)

  const rawLines = targetBlock.split(/\r?\n/)
  let itemNum = 1
  const formattedLines = rawLines.map((line) => {
    const clean = line.replace(/^([-*]\s+|\d+\.\s+)/, '').trim()
    if (!clean && rawLines.length > 1) return ''
    const marker = ordered ? `${itemNum++}. ` : '- '
    return `${marker}${clean || 'List item'}`
  })

  const replacement = formattedLines.join('\n')
  const needsLeadingNewline = before.length > 0 && !before.endsWith('\n\n') ? '\n' : ''
  const newVal = `${before}${needsLeadingNewline}${replacement}${after}`
  emit('update:modelValue', newVal)

  setTimeout(() => {
    textarea.focus()
    const pos = before.length + needsLeadingNewline.length + replacement.length
    textarea.setSelectionRange(pos, pos)
  }, 0)
}

function insertFormat(prefix, suffix = '') {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const val = props.modelValue || ''
  const selected = val.substring(start, end)

  const replacement = `${prefix}${selected}${suffix}`
  const newVal = val.substring(0, start) + replacement + val.substring(end)
  emit('update:modelValue', newVal)

  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + prefix.length + selected.length, start + prefix.length + selected.length)
  }, 0)
}

function insertLink() {
  const url = prompt('Enter destination URL:', 'https://')
  if (!url) return
  const label = prompt('Enter link text:', 'Resource reference') || url
  insertFormat(`[${label}](${url})`, '')
}
</script>

<style scoped>
.rich-text-editor :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
}
.rich-text-editor :deep(h1) {
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.25rem;
}
.rich-text-editor :deep(h2) {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fbbf24;
  margin-top: 0.85rem;
  margin-bottom: 0.4rem;
}
.rich-text-editor :deep(h3) {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
}
.rich-text-editor :deep(p) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.6;
}
.rich-text-editor :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
.rich-text-editor :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
.rich-text-editor :deep(li) {
  display: list-item;
  margin: 0.25rem 0;
}
</style>
