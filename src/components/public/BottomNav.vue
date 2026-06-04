<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/lib/database.types'
import { pickName } from '@/lib/i18n'
import Icon from './Icon.vue'

const props = defineProps<{
  categories: Category[]
  active: string | null
}>()

const emit = defineEmits<{
  (e: 'select', slug: string): void
}>()

const iconFor: Record<string, string> = {
  bar: 'bar', cocktails: 'bar',
  coffee: 'coffee', kava: 'coffee',
  kitchen: 'kitchen', food: 'kitchen', kuhnya: 'kitchen',
  hookah: 'hookah', kalyan: 'hookah',
}

const items = computed(() =>
  props.categories.slice(0, 5).map(c => ({
    slug: c.slug,
    name: pickName(c),
    code: c.code,
    icon: iconFor[c.slug] ?? 'grid',
  }))
)
</script>

<template>
  <nav class="bottomnav" aria-label="Категорії меню">
    <button
      v-for="it in items"
      :key="it.slug"
      class="bn-item"
      :aria-current="active === it.slug ? 'page' : undefined"
      :aria-label="it.name"
      @click="emit('select', it.slug)"
    >
      <Icon :name="it.icon" :size="18" />
      <span class="lbl">{{ it.name }}</span>
      <span v-if="it.code" class="code" aria-hidden="true">{{ it.code }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottomnav {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  z-index: 40;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  background: linear-gradient(0deg, rgba(13,13,13,0.96) 0%, rgba(13,13,13,0.85) 100%);
  backdrop-filter: blur(14px) saturate(1.2);
  border-top: 1px solid var(--line-2);
  padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.5);
}
.bn-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 4px;
  min-height: 56px;
  color: var(--muted);
  font-family: 'Unbounded', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: color 140ms ease;
}
.bn-item .lbl { font-size: 10px; font-weight: 600; }
.bn-item .code {
  position: absolute;
  top: 2px; right: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.16em;
  color: var(--muted-2);
}
.bn-item:hover { color: var(--text); }
.bn-item[aria-current='page'] {
  color: var(--text);
}
.bn-item[aria-current='page']::before {
  content: '';
  position: absolute;
  top: 0; left: 18%; right: 18%;
  height: 2px;
  background: var(--accent);
  filter: drop-shadow(0 0 6px rgba(var(--accent-rgb), 0.8));
}
</style>
