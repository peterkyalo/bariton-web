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
const pageTexts = ref({})
const viewMode = ref('canvas') // 'canvas' | 'text'
const zoomPercent = ref(115)
const useFallbackIframe = ref(isJsdom)
const localBlobUrl = ref('')

const inlineCanvasMap = new Map()
const fullscreenCanvasMap = new Map()
const activeCanvasTasks = new WeakMap()
let pdfDocInstance = null
let loadGeneration = 0

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

function getBaseScale(isFull = false) {
  const scale = (zoomPercent.value / 100) * 1.15
  return isFull ? scale * 1.1 : scale
}

async function renderSinglePageToCanvas(pageNum, canvas, baseScale) {
  if (!pdfDocInstance || !canvas) return

  const renderKey = `${loadGeneration}-${pageNum}-${baseScale.toFixed(3)}`
  if (canvas.dataset.renderedKey === renderKey && canvas.width > 0) {
    return
  }

  // Cancel any in-flight render task on this same canvas
  const existingTask = activeCanvasTasks.get(canvas)
  if (existingTask) {
    try {
      existingTask.cancel()
    } catch (_) {
      // ignore
    }
    activeCanvasTasks.delete(canvas)
  }

  try {
    const page = await pdfDocInstance.getPage(pageNum)
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const viewport = page.getViewport({ scale: baseScale * dpr })
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))
    canvas.style.width = `${Math.max(1, Math.floor(viewport.width / dpr))}px`
    canvas.style.height = `${Math.max(1, Math.floor(viewport.height / dpr))}px`

    // Fill white page background first so transparent PDFs are always legible
    context.save()
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.restore()

    const renderTask = page.render({
      canvasContext: context,
      viewport,
    })
    activeCanvasTasks.set(canvas, renderTask)
    await renderTask.promise
    activeCanvasTasks.delete(canvas)
    canvas.dataset.renderedKey = renderKey
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      // Keep any fallback text available
    }
  }
}

function setInlineCanvasRef(pageNum, el) {
  if (el) {
    const prev = inlineCanvasMap.get(pageNum)
    inlineCanvasMap.set(pageNum, el)
    if (pdfDocInstance && (prev !== el || !el.dataset.renderedKey)) {
      renderSinglePageToCanvas(pageNum, el, getBaseScale(false))
    }
  } else {
    inlineCanvasMap.delete(pageNum)
  }
}

function setFullscreenCanvasRef(pageNum, el) {
  if (el) {
    const prev = fullscreenCanvasMap.get(pageNum)
    fullscreenCanvasMap.set(pageNum, el)
    if (pdfDocInstance && (prev !== el || !el.dataset.renderedKey)) {
      renderSinglePageToCanvas(pageNum, el, getBaseScale(true))
    }
  } else {
    fullscreenCanvasMap.delete(pageNum)
  }
}

async function refreshCanvases() {
  await nextTick()
  if (!pdfDocInstance) return

  if (isOpen.value && viewMode.value === 'canvas') {
    const inlineScale = getBaseScale(false)
    for (const [pageNum, canvas] of inlineCanvasMap.entries()) {
      await renderSinglePageToCanvas(pageNum, canvas, inlineScale)
    }
  }

  if (isFullscreen.value && viewMode.value === 'canvas') {
    const fullScale = getBaseScale(true)
    for (const [pageNum, canvas] of fullscreenCanvasMap.entries()) {
      await renderSinglePageToCanvas(pageNum, canvas, fullScale)
    }
  }
}

async function extractPageLines(page) {
  try {
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
    return rows
  } catch (_) {
    return []
  }
}

async function loadPdfDocument() {
  if (!props.src || isJsdom) {
    useFallbackIframe.value = true
    return
  }

  const currentLoadGen = ++loadGeneration
  loadingPdf.value = true
  pdfError.value = ''
  useFallbackIframe.value = false

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

    // Pre-extract text lines for each page so text view & accessibility are instant
    const extracted = {}
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i)
      extracted[i] = await extractPageLines(p)
    }
    pageTexts.value = extracted

    loadingPdf.value = false
    await nextTick()
    await refreshCanvases()
  } catch (err) {
    if (currentLoadGen !== loadGeneration) return
    pdfError.value = err?.message || 'Unable to load PDF document.'
    loadingPdf.value = false
  }
}

function zoomIn() {
  zoomPercent.value = Math.min(200, zoomPercent.value + 15)
  refreshCanvases()
}

function zoomOut() {
  zoomPercent.value = Math.max(65, zoomPercent.value - 15)
  refreshCanvases()
}

function resetZoom() {
  zoomPercent.value = 115
  refreshCanvases()
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
  () => props.src,
  async () => {
    pageCount.value = 0
    pageTexts.value = {}
    pdfDocInstance = null
    inlineCanvasMap.clear()
    fullscreenCanvasMap.clear()
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
      await refreshCanvases()
    }
  }
})

