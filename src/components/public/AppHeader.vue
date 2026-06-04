<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import BrandLogo from './BrandLogo.vue'
import HazardStripe from './HazardStripe.vue'
import Icon from './Icon.vue'
import { useMenuStore } from '@/stores/menu'
import { useMyRequestsStore } from '@/stores/myRequests'
import { lang, toggleLang, t } from '@/lib/i18n'
import { parseHours, isVenueOpen } from '@/lib/format'

defineEmits<{
  (e: 'search'): void
  (e: 'my-requests'): void
}>()

const menu = useMenuStore()
const myRequests = useMyRequestsStore()
const now = ref(new Date())
let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => { now.value = new Date() }, 30_000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

function pad(n: number) { return String(n).padStart(2, '0') }
const timeStr = computed(() => `${pad(now.value.getHours())}:${pad(now.value.getMinutes())}`)
const address = computed(() => menu.setting('venue_address', 'Я. МУДРОГО 17 · БЦ') as string)

const hoursStr = computed(() => menu.setting('venue_hours', '10:00 — 02:00') as string)
const isOpen = computed(() => isVenueOpen(parseHours(hoursStr.value), now.value))
const statusLabel = computed(() => isOpen.value ? t.value.statusOpen : t.value.statusClosed)
</script>

<template>
  <header class="header">
    <div class="header-stack">
      <div class="row-top">
        <BrandLogo :size="36" />

        <div class="actions">
          <button
            v-if="myRequests.records.length"
            class="icon-btn plain rq-btn"
            :title="lang === 'en' ? 'My orders' : 'Мої замовлення'"
            :aria-label="lang === 'en' ? 'My orders' : 'Мої замовлення'"
            @click="$emit('my-requests')"
          >
            <Icon name="bell" :size="22" />
            <span v-if="myRequests.activeCount" class="rq-badge">{{ myRequests.activeCount }}</span>
          </button>
          <button
            class="lang-btn"
            :aria-label="lang === 'uk' ? 'Switch to English' : 'Перемкнути на українську'"
            @click="toggleLang"
          >
            {{ lang === 'uk' ? 'EN' : 'UA' }}
          </button>
          <button
            class="icon-btn plain"
            :title="t.search"
            :aria-label="t.search"
            @click="$emit('search')"
          >
            <Icon name="search" :size="22" />
          </button>
        </div>
      </div>

      <div class="row-meta">
        <div class="status">
          <span class="dot" :class="isOpen ? 'dot-open' : 'dot-closed'" aria-hidden="true" />
          <span class="status-label" :class="{ 'is-closed': !isOpen }">{{ statusLabel }}</span>
          <span class="sep" aria-hidden="true">·</span>
          <span class="time tabular-nums">{{ timeStr }}</span>
        </div>
        <div class="address" :title="address">{{ address }}</div>
      </div>
    </div>

    <HazardStripe />
    <slot />
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: linear-gradient(180deg, rgba(13, 13, 13, 0.94) 0%, rgba(13, 13, 13, 0.78) 100%);
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid var(--line);
  padding-top: env(safe-area-inset-top);
}
.header-stack {
  padding: 10px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── row 1: logo + actions ───────────────────────────────────── */
.row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.lang-btn,
.icon-btn {
  min-width: 44px;
  min-height: 40px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-2);
  background: var(--surface);
  color: var(--text);
  border-radius: 4px;
  transition: all 140ms ease;
}
.lang-btn {
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.14em;
}
.icon-btn {
  padding: 0;
  width: 44px;
  height: 40px;
}
.icon-btn.plain {
  background: transparent;
  border: 0;
  color: var(--text);
  position: relative;
}
.rq-badge {
  position: absolute;
  top: 4px; right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.7);
}
.icon-btn.plain:hover, .icon-btn.plain:focus-visible {
  color: var(--accent);
  filter: drop-shadow(0 0 8px rgba(var(--accent-rgb), 0.6));
}
.lang-btn:hover, .lang-btn:focus-visible {
  border-color: var(--accent);
  color: var(--text);
  box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.35);
}

/* ── row 2: status + address ─────────────────────────────────── */
.row-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  min-width: 0;
}
.status .dot {
  width: 8px;
  height: 8px;
}
.dot-open {
  background: #3ddc8b;
  box-shadow: 0 0 12px rgba(61, 220, 139, 0.85);
}
.dot-closed {
  background: #ff3a4d;
  box-shadow: 0 0 12px rgba(255, 58, 77, 0.85);
  animation: none;
}
.status-label {
  color: var(--text);
  text-shadow: 0 0 8px rgba(61, 220, 139, 0.4);
}
.status-label.is-closed {
  color: #ff8b73;
  text-shadow: 0 0 8px rgba(255, 58, 77, 0.4);
}
.sep, .time { color: var(--muted); }

.address {
  color: var(--muted);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

@media (max-width: 360px) {
  .row-meta { font-size: 10px; letter-spacing: 0.14em; }
}
</style>
