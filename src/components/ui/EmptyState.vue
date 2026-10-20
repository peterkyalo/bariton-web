<script setup>
defineProps({
  title: { type: String, default: 'No records found' },
  description: { type: String, default: 'There is no data to display right now.' },
  icon: { type: String, default: '📭' },
})
</script>

<template>
  <div class="glass p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8">
    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
      {{ icon }}
    </div>
    <h3 class="text-base font-semibold text-white mb-1.5">{{ title }}</h3>
    <p class="text-xs text-ink-400 mb-5 leading-relaxed">{{ description }}</p>
    <slot name="action"></slot>
  </div>
</template>