watch(isFullscreen, async (full) => {
  if (full) {
    if (!pdfDocInstance && !isJsdom) {
      await loadPdfDocument()
    } else {
      await refreshCanvases()
    }
  }
})

watch(viewMode, async (mode) => {
  if (mode === 'canvas') {
    await refreshCanvases()
  }
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
        'flex flex-wrap items-center justify-between gap-3 p-3',
        isOpen ? (dark ? 'border-b border-slate-800 bg-navy-900/80' : 'border-b border-slate-200 bg-slate-50') : '',
      ]"
    >
      <div class="flex items-center gap-2.5 min-w-0">
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
          {{ pageCount }} {{ pageCount === 1 ? 'Page' : 'Pages' }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <!-- View Mode Toggle (Visual Pages vs Text Mode) -->
        <div
          v-if="isOpen && pageCount > 0"
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
          v-if="isOpen && pageCount > 0 && viewMode === 'canvas'"
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

        <button
          type="button"
          data-testid="pdf-toggle-btn"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer',
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
          <span class="hidden sm:inline">Expand</span>
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
          <span class="hidden sm:inline">Download</span>
        </button>
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
        <span class="text-xs font-medium">Rendering PDF pages for inline reading...</span>
      </div>

      <!-- Canvas-rendered Scrollable PDF Pages (Primary In-App Reader) -->
      <div
        v-else-if="pageCount > 0 && !useFallbackIframe && viewMode === 'canvas'"
        :class="['w-full overflow-y-auto overflow-x-auto bg-slate-800/95 p-4 sm:p-6 space-y-6 flex flex-col items-center', heightClass]"
        data-testid="pdf-canvas-reader"
      >
        <div
          v-for="pageNum in pageCount"
          :key="`inline-page-${pageNum}`"
          class="bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-700/60 flex flex-col items-center max-w-full"
        >
          <canvas
            :ref="(el) => setInlineCanvasRef(pageNum, el)"
            class="block max-w-full h-auto"
          ></canvas>
          <div class="w-full py-1.5 px-3 bg-slate-100 border-t border-slate-200 text-[11px] font-medium text-slate-500 text-center">
            Page {{ pageNum }} of {{ pageCount }}
          </div>
        </div>
      </div>

      <!-- Extracted Text Reader Mode -->
      <div
        v-else-if="pageCount > 0 && !useFallbackIframe && viewMode === 'text'"
        :class="['w-full overflow-y-auto bg-slate-800/95 p-4 sm:p-6 space-y-6 flex flex-col items-center', heightClass]"
        data-testid="pdf-text-reader"
      >
        <div
          v-for="pageNum in pageCount"
          :key="`inline-text-page-${pageNum}`"
          class="w-full max-w-3xl bg-white text-slate-900 shadow-2xl rounded-lg overflow-hidden border border-slate-300"
        >
          <div class="p-6 sm:p-8 space-y-2.5 font-sans text-sm leading-relaxed select-text">
            <p
              v-for="(line, idx) in (pageTexts[pageNum] || [])"
              :key="`line-${pageNum}-${idx}`"
              class="text-slate-800"
            >
              {{ line }}
            </p>
            <p v-if="!pageTexts[pageNum] || pageTexts[pageNum].length === 0" class="text-slate-400 italic text-xs">
              This page contains scanned graphics only. Switch to Page View to inspect visuals.
            </p>
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
              {{ pageCount }} {{ pageCount === 1 ? 'Page' : 'Pages' }}
            </span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
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
            class="w-full h-[78vh] overflow-y-auto overflow-x-auto p-4 sm:p-6 space-y-6 flex flex-col items-center"
            data-testid="pdf-fullscreen-canvas-reader"
          >
            <div
              v-for="pageNum in pageCount"
              :key="`full-page-${pageNum}`"
              class="bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-700/60 flex flex-col items-center max-w-full"
            >
              <canvas
                :ref="(el) => setFullscreenCanvasRef(pageNum, el)"
                class="block max-w-full h-auto"
              ></canvas>
              <div class="w-full py-1.5 px-3 bg-slate-100 border-t border-slate-200 text-xs font-medium text-slate-500 text-center">
                Page {{ pageNum }} of {{ pageCount }}
              </div>
            </div>
          </div>

          <div
            v-else-if="pageCount > 0 && !useFallbackIframe && viewMode === 'text'"
            class="w-full h-[78vh] overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col items-center"
            data-testid="pdf-fullscreen-text-reader"
          >
            <div
              v-for="pageNum in pageCount"
              :key="`full-text-page-${pageNum}`"
              class="w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-lg overflow-hidden border border-slate-300"
            >
              <div class="p-6 sm:p-10 space-y-3 font-sans text-sm sm:text-base leading-relaxed select-text">
                <p
                  v-for="(line, idx) in (pageTexts[pageNum] || [])"
                  :key="`full-line-${pageNum}-${idx}`"
                  class="text-slate-800"
                >
                  {{ line }}
                </p>
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
