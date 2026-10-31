<script setup>
import { computed, ref, watch } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  src: { type: String, required: true },
  title: { type: String, default: 'PDF Course Material' },
  fileSizeBytes: { type: Number, default: 0 },
  dark: { type: Boolean, default: true },
  defaultOpen: { type: Boolean, default: false },
  heightClass: { type: String, default: 'h-[640px]' },
})

const isOpen = ref(props.defaultOpen)
const isFullscreen = ref(false)

watch(
  () => props.src,
  () => {
    if (props.defaultOpen) {
      isOpen.value = true
    }
  }
)

const formattedSize = computed(() => {
  if (!props.fileSizeBytes) return ''
  if (props.fileSizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(props.fileSizeBytes / 1024))} KB`
  }
  return `${(props.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
})

const viewerSrc = computed(() => {
  if (!props.src) return ''
  if (props.src.includes('#')) return props.src
  return `${props.src}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`
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
      </div>

      <div class="flex items-center gap-2 shrink-0">
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

        <a
          :href="src"
          target="_blank"
          rel="noopener noreferrer"
          download
          data-testid="pdf-download-link"
          :class="[
            'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 border',
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
        </a>
      </div>
    </div>

    <!-- Inline Scrollable PDF Reader -->
    <div v-if="isOpen" class="w-full bg-slate-900 relative" data-testid="pdf-inline-container">
      <iframe
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
        <div class="flex items-center justify-between pb-3 border-b border-slate-700">
          <div class="flex items-center gap-2 min-w-0">
            <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold uppercase text-xs">PDF Reader</span>
            <h3 class="text-base sm:text-lg font-serif font-bold text-white truncate">{{ title }}</h3>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a
              :href="src"
              target="_blank"
              rel="noopener noreferrer"
              download
              class="btn btn-secondary text-xs py-1.5 px-3"
            >
              Download PDF
            </a>
            <button
              type="button"
              class="btn btn-primary text-xs py-1.5 px-3 font-bold"
              @click="isFullscreen = false"
            >
              Close Reader
            </button>
          </div>
        </div>

        <div class="w-full rounded-xl overflow-hidden border border-slate-700 bg-white">
          <iframe
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
