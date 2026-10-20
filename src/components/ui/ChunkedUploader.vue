<script setup>
import { ref } from 'vue'
import { useAssignmentsStore } from '@/stores/assignments'

const props = defineProps({
  acceptedFormats: {
    type: Array,
    default: () => ['mp4', 'webm', 'mp3', 'wav'],
  },
  maxSizeMb: {
    type: Number,
    default: 200,
  },
  submissionType: {
    type: String,
    default: 'video', // 'video', 'audio', 'both'
  },
})

const emit = defineEmits(['completed', 'reset'])

const assignmentsStore = useAssignmentsStore()
const fileInput = ref(null)
const selectedFile = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const statusMessage = ref('')
const errorMessage = ref('')
const uploadResult = ref(null)

const isDragging = ref(false)

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function handleFileSelection(event) {
  const file = event.target.files?.[0]
  if (file) processFile(file)
}

function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file) processFile(file)
}

function processFile(file) {
  errorMessage.value = ''
  uploadResult.value = null

  // Validate size
  const maxBytes = props.maxSizeMb * 1024 * 1024
  if (file.size > maxBytes) {
    errorMessage.value = `File size exceeds the maximum limit of ${props.maxSizeMb} MB.`
    return
  }

  // Validate extension
  const ext = file.name.split('.').pop().toLowerCase()
  if (!props.acceptedFormats.includes(ext)) {
    errorMessage.value = `Unsupported file format (.${ext}). Accepted: ${props.acceptedFormats.map((f) => '.' + f).join(', ')}`
    return
  }

  selectedFile.value = file
  startUpload(file)
}

async function startUpload(file) {
  isUploading.value = true
  errorMessage.value = ''
  uploadProgress.value = 0
  statusMessage.value = 'Preparing upload session...'

  try {
    const result = await assignmentsStore.uploadFileInChunks(file, (percent) => {
      uploadProgress.value = percent
    })

    uploadResult.value = result
    statusMessage.value = 'Upload verified and completed!'
    emit('completed', result)
  } catch (err) {
    errorMessage.value = err.message || 'Chunked upload interrupted. You can resume by retrying.'
  } finally {
    isUploading.value = false
  }
}

function retryUpload() {
  if (selectedFile.value) {
    startUpload(selectedFile.value)
  }
}

function resetUpload() {
  selectedFile.value = null
  uploadResult.value = null
  uploadProgress.value = 0
  statusMessage.value = ''
  errorMessage.value = ''
  if (fileInput.value) fileInput.value.value = ''
  emit('reset')
}
</script>

<template>
  <div class="space-y-4">
    <!-- Dropzone / Picker -->
    <div
      v-if="!selectedFile"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
        isDragging
          ? 'border-brass-400 bg-brass-500/10 scale-[1.01]'
          : 'border-white/10 hover:border-brass-300/40 bg-ink-950/40 hover:bg-ink-950/60'
      ]"
      @click="fileInput?.click()"
    >
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :accept="acceptedFormats.map((f) => '.' + f).join(',')"
        @change="handleFileSelection"
      />

      <div class="space-y-3">
        <div class="w-14 h-14 mx-auto rounded-full bg-brass-500/10 border border-brass-400/30 flex items-center justify-center text-brass-300">
          <svg v-if="submissionType === 'audio'" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        <div class="space-y-1">
          <p class="text-sm font-semibold text-white">
            Click to upload or drag & drop your performance file
          </p>
          <p class="text-xs text-ink-400">
            Resumable chunked upload supported • Max {{ maxSizeMb }} MB
          </p>
        </div>

        <div class="flex items-center justify-center gap-2 text-[11px] text-ink-400">
          <span>Accepted formats:</span>
          <span
            v-for="fmt in acceptedFormats"
            :key="fmt"
            class="px-2 py-0.5 rounded bg-ink-800 text-brass-300 font-mono text-[10px]"
          >
            .{{ fmt }}
          </span>
        </div>
      </div>
    </div>

    <!-- Active Upload / Progress State -->
    <div v-else class="glass p-5 rounded-2xl space-y-4 border-brass-400/20">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-ink-950 flex items-center justify-center text-brass-400 border border-white/10 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-white truncate max-w-sm">
              {{ selectedFile.name }}
            </h4>
            <p class="text-xs text-ink-400">
              {{ formatBytes(selectedFile.size) }}
            </p>
          </div>
        </div>

        <button
          v-if="!isUploading"
          @click="resetUpload"
          class="text-xs text-ink-400 hover:text-danger-400 transition-colors"
          type="button"
        >
          Change File
        </button>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-ink-300 flex items-center gap-2">
            <span v-if="isUploading" class="inline-block w-2 h-2 rounded-full bg-brass-400 animate-ping"></span>
            {{ statusMessage || assignmentsStore.uploadStatusText }}
          </span>
          <span class="font-mono font-bold text-brass-300">{{ uploadProgress }}%</span>
        </div>

        <div class="h-2 w-full bg-ink-950 rounded-full overflow-hidden border border-white/5">
          <div
            class="h-full bg-gradient-to-r from-brass-500 to-amber-300 transition-all duration-300 rounded-full"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="uploadResult" class="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-1">
        <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Performance recording assembled and ready to submit.</span>
      </div>

      <!-- Error State & Retry -->
      <div v-if="errorMessage" class="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-xs text-danger-300 flex items-center justify-between gap-3">
        <span>{{ errorMessage }}</span>
        <button
          @click="retryUpload"
          class="btn btn-secondary text-xs py-1 px-3 shrink-0"
          type="button"
        >
          Resume Upload
        </button>
      </div>
    </div>
  </div>
</template>
