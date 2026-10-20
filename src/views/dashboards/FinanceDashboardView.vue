<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="space-y-6">
    <div class="glass p-6 sm:p-8 border-brass-400/20">
      <span class="badge-brass mb-2">Finance Operations</span>
      <h1 class="text-2xl font-bold tracking-tight text-white">Finance Console: {{ auth.user?.name }}</h1>
      <p class="text-xs text-ink-300 mt-1">Review M-Pesa STK push logs, record in-person cash payments, issue receipts and credit notes.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Today's Revenue</span>
        <div class="text-2xl font-bold text-success-400 mt-1">KES 0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Locked gap-free receipts</span>
      </div>
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Pending Cash Entries</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">School office cash desk</span>
      </div>
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Pending Refunds</span>
        <div class="text-2xl font-bold text-warning-400 mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">14-day policy window</span>
      </div>
      <div class="glass p-5">
        <span class="text-xs text-ink-400 font-medium">Credit Notes Issued</span>
        <div class="text-2xl font-bold text-white mt-1">0</div>
        <span class="text-[10px] text-ink-500 mt-1 block">Numbered refund documents</span>
      </div>
    </div>

    <div class="glass p-10 text-center max-w-md mx-auto">
      <div class="text-3xl mb-3">🧾</div>
      <h3 class="text-sm font-semibold text-white mb-1">Payment Engine Ready</h3>
      <p class="text-xs text-ink-400 leading-relaxed">
        Daraja STK push and school office cash entry ledger will activate in Phase 3.
      </p>
    </div>
  </div>
</template>
