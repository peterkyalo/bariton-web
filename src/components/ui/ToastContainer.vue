<script setup>
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition"
        :class="{
          'bg-ink-900/95 border-success-500/30 text-white': toast.type === 'success',
          'bg-ink-900/95 border-danger-500/30 text-white': toast.type === 'error',
          'bg-ink-900/95 border-brass-300/30 text-white': toast.type === 'info',
        }"
      >
        <div class="mt-0.5 shrink-0">
          <span v-if="toast.type === 'success'" class="text-success-400">✓</span>
          <span v-else-if="toast.type === 'error'" class="text-danger-400">✕</span>
          <span v-else class="text-brass-300">ℹ</span>
        </div>
        <p class="text-sm font-medium leading-snug flex-1">{{ toast.message }}</p>
        <button
          type="button"
          class="text-ink-400 hover:text-white transition text-xs shrink-0 p-1"
          @click="ui.dismiss(toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
