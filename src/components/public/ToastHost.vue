<script setup lang="ts">
import { useToast } from '@/composables/useToast'
const { toasts } = useToast()
</script>

<template>
  <div class="toast-host" aria-live="polite" aria-atomic="true">
    <transition-group name="toast" tag="div">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast--${t.variant}`" :role="t.variant === 'error' ? 'alert' : 'status'">
        {{ t.text }}
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  inset: 0 0 auto 0;
  top: env(safe-area-inset-top);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  padding-top: 16px;
  gap: 8px;
}
.toast {
  pointer-events: auto;
  font-family: 'Unbounded', sans-serif;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--bg-2);
  border: 1px solid var(--line-2);
  color: var(--text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.toast--success {
  border-color: var(--accent);
  color: var(--text);
  box-shadow: 0 8px 24px rgba(var(--accent-rgb), 0.35), 0 0 14px rgba(var(--accent-rgb), 0.35);
}
.toast--error {
  border-color: #ff3a1f;
  color: #ff8b73;
}
.toast-enter-from { opacity: 0; transform: translateY(-10px); }
.toast-leave-to   { opacity: 0; transform: translateY(-10px); }
.toast-enter-active, .toast-leave-active { transition: all 200ms ease; }
</style>
