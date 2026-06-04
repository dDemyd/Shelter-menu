<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Product } from '@/lib/database.types'
import { pickName, pickDescription, t, lang } from '@/lib/i18n'
import { priceWithCurrency } from '@/lib/format'
import Icon from './Icon.vue'

const props = defineProps<{
  open: boolean
  items: Product[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open', p: Product): void
  (e: 'add', p: Product): void
}>()

const query = ref('')
const input = ref<HTMLInputElement | null>(null)

watch(() => props.open, async (o) => {
  if (!o) query.value = ''
  else { await nextTick(); input.value?.focus() }
})

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return props.items.filter(p => {
    const hay = [
      p.name_uk, p.name_en, p.description_uk, p.description_en, p.slug, ...(p.tags ?? []),
    ].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  }).slice(0, 30)
})

const placeholder = computed(() => lang.value === 'uk' ? 'Пошук по меню…' : 'Search the menu…')
const hintText = computed(() => lang.value === 'uk' ? 'ВВЕДІТЬ ЗАПИТ' : 'TYPE TO SEARCH')
</script>

<template>
  <teleport to="body">
    <template v-if="open">
      <div class="overlay" role="dialog" aria-modal="true" :aria-label="t.search" @click.self="emit('close')">
        <div class="panel">
          <header class="search-head">
            <Icon name="search" :size="22" />
            <input
              ref="input"
              v-model="query"
              type="search"
              :placeholder="placeholder"
              :aria-label="t.search"
              autocomplete="off"
              class="search-input"
            />
            <button class="close-btn" :aria-label="t.close" @click="emit('close')">
              <Icon name="close" :size="22" />
            </button>
          </header>

          <div class="divider" />

          <div class="results">
            <template v-if="results.length">
              <button
                v-for="p in results"
                :key="p.id"
                class="r-row"
                @click="emit('open', p)"
              >
                <span class="r-thumb">
                  <img v-if="p.image_url" :src="p.image_url" :alt="pickName(p)" loading="lazy" />
                </span>
                <span class="min-w-0 flex-1 text-left">
                  <span class="r-name">{{ pickName(p) }}</span>
                  <span class="r-desc">{{ pickDescription(p) }}</span>
                </span>
                <span class="r-price">{{ priceWithCurrency(p) }}</span>
              </button>
            </template>

            <p v-else-if="query" class="hint">{{ t.noResults }}</p>
            <p v-else class="hint">{{ hintText }}</p>
          </div>
        </div>
      </div>
    </template>
  </teleport>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  z-index: 90;
  background: rgba(13, 13, 13, 0.96);
  backdrop-filter: blur(10px);
  padding-top: env(safe-area-inset-top);
  animation: fadeIn 180ms ease-out;
  display: flex;
  justify-content: center;
}
.panel {
  width: 100%;
  max-width: 480px;
  padding: 18px 18px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 4px;
  color: var(--text);
}
.search-head svg { color: var(--text); flex: 0 0 auto; }
.search-input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--text);
  font-family: 'Manrope', sans-serif;
  font-size: clamp(20px, 5.5vw, 26px);
  font-weight: 500;
  letter-spacing: -0.01em;
  min-width: 0;
  padding: 0;
}
.search-input::placeholder { color: var(--muted); font-weight: 400; }
.close-btn {
  flex: 0 0 auto;
  width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--muted);
  border-radius: 4px;
}
.close-btn:hover, .close-btn:focus-visible { color: var(--text); }

.divider {
  height: 1px;
  background: var(--line);
  margin: 0 4px;
}

.results {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 0 32px;
}
.hint {
  text-align: center;
  margin-top: 40px;
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.r-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  text-align: left;
}
.r-row:hover, .r-row:focus-visible { border-color: var(--accent); }
.r-thumb {
  width: 48px; height: 48px;
  flex: 0 0 48px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-2);
  border: 1px solid var(--line);
}
.r-thumb img { width: 100%; height: 100%; object-fit: cover; }
.r-name {
  display: block;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.005em;
  color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.r-desc {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  color: var(--muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.r-price {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  white-space: nowrap;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
</style>
