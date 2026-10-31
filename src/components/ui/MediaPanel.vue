<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useCoursesStore } from '@/stores/courses'
import { useUiStore } from '@/stores/ui'
import { parseError } from '@/lib/http'
import { extractYouTubeId, getYouTubeThumbnail, resolveMediaUrl } from '@/lib/richText'
import PdfViewer from './PdfViewer.vue'

/**
 * Manage the cover image and learning materials (YouTube, PDF, audio, images)
 * of a course or a module. Requires the owner to already exist (have an id).
 */
const props = defineProps({
  ownerType: { type: String, required: true, validator: (v) => ['course', 'module'].includes(v) },
  owner: { type: Object, required: true },
})

const emit = defineEmits(['changed'])

const coursesStore = useCoursesStore()
const ui = useUiStore()

const isCourse = computed(() => props.ownerType === 'course')
const localCoverUrl = ref(null)

watch(
  () => [props.owner?.thumbnail_url, props.owner?.thumbnail_path, props.owner?.image_url, props.owner?.image_path],
  () => {
    localCoverUrl.value = null
  }
)

const coverUrl = computed(() => {
  if (localCoverUrl.value !== null) {
    return resolveMediaUrl(localCoverUrl.value)
  }
  const raw = isCourse.value
    ? (props.owner?.thumbnail_url || props.owner?.thumbnail_path)
    : (props.owner?.image_url || props.owner?.image_path)
  return resolveMediaUrl(raw)
})
const attachments = computed(() => props.owner.attachments || [])

const busy = ref(false)
const error = ref('')
const fileInput = ref(null)
const form = reactive({ kind: 'youtube', title: '', youtube_video_id: '' })
const file = ref(null)

const accept = computed(() => ({
  pdf: 'application/pdf',
  audio: 'audio/*',
  image: 'image/jpeg,image/png,image/webp,image/gif',
}[form.kind] || ''))

const kindLabels = { youtube: 'YouTube', pdf: 'PDF', audio: 'Audio', image: 'Image' }
const parsedYoutubeId = computed(() => extractYouTubeId(form.youtube_video_id))
const validYoutube = computed(() => /^[A-Za-z0-9_-]{11}$/.test(parsedYoutubeId.value))

function fail(err, fallback) {
  const { message, errors } = parseError(err)
  error.value = Object.values(errors || {})[0] || message || fallback
}

async function onCoverSelected(e) {
  const selected = e.target.files?.[0]
  e.target.value = ''
  if (!selected) return
  busy.value = true
  error.value = ''
  try {
    const res = await coursesStore.uploadCover(props.ownerType, props.owner.id, selected)
    localCoverUrl.value = res?.thumbnail_url || res?.image_url || null
    ui.notify({ type: 'success', title: 'Image updated', message: isCourse.value ? 'Course cover image saved.' : 'Module image saved.' })
    emit('changed')
  } catch (err) {
    fail(err, 'Image upload failed.')
  } finally {
    busy.value = false
  }
}

async function removeCover() {
  busy.value = true
  error.value = ''
  try {
    await coursesStore.removeCover(props.ownerType, props.owner.id)
    localCoverUrl.value = ''
    emit('changed')
  } catch (err) {
    fail(err, 'Could not remove image.')
  } finally {
    busy.value = false
  }
}

function onFileChange(e) {
  file.value = e.target.files?.[0] || null
}

