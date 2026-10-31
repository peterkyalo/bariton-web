<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Modal from './Modal.vue'

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
const zoomPercent = ref(115)
const useFallbackIframe = ref(isJsdom)
const localBlobUrl = ref('')

const inlineCanvasMap = new Map()
const fullscreenCanvasMap = new Map()
let pdfDocInstance = null
let renderGeneration = 0

function setInlineCanvasRef(pageNum, el) {
  if (el) {
    inlineCanvasMap.set(pageNum, el)
  } else {
    inlineCanvasMap.delete(pageNum)
  }
}

function setFullscreenCanvasRef(pageNum, el) {
  if (el) {
    fullscreenCanvasMap.set(pageNum, el)
  } else {
    fullscreenCanvasMap.delete(pageNum)
  }
}

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

async function renderAllPages(targetMap, baseScale) {
  if (!pdfDocInstance) return
  const currentGen = ++renderGeneration
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

  for (let pageNum = 1; pageNum <= pdfDocInstance.numPages; pageNum++) {
    if (currentGen !== renderGeneration) return
    const canvas = targetMap.get(pageNum)
    if (!canvas) continue

    try {
      const page = await pdfDocInstance.getPage(pageNum)
      const viewport = page.getViewport({ scale: baseScale * dpr })
      const context = canvas.getContext('2d')
      if (!context) continue

      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`

      await page.render({
        canvasContext: context,
        viewport,
      }).promise
    } catch (_) {
      // Ignore individual page render cancellation
    }
  }
}

async function refreshCanvases() {
  await nextTick()
  const scale = (zoomPercent.value / 100) * 1.15
  if (isOpen.value && inlineCanvasMap.size > 0) {
    await renderAllPages(inlineCanvasMap, scale)
  }
  if (isFullscreen.value && fullscreenCanvasMap.size > 0) {
    await renderAllPages(fullscreenCanvasMap, scale * 1.1)
  }
}

async function loadPdfDocument() {
  if (!props.src || isJsdom) {
    useFallbackIframe.value = true
    return
  }

  loadingPdf.value = true
  pdfError.value = ''
  useFallbackIframe.value = false

  try {
    const pdfjsLib = await import('pdfjs-dist')

    if (pdfjsLib?.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
    }

    const response = await fetch(props.src, {
      headers: { Accept: 'application/pdf' },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
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
    pdfDocInstance = await loadingTask.promise
    pageCount.value = pdfDocInstance.numPages || 0

    loadingPdf.value = false
    await nextTick()
    await refreshCanvases()
  } catch (err) {
    pdfError.value = 'Unable to render PDF pages inline.'
    useFallbackIframe.value = true
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
      const response = await fetch(props.src)
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
        <!-- Zoom Controls when open and rendered -->
        <div
          v-if="isOpen && pageCount > 0"
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
        v-else-if="pageCount > 0 && !useFallbackIframe"
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

      <!-- Fallback Iframe (Used in unit tests or if canvas rendering is unavailable) -->
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
            v-if="pageCount > 0 && !useFallbackIframe"
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
