<script setup lang="ts">
import { t } from '@/lib/i18n'

defineProps<{ url: string }>()
</script>

<template>
  <a class="cta-tile" :href="url" target="_blank" rel="noopener">
    <span class="stripe" aria-hidden="true" />
    <div class="inner">
      <span class="tag">SHELTER · MIX LAB</span>
      <h3 class="title">{{ t.hookahConstructor }}</h3>
      <p class="desc">{{ t.hookahConstructorSub }}</p>
    </div>
    <span class="arrow" aria-hidden="true">→</span>
  </a>
</template>

<style scoped>
.cta-tile {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 16px 18px 16px 22px;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(400px 200px at 0% 100%, rgba(var(--accent-rgb), 0.15), transparent 70%),
    var(--bg-2);
  border: 1px solid rgba(var(--accent-rgb), 0.45);
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35), inset 0 0 16px rgba(var(--accent-rgb), 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 160ms ease;
}
.cta-tile:hover {
  border-color: var(--accent);
  box-shadow: 0 10px 26px rgba(var(--accent-rgb), 0.32), inset 0 0 22px rgba(var(--accent-rgb), 0.15);
}

.stripe {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--accent);
  box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.8);
}

.inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  text-shadow: 0 0 6px rgba(var(--accent-rgb), 0.5);
}
.title {
  margin: 0;
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: clamp(20px, 5vw, 24px);
  letter-spacing: -0.015em;
  line-height: 1.1;
  color: var(--text);
  text-shadow: 0 0 14px rgba(var(--accent-rgb), 0.5);
}
.desc {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: var(--muted);
}

.arrow {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: 999px;
  font-size: 22px;
  font-weight: 700;
  box-shadow: 0 0 18px rgba(var(--accent-rgb), 0.6);
}
</style>