function onKindChange() {
  file.value = null
  form.youtube_video_id = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function addMaterial() {
  error.value = ''
  const fd = new FormData()
  fd.append('kind', form.kind)
  if (form.title) fd.append('title', form.title)

  if (form.kind === 'youtube') {
    if (!validYoutube.value) {
      error.value = 'Enter a valid YouTube video ID or link.'
      return
    }
    fd.append('youtube_video_id', parsedYoutubeId.value)
  } else {
    if (!file.value) {
      error.value = `Choose a ${kindLabels[form.kind]} file to upload.`
      return
    }
    fd.append('file', file.value)
  }

  busy.value = true
  try {
    await coursesStore.addAttachment(props.ownerType, props.owner.id, fd)
    ui.notify({ type: 'success', title: 'Material added', message: `${kindLabels[form.kind]} added.` })
    form.title = ''
    form.youtube_video_id = ''
    file.value = null
    if (fileInput.value) fileInput.value.value = ''
    emit('changed')
  } catch (err) {
    fail(err, 'Could not add material.')
  } finally {
    busy.value = false
  }
}

async function removeMaterial(att) {
  if (!confirm(`Remove "${att.title || att.file_name || kindLabels[att.kind]}"?`)) return
  busy.value = true
  error.value = ''
  try {
    await coursesStore.deleteAttachment(att.id)
    emit('changed')
  } catch (err) {
    fail(err, 'Could not remove material.')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-5 p-4 rounded-xl bg-navy-950/60 border border-slate-800" data-testid="media-panel">
    <!-- Cover image -->
    <div class="space-y-2">
      <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
        {{ isCourse ? 'Course Cover Image' : 'Module Image' }}
      </label>
      <div class="flex items-center gap-4">
        <img v-if="coverUrl" :src="coverUrl" alt="Cover" class="w-32 h-20 object-cover rounded-lg border border-slate-700" />
        <div v-else class="w-32 h-20 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-[11px] text-slate-500">
          No image
        </div>
        <div class="space-y-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            :disabled="busy"
            data-testid="cover-input"
            class="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-500/20 file:text-gold-300"
            @change="onCoverSelected"
          />
          <button v-if="coverUrl" type="button" class="text-xs text-red-400 hover:text-red-300" :disabled="busy" @click="removeCover">
            Remove image
          </button>
        </div>
      </div>
    </div>

    <!-- Existing materials -->
    <div class="space-y-2">
      <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Learning Materials ({{ attachments.length }})
      </label>
      <p v-if="!attachments.length" class="text-xs text-slate-500">No videos, documents, audio or images attached yet.</p>
      <ul v-else class="space-y-2">
        <li
          v-for="att in attachments"
          :key="att.id"
          class="p-2.5 rounded-lg bg-navy-900/70 border border-slate-800 text-xs space-y-2"
          data-testid="attachment-row"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 truncate">
              <img v-if="att.kind === 'youtube'" :src="getYouTubeThumbnail(att.youtube_video_id)" alt="" class="w-12 h-7 object-cover rounded" />
              <img v-else-if="att.kind === 'image' && att.url" :src="att.url" alt="" class="w-12 h-7 object-cover rounded" />
              <span class="font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400">{{ kindLabels[att.kind] }}</span>
              <span class="text-white truncate">{{ att.title || att.file_name || att.youtube_video_id }}</span>
            </span>
            <button type="button" class="text-red-400 hover:text-red-300 shrink-0" :disabled="busy" @click="removeMaterial(att)">Remove</button>
          </div>

          <PdfViewer
            v-if="att.kind === 'pdf' && att.url"
            :src="att.url"
            :title="att.title || att.file_name || 'PDF Course Material'"
            :file-size-bytes="att.file_size_bytes"
            :dark="true"
            :default-open="false"
            height-class="h-[520px]"
          />
        </li>
      </ul>
    </div>

    <!-- Add material -->
    <div class="space-y-3 pt-3 border-t border-slate-800">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Type</label>
          <select v-model="form.kind" data-testid="material-kind" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" @change="onKindChange">
            <option value="youtube">YouTube Video</option>
            <option value="pdf">PDF Document</option>
            <option value="audio">Audio</option>
            <option value="image">Image</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Title (optional)</label>
          <input v-model="form.title" type="text" maxlength="255" class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white" placeholder="e.g. Course welcome video" />
        </div>
      </div>

      <div v-if="form.kind === 'youtube'">
        <label class="block text-[11px] font-semibold text-slate-400 uppercase mb-1">YouTube Video ID or Link</label>
        <input
          v-model="form.youtube_video_id"
          type="text"
          data-testid="material-youtube"
          class="w-full px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white font-mono"
          placeholder="e.g. Mh4f9AYRCZY or https://youtu.be/Mh4f9AYRCZY"
        />
        <p v-if="form.youtube_video_id" :class="['text-[11px] mt-1', validYoutube ? 'text-emerald-400' : 'text-amber-400']">
          {{ validYoutube ? `Video ID: ${parsedYoutubeId}` : 'Not a valid YouTube video ID yet.' }}
        </p>
      </div>
      <div v-else>
        <label class="block text-[11px] font-semibold text-slate-400 uppercase mb-1">File</label>
        <input
          ref="fileInput"
          type="file"
          :accept="accept"
          data-testid="material-file"
          class="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-500/20 file:text-gold-300"
          @change="onFileChange"
        />
      </div>

      <p v-if="error" class="text-xs text-red-400" data-testid="media-error">{{ error }}</p>

      <button type="button" class="btn btn-secondary text-xs font-bold" :disabled="busy" data-testid="add-material-btn" @click="addMaterial">
        {{ busy ? 'Working...' : '+ Add Material' }}
      </button>
    </div>
  </div>
</template>

