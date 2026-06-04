<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/lib/i18n'

defineProps<{ size?: number }>()

const primary = computed(() => t.value.wordPrimary)
const ariaLabel = computed(() => `${primary.value} — на головну`)
</script>

<template>
  <a class="brand" href="/menu" :aria-label="ariaLabel">
    <img
      src="/logo.png"
      :width="size ?? 40"
      :height="size ?? 40"
      class="mark"
      alt=""
      decoding="async"
    />
    <span class="word">{{ primary }}</span>
  </a>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.mark {
  flex: 0 0 auto;
  border-radius: 6px;
  object-fit: cover;
  box-shadow:
    0 0 14px rgba(var(--accent-rgb), 0.4),
    0 0 0 1px var(--line-2);
}

.word {
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: clamp(18px, 5.2vw, 22px);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--text);
  text-shadow: 0 0 14px rgba(var(--accent-rgb), 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>
