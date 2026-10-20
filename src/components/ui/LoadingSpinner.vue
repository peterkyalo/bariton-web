<script setup>
defineProps({
  size: { type: String, default: 'md' }, // sm, md, lg
  text: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 p-6 text-center">
    <div
      class="rounded-full border-2 border-white/10 border-t-brass-300 animate-spin"
      :class="{
        'w-5 h-5': size === 'sm',
        'w-8 h-8': size === 'md',
        'w-12 h-12': size === 'lg',
      }"
    ></div>
    <p v-if="text" class="text-xs font-medium text-ink-400">{{ text }}</p>
  </div>
</template>
