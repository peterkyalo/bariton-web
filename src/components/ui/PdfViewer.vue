<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Modal from './Modal.vue'

// Ensure ES2024/ES2025 helpers used by PDF.js exist in all browser versions
if (typeof Uint8Array !== 'undefined' && typeof Uint8Array.prototype.toHex !== 'function') {
  Uint8Array.prototype.toHex = function () {
    let hex = ''
    for (let i = 0; i < this.length; i++) {
      hex += this[i].toString(16).padStart(2, '0')
    }
    return hex
  }
}

if (typeof Promise !== 'undefined' && typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function () {
    let resolve, reject
    const promise = new this((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

if (typeof URL !== 'undefined' && typeof URL.parse !== 'function') {
  URL.parse = function (url, base) {
    try {
      return base !== undefined ? new URL(url, base) : new URL(url)
    } catch (_) {
      return null
    }
  }
}

const props = defineProps({
  src: { type: String, required: true },
  title: { type: String, default: 'PDF Course Material' },
  fileSizeBytes: { type: Number, default: 0 },
  dark: { type: Boolean, default: true },
  defaultOpen: { type: Boolean, default: false },
  heightClass: { type: String, default: 'h-[640px]' },
})

const isJsdom =
  typeof navigator !== 'undefined' &&
  typeof navigator.userAgent === 'string' &&
  navigator.userAgent.toLowerCase().includes('jsdom')

const isOpen = ref(props.defaultOpen)
const isFullscreen = ref(false)
const loadingPdf = ref(false)
const pdfError = ref('')
const pageCount = ref(0)
const currentPage = ref(1)
const pageImages = ref({})
const pageDimensions = ref({})
const pageTexts = ref({})
const viewMode = ref('canvas') // 'canvas' | 'text'
const zoomPercent = ref(115)
const useFallbackIframe = ref(isJsdom)
const localBlobUrl = ref('')

const inlineScrollRef = ref(null)
const fullscreenScrollRef = ref(null)

let pdfDocInstance = null
let loadGeneration = 0
let renderGeneration = 0
let isQueueRunning = false
const priorityPagesQueue = []

const formattedSize = computed(() => {
  if (!props.fileSizeBytes) return ''
  if (props.fileSizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(props.fileSizeBytes / 1024))} KB`
  }
  return `${(props.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
})

const viewerSrc = computed(() => {
  const base = localBlobUrl.value || props.src
  if (!base) return ''
  if (base.includes('#')) return base
  return `${base}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`
})

const defaultPageSize = computed(() => {
  const firstDim = pageDimensions.value[1]
  const scaleRatio = zoomPercent.value / 115
  if (firstDim) {
    return {
      width: Math.round(firstDim.width * scaleRatio),
      height: Math.round(firstDim.height * scaleRatio),
    }
  }
  return {
    width: Math.round(700 * scaleRatio),
    height: Math.round(906 * scaleRatio),
  }
})

function getPageDisplayStyle(pageNum, isFull = false) {
  const dim = pageDimensions.value[pageNum] || defaultPageSize.value
  const mult = isFull ? 1.08 : 1
  return {
    width: `${Math.round(dim.width * mult)}px`,
    minHeight: `${Math.round(dim.height * mult)}px`,
  }
}

async function renderPageToDataUrl(pageNum, gen) {
  if (!pdfDocInstance || gen !== renderGeneration) return
  if (pageImages.value[pageNum]) return

  try {
    const page = await pdfDocInstance.getPage(pageNum)
    if (gen !== renderGeneration) return

    const baseScale = (zoomPercent.value / 100) * 1.15
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1.5, 2) : 1.5
    const viewport = page.getViewport({ scale: baseScale * dpr })
    const cssWidth = Math.max(1, Math.floor(viewport.width / dpr))
    const cssHeight = Math.max(1, Math.floor(viewport.height / dpr))

    pageDimensions.value = {
      ...pageDimensions.value,
      [pageNum]: { width: cssWidth, height: cssHeight },
    }

    // Always use a dedicated offscreen canvas per render so PDF.js never hits canvasInUse conflicts
    const offscreen = document.createElement('canvas')
    offscreen.width = Math.max(1, Math.floor(viewport.width))
    offscreen.height = Math.max(1, Math.floor(viewport.height))
    const ctx = offscreen.getContext('2d', { alpha: false })
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, offscreen.width, offscreen.height)

    const renderTask = page.render({
      canvasContext: ctx,
      canvas: offscreen,
      viewport,
    })
    await renderTask.promise
    if (gen !== renderGeneration) return

    const dataUrl = offscreen.toDataURL('image/jpeg', 0.92)
    // Release offscreen canvas memory immediately
    offscreen.width = 1
    offscreen.height = 1

    pageImages.value = {
      ...pageImages.value,
      [pageNum]: dataUrl,
    }
  } catch (_) {
    // Ignore cancelled page render
  }
}

async function extractSinglePageText(pageNum, gen) {
  if (!pdfDocInstance || gen !== loadGeneration) return
  if (pageTexts.value[pageNum]) return

  try {
    const page = await pdfDocInstance.getPage(pageNum)
    const textContent = await page.getTextContent()
    const rows = []
    let currentY = null
    let currentLine = []

    for (const item of textContent.items || []) {
      const str = (item.str || '').trim()
      if (!str) continue
      const y = Array.isArray(item.transform) ? Math.round(item.transform[5] / 4) * 4 : 0
      if (currentY === null || Math.abs(y - currentY) <= 4) {
        currentLine.push(str)
        if (currentY === null) currentY = y
      } else {
        if (currentLine.length > 0) {
          rows.push(currentLine.join(' '))
        }
        currentLine = [str]
        currentY = y
      }
    }
    if (currentLine.length > 0) {
      rows.push(currentLine.join(' '))
    }

    pageTexts.value = {
      ...pageTexts.value,
      [pageNum]: rows,
    }
  } catch (_) {
    pageTexts.value = {
      ...pageTexts.value,
      [pageNum]: [],
    }
  }
}

function enqueuePagesAround(centerPage, radius = 4) {
  if (!pageCount.value) return
  const total = pageCount.value
  const candidates = [centerPage]
  for (let offset = 1; offset <= radius; offset++) {
    if (centerPage + offset <= total) candidates.push(centerPage + offset)
    if (centerPage - offset >= 1) candidates.push(centerPage - offset)
  }

  for (let i = candidates.length - 1; i >= 0; i--) {
    const p = candidates[i]
    if (!pageImages.value[p]) {
      const existingIdx = priorityPagesQueue.indexOf(p)
      if (existingIdx !== -1) priorityPagesQueue.splice(existingIdx, 1)
      priorityPagesQueue.unshift(p)
    }
  }

  processRenderQueue()
}

async function processRenderQueue() {
  if (isQueueRunning || !pdfDocInstance) return
  isQueueRunning = true
  const currentGen = renderGeneration
  const currentLoad = loadGeneration

  try {
    while (priorityPagesQueue.length > 0 && currentGen === renderGeneration && pdfDocInstance) {
      const nextPage = priorityPagesQueue.shift()
      if (!nextPage || nextPage < 1 || nextPage > pageCount.value) continue

      if (viewMode.value === 'text') {
        await extractSinglePageText(nextPage, currentLoad)
      } else {
        await renderPageToDataUrl(nextPage, currentGen)
      }
    }

    // After priority window finishes, progressively render remaining pages up to 25 ahead
    const maxAutoPreload = Math.min(pageCount.value, currentPage.value + 15)
    for (let p = 1; p <= maxAutoPreload; p++) {
      if (currentGen !== renderGeneration || !pdfDocInstance) break
      if (priorityPagesQueue.length > 0) {
        // Yield back to high-priority scroll targets immediately
        isQueueRunning = false
        return processRenderQueue()
      }
      if (viewMode.value === 'text') {
        if (!pageTexts.value[p]) {
          await extractSinglePageText(p, currentLoad)
        }
      } else if (!pageImages.value[p]) {
        await renderPageToDataUrl(p, currentGen)
      }
    }
  } finally {
    isQueueRunning = false
  }
}

function onReaderScroll(event) {
  const container = event?.target
  if (!container || !pageCount.value) return
  const scrollTop = container.scrollTop
  const estPageHeight = (defaultPageSize.value.height || 900) + 28
  const visiblePage = Math.min(
    pageCount.value,
    Math.max(1, Math.floor(scrollTop / estPageHeight) + 1)
  )
  if (visiblePage !== currentPage.value) {
    currentPage.value = visiblePage
  }
  enqueuePagesAround(visiblePage, 5)
}

function jumpToPage(targetPage) {
  if (!pageCount.value) return
  const clamped = Math.min(pageCount.value, Math.max(1, Number(targetPage) || 1))
  currentPage.value = clamped
  enqueuePagesAround(clamped, 5)

  const container = isFullscreen.value ? fullscreenScrollRef.value : inlineScrollRef.value
  if (container) {
    const pageEl = container.querySelector(`[data-pdf-page="${clamped}"]`)
    if (pageEl && typeof pageEl.scrollIntoView === 'function') {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

async function loadPdfDocument() {
  if (!props.src || isJsdom) {
    useFallbackIframe.value = true
    return
  }

  const currentLoadGen = ++loadGeneration
  renderGeneration++
  priorityPagesQueue.length = 0
  loadingPdf.value = true
  pdfError.value = ''
  useFallbackIframe.value = false
  pageImages.value = {}
  pageDimensions.value = {}
  pageTexts.value = {}
  currentPage.value = 1

  try {
    const [pdfjsLib, pdfjsWorker] = await Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.mjs'),
    ])

    if (pdfjsWorker?.WorkerMessageHandler) {
      globalThis.pdfjsWorker = pdfjsWorker
    }
    if (pdfjsLib?.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
    }

    const response = await fetch(props.src, {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/pdf' },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    if (currentLoadGen !== loadGeneration) return

    if (localBlobUrl.value) {
      URL.revokeObjectURL(localBlobUrl.value)
    }
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
    localBlobUrl.value = URL.createObjectURL(blob)

    if (pdfDocInstance && pdfDocInstance.destroy) {
      await pdfDocInstance.destroy()
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
    })

    const doc = await loadingTask.promise
    if (currentLoadGen !== loadGeneration) {
      await doc.destroy()
      return
    }

    pdfDocInstance = doc
    pageCount.value = doc.numPages || 0

    // Render Page 1 immediately before hiding spinner so the reader opens with Page 1 visible right away
    if (pageCount.value > 0) {
      await renderPageToDataUrl(1, renderGeneration)
    }

    loadingPdf.value = false
    await nextTick()
    enqueuePagesAround(1, 5)
  } catch (err) {
    if (currentLoadGen !== loadGeneration) return
    pdfError.value = err?.message || 'Unable to load PDF document.'
    loadingPdf.value = false
  }
}

function triggerReRenderAtNewZoom() {
  renderGeneration++
  pageImages.value = {}
  priorityPagesQueue.length = 0
  enqueuePagesAround(currentPage.value, 4)
}

function zoomIn() {
  zoomPercent.value = Math.min(200, zoomPercent.value + 15)
  triggerReRenderAtNewZoom()
}

function zoomOut() {
  zoomPercent.value = Math.max(65, zoomPercent.value - 15)
  triggerReRenderAtNewZoom()
}

function resetZoom() {
  zoomPercent.value = 115
  triggerReRenderAtNewZoom()
}

async function downloadPdf() {
  if (!props.src) return
  try {
    let href = localBlobUrl.value
    if (!href) {
      const response = await fetch(props.src, { cache: 'no-store', credentials: 'omit' })
      const blob = await response.blob()
      href = URL.createObjectURL(blob)
      localBlobUrl.value = href
    }
    const a = document.createElement('a')
    a.href = href
    const cleanTitle = (props.title || 'course-material.pdf').replace(/[^\w.\- ]+/g, '_')
    a.download = cleanTitle.toLowerCase().endsWith('.pdf') ? cleanTitle : `${cleanTitle}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (_) {
    window.open(props.src, '_blank', 'noopener,noreferrer')
  }
}

watch(
  () => [props.src, props.fileSizeBytes, props.title],
  async () => {
    pageCount.value = 0
    pageImages.value = {}
    pageDimensions.value = {}
    pageTexts.value = {}
    pdfDocInstance = null
    if (props.defaultOpen) {
      isOpen.value = true
    }
    if (isOpen.value || isFullscreen.value) {
      await loadPdfDocument()
    }
  }
)

watch(isOpen, async (open) => {
  if (open) {
    if (!pdfDocInstance && !isJsdom) {
      await loadPdfDocument()
    } else {
      enqueuePagesAround(currentPage.value, 5)
    }
  }
})

watch(isFullscreen, async (full) => {
  if (full) {
    if (!pdfDocInstance && !isJsdom) {
      await loadPdfDocument()
    } else {
      enqueuePagesAround(currentPage.value, 5)
    }
  }
})

watch(viewMode, async () => {
  priorityPagesQueue.length = 0
  enqueuePagesAround(currentPage.value, 5)
})

onMounted(async () => {
  if (isOpen.value || isFullscreen.value) {
    await loadPdfDocument()
  }
})

onBeforeUnmount(() => {
  if (localBlobUrl.value) {
    URL.revokeObjectURL(localBlobUrl.value)
  }
  if (pdfDocInstance && pdfDocInstance.destroy) {
    pdfDocInstance.destroy()
  }
})
</script>

<template>
  <div
    :class="[
      'rounded-xl border overflow-hidden transition',
      dark ? 'bg-navy-950/70 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800',
    ]"
    data-testid="pdf-viewer"
  >
    <!-- Header Bar -->
    <div
      :class="[
        'flex flex-col gap-2.5 p-3',
        isOpen ? (dark ? 'border-b border-slate-800 bg-navy-900/80' : 'border-b border-slate-200 bg-slate-50') : '',
      ]"
    >
      <!-- Top Row: File Title + Primary Actions -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold uppercase text-[10px] shrink-0 border border-sky-500/30">
            PDF
          </span>
          <span class="text-xs font-semibold truncate" :title="title">
            {{ title }}
          </span>
          <span v-if="formattedSize" class="text-[11px] text-slate-400 shrink-0">
            ({{ formattedSize }})
          </span>
          <span
            v-if="pageCount > 0"
            class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0"
          >
            Page {{ currentPage }} of {{ pageCount }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="pdf-toggle-btn"
            :class="[
              'px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer',
              isOpen
                ? (dark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300')
                : 'bg-sky-500 text-slate-950 hover:bg-sky-400',
            ]"
            @click="isOpen = !isOpen"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{{ isOpen ? 'Hide Reader' : 'Open & Read PDF' }}</span>
          </button>

          <button
            type="button"
            data-testid="pdf-expand-btn"
            :class="[
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer border',
              dark
                ? 'bg-navy-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
            ]"
            title="Read in full-screen modal"
            @click="isFullscreen = true"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Expand</span>
          </button>

          <button
            type="button"
            data-testid="pdf-download-link"
            @click="downloadPdf"
            :class="[
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 border cursor-pointer',
              dark
                ? 'bg-navy-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
            ]"
            title="Download PDF"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download</span>
          </button>
        </div>
      </div>

      <!-- Second Row: Reader Controls (Page Jump, View Mode, Zoom) -->
      <div
        v-if="isOpen && pageCount > 0"
        class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t"
        :class="dark ? 'border-slate-800/80' : 'border-slate-200'"
      >
        <!-- Page Navigation Controls for Multi-Page PDFs -->
        <div
          v-if="pageCount > 1"
          class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-xs"
          :class="dark ? 'bg-navy-950 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'"
        >
          <button
            type="button"
            :disabled="currentPage <= 1"
            @click="jumpToPage(currentPage - 1)"
            class="px-1.5 py-0.5 font-bold hover:text-sky-400 disabled:opacity-40 cursor-pointer"
            title="Previous Page"
          >
            ‹ Prev
          </button>
          <input
            type="number"
            :min="1"
            :max="pageCount"
            :value="currentPage"
            @change="(e) => jumpToPage(e.target.value)"
            class="w-12 text-center bg-transparent border-x border-slate-700/60 text-[11px] font-mono font-bold focus:outline-none"
            title="Jump to page number"
          />
          <button
            type="button"
            :disabled="currentPage >= pageCount"
            @click="jumpToPage(currentPage + 1)"
            class="px-1.5 py-0.5 font-bold hover:text-sky-400 disabled:opacity-40 cursor-pointer"
            title="Next Page"
          >
            Next ›
          </button>
        </div>
        <div v-else></div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- View Mode Toggle (Visual Pages vs Text Mode) -->
          <div
            class="flex items-center rounded-lg border p-0.5 text-[11px]"
            :class="dark ? 'bg-navy-950 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'"
          >
            <button
              type="button"
              class="px-2 py-0.5 rounded-md font-semibold transition cursor-pointer"
              :class="viewMode === 'canvas' ? 'bg-sky-500 text-slate-950' : 'hover:text-white'"
              @click="viewMode = 'canvas'"
            >
              Page View
            </button>
            <button
              type="button"
              class="px-2 py-0.5 rounded-md font-semibold transition cursor-pointer"
              :class="viewMode === 'text' ? 'bg-sky-500 text-slate-950' : 'hover:text-white'"
              @click="viewMode = 'text'"
            >
              Text View
            </button>
          </div>

          <!-- Zoom Controls when open and rendered -->
          <div
            v-if="viewMode === 'canvas'"
            class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border"
            :class="dark ? 'bg-navy-950 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'"
          >
            <button
              type="button"
              @click="zoomOut"
              class="px-1.5 py-0.5 text-xs font-bold hover:text-amber-400 cursor-pointer"
              title="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              @click="resetZoom"
              class="px-1.5 py-0.5 text-[11px] font-mono font-semibold hover:text-amber-400 cursor-pointer"
              title="Reset Zoom"
            >
              {{ zoomPercent }}%
            </button>
            <button
              type="button"
              @click="zoomIn"
              class="px-1.5 py-0.5 text-xs font-bold hover:text-amber-400 cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Inline Scrollable PDF Reader -->
    <div v-if="isOpen" class="w-full bg-slate-900 relative" data-testid="pdf-inline-container">
      <!-- Loading State -->
      <div
        v-if="loadingPdf"
        :class="['w-full flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-300', heightClass]"
      >
        <div class="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"></div>
        <span class="text-xs font-medium">Loading PDF document for inline reading...</span>
      </div>

      <!-- Visual Scrollable PDF Pages (Primary In-App Reader) -->
      <div
        v-else-if="pageCount > 0 && !useFallbackIframe && viewMode === 'canvas'"
        ref="inlineScrollRef"
        @scroll.passive="onReaderScroll"
        :class="['w-full overflow-y-auto overflow-x-auto bg-slate-800/95 p-4 sm:p-6 space-y-6 flex flex-col items-center', heightClass]"
        data-testid="pdf-canvas-reader"
      >
        <div
          v-for="pageNum in pageCount"
          :key="`inline-page-${pageNum}`"
          :data-pdf-page="pageNum"
          class="bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-700/60 flex flex-col items-center max-w-full shrink-0"
        >
          <img
            v-if="pageImages[pageNum]"
            :src="pageImages[pageNum]"
            :alt="`Page ${pageNum} of ${pageCount}`"
            :style="{ width: getPageDisplayStyle(pageNum, false).width }"
            class="block max-w-full h-auto select-none bg-white"
          />
          <div
            v-else
            :style="getPageDisplayStyle(pageNum, false)"
            class="max-w-full bg-white flex flex-col items-center justify-center gap-2 text-slate-400 p-8"
          >
            <div class="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
            <span class="text-xs font-medium">Rendering Page {{ pageNum }} of {{ pageCount }}...</span>
          </div>
          <div class="w-full py-1.5 px-3 bg-slate-100 border-t border-slate-200 text-[11px] font-medium text-slate-500 text-center">
            Page {{ pageNum }} of {{ pageCount }}
          </div>
        </div>
      </div>

      <!-- Extracted Text Reader Mode -->
      <div
        v-else-if="pageCount > 0 && !useFallbackIframe && viewMode === 'text'"
        ref="inlineScrollRef"
        @scroll.passive="onReaderScroll"
        :class="['w-full overflow-y-auto bg-slate-800/95 p-4 sm:p-6 space-y-6 flex flex-col items-center', heightClass]"
        data-testid="pdf-text-reader"
      >
        <div
          v-for="pageNum in pageCount"
          :key="`inline-text-page-${pageNum}`"
          :data-pdf-page="pageNum"
          class="w-full max-w-3xl bg-white text-slate-900 shadow-2xl rounded-lg overflow-hidden border border-slate-300 shrink-0"
        >
          <div v-if="pageTexts[pageNum]" class="p-6 sm:p-8 space-y-2.5 font-sans text-sm leading-relaxed select-text">
            <p
              v-for="(line, idx) in pageTexts[pageNum]"
              :key="`line-${pageNum}-${idx}`"
              class="text-slate-800"
            >
              {{ line }}
            </p>
            <p v-if="pageTexts[pageNum].length === 0" class="text-slate-400 italic text-xs">
              This page contains graphics only. Switch to Page View to inspect visuals.
            </p>
          </div>
          <div v-else class="p-10 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <div class="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
            <span>Extracting text for Page {{ pageNum }}...</span>
          </div>
          <div class="w-full py-1.5 px-3 bg-slate-100 border-t border-slate-200 text-[11px] font-medium text-slate-500 text-center">
            Page {{ pageNum }} of {{ pageCount }}
          </div>
        </div>
      </div>

      <!-- Error / Retry State in Real Browsers -->
      <div
        v-else-if="pdfError && !isJsdom"
        :class="['w-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-900 text-slate-300', heightClass]"
      >
        <p class="text-sm font-semibold text-amber-300">Could not render PDF inline ({{ pdfError }})</p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="loadPdfDocument"
            class="px-3.5 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition cursor-pointer"
          >
            Retry Reader
          </button>
          <button
            type="button"
            @click="downloadPdf"
            class="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
          >
            Download PDF
          </button>
        </div>
      </div>

      <!-- Fallback Iframe (Used in JSDOM unit tests) -->
      <iframe
        v-else
        :src="viewerSrc"
        :title="title"
        data-testid="pdf-iframe"
        :class="['w-full border-0 bg-white', heightClass]"
        allow="fullscreen"
      ></iframe>
    </div>

    <!-- Fullscreen Scrollable PDF Reader Modal -->
    <Modal :open="isFullscreen" :show="isFullscreen" max-width="max-w-6xl" @close="isFullscreen = false">
      <div class="p-4 sm:p-6 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
          <div class="flex items-center gap-2 min-w-0">
            <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold uppercase text-xs">PDF Reader</span>
            <h3 class="text-base sm:text-lg font-serif font-bold text-white truncate">{{ title }}</h3>
            <span
              v-if="pageCount > 0"
              class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            >
              Page {{ currentPage }} of {{ pageCount }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <div
              v-if="pageCount > 1"
              class="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
            >
              <button
                type="button"
                :disabled="currentPage <= 1"
                @click="jumpToPage(currentPage - 1)"
                class="px-1.5 font-bold hover:text-sky-400 disabled:opacity-40 cursor-pointer"
              >
                ‹ Prev
              </button>
              <input
                type="number"
                :min="1"
                :max="pageCount"
                :value="currentPage"
                @change="(e) => jumpToPage(e.target.value)"
                class="w-12 text-center bg-transparent border-x border-slate-700 text-xs font-mono font-bold focus:outline-none"
              />
              <button
                type="button"
                :disabled="currentPage >= pageCount"
                @click="jumpToPage(currentPage + 1)"
                class="px-1.5 font-bold hover:text-sky-400 disabled:opacity-40 cursor-pointer"
              >
                Next ›
              </button>
            </div>

            <div
              v-if="pageCount > 0"
              class="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs text-slate-300"
            >
              <button
                type="button"
                class="px-2.5 py-1 rounded-md font-semibold transition cursor-pointer"
                :class="viewMode === 'canvas' ? 'bg-sky-500 text-slate-950' : 'hover:text-white'"
                @click="viewMode = 'canvas'"
              >
                Page View
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-md font-semibold transition cursor-pointer"
                :class="viewMode === 'text' ? 'bg-sky-500 text-slate-950' : 'hover:text-white'"
                @click="viewMode = 'text'"
              >
                Text View
              </button>
            </div>

            <div
              v-if="pageCount > 0 && viewMode === 'canvas'"
              class="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
            >
              <button type="button" @click="zoomOut" class="px-1.5 text-xs font-bold hover:text-amber-400 cursor-pointer">−</button>
              <button type="button" @click="resetZoom" class="px-1.5 text-xs font-mono hover:text-amber-400 cursor-pointer">{{ zoomPercent }}%</button>
              <button type="button" @click="zoomIn" class="px-1.5 text-xs font-bold hover:text-amber-400 cursor-pointer">+</button>
            </div>

            <button
              type="button"
              class="btn btn-secondary text-xs py-1.5 px-3 cursor-pointer"
              @click="downloadPdf"
            >
              Download PDF
            </button>
            <button
              type="button"
              class="btn btn-primary text-xs py-1.5 px-3 font-bold cursor-pointer"
              @click="isFullscreen = false"
            >
              Close Reader
            </button>
          </div>
        </div>

        <div class="w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-800/95">
          <div
            v-if="pageCount > 0 && !useFallbackIframe && viewMode === 'canvas'"
            ref="fullscreenScrollRef"
            @scroll.passive="onReaderScroll"
            class="w-full h-[78vh] overflow-y-auto overflow-x-auto p-4 sm:p-6 space-y-6 flex flex-col items-center"
            data-testid="pdf-fullscreen-canvas-reader"
          >
            <div
              v-for="pageNum in pageCount"
              :key="`full-page-${pageNum}`"
              :data-pdf-page="pageNum"
              class="bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-700/60 flex flex-col items-center max-w-full shrink-0"
            >
              <img
                v-if="pageImages[pageNum]"
                :src="pageImages[pageNum]"
                :alt="`Page ${pageNum} of ${pageCount}`"
                :style="{ width: getPageDisplayStyle(pageNum, true).width }"
                class="block max-w-full h-auto select-none bg-white"
              />
              <div
                v-else
                :style="getPageDisplayStyle(pageNum, true)"
                class="max-w-full bg-white flex flex-col items-center justify-center gap-2 text-slate-400 p-8"
              >
                <div class="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
                <span class="text-xs font-medium">Rendering Page {{ pageNum }} of {{ pageCount }}...</span>
              </div>
              <div class="w-full py-1.5 px-3 bg-slate-100 border-t border-slate-200 text-xs font-medium text-slate-500 text-center">
                Page {{ pageNum }} of {{ pageCount }}
              </div>
            </div>
          </div>

          <div
            v-else-if="pageCount > 0 && !useFallbackIframe && viewMode === 'text'"
            ref="fullscreenScrollRef"
            @scroll.passive="onReaderScroll"
            class="w-full h-[78vh] overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col items-center"
            data-testid="pdf-fullscreen-text-reader"
          >
            <div
              v-for="pageNum in pageCount"
              :key="`full-text-page-${pageNum}`"
              :data-pdf-page="pageNum"
              class="w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-lg overflow-hidden border border-slate-300 shrink-0"
            >
              <div v-if="pageTexts[pageNum]" class="p-6 sm:p-10 space-y-3 font-sans text-sm sm:text-base leading-relaxed select-text">
                <p
                  v-for="(line, idx) in pageTexts[pageNum]"
                  :key="`full-line-${pageNum}-${idx}`"
                  class="text-slate-800"
                >
                  {{ line }}
                </p>
              </div>
              <div v-else class="p-10 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <div class="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
                <span>Extracting text for Page {{ pageNum }}...</span>
              </div>
              <div class="w-full py-1.5 px-3 bg-slate-100 border-t border-slate-200 text-xs font-medium text-slate-500 text-center">
                Page {{ pageNum }} of {{ pageCount }}
              </div>
            </div>
          </div>

          <iframe
            v-else
            :src="viewerSrc"
            :title="title"
            data-testid="pdf-fullscreen-iframe"
            class="w-full h-[78vh] border-0 bg-white"
            allow="fullscreen"
          ></iframe>
        </div>
      </div>
    </Modal>
  </div>
</template>
