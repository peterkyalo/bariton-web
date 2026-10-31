<script setup>
import { computed } from 'vue'
import { extractYouTubeId, resolveMediaUrl } from '@/lib/richText'
import PdfViewer from './PdfViewer.vue'

const props = defineProps({
  attachments: { type: Array, default: () => [] },
  dark: { type: Boolean, default: true },
  emptyText: { type: String, default: '' },
})

const items = computed(() => props.attachments || [])

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function embedUrl(att) {
  return `https://www.youtube.com/embed/${extractYouTubeId(att.youtube_video_id)}?rel=0`
}
</script>

<template>
  <div class="space-y-4">
    <p v-if="!items.length && emptyText" :class="['text-xs italic', dark ? 'text-slate-500' : 'text-slate-400']">{{ emptyText }}</p>

    <div v-for="att in items" :key="att.id" class="space-y-1.5" data-testid="material-item">
      <p v-if="att.title" :class="['text-xs font-semibold', dark ? 'text-slate-200' : 'text-slate-700']">{{ att.title }}</p>

      <!-- YouTube -->
      <div v-if="att.kind === 'youtube'" class="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
        <iframe
          :src="embedUrl(att)"
          class="w-full h-full"
          frameborder="0"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>

      <!-- Image -->
      <img
        v-else-if="att.kind === 'image' && att.url"
        :src="resolveMediaUrl(att.url)"
        :alt="att.title || att.file_name || 'Course material image'"
        loading="lazy"
        class="max-w-full h-auto rounded-xl border border-slate-700"
      />

      <!-- Audio -->
      <audio v-else-if="att.kind === 'audio' && att.url" :src="resolveMediaUrl(att.url)" controls class="w-full"></audio>

      <!-- PDF (Inline Scrollable Reader + Expand & Download) -->
      <PdfViewer
        v-else-if="att.kind === 'pdf' && att.url"
        :src="resolveMediaUrl(att.url)"
        :title="att.title || att.file_name || 'Course PDF Document'"
        :file-size-bytes="att.file_size_bytes"
        :dark="dark"
        :default-open="false"
      />
    </div>
  </div>
</template>

