<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  maxWidth: { type: String, default: 'max-w-lg' },
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 overflow-y-auto bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="fixed inset-0" @click="$emit('close')"></div>

        <div
          class="relative glass w-full p-6 sm:p-7 border-white/10 shadow-2xl z-10 transition-all transform"
          :class="maxWidth"
        >
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition"
              @click="$emit('close')"
            >
              ✕
            </button>
          </div>

          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
