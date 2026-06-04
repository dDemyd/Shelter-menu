<script setup lang="ts">
import { watch, onBeforeUnmount, computed } from 'vue'
import { useMyRequestsStore } from '@/stores/myRequests'
import { t, lang } from '@/lib/i18n'
import Icon from './Icon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useMyRequestsStore()

watch(() => props.open, (o) => {
  if (o) store.startPolling()
  else   store.stopPolling()
}, { immediate: true })

onBeforeUnmount(() => store.stopPolling())

const STATUS_COLOR: Record<string, string> = {
  new:        '#ff5a1f',
  accepted:   '#ffd166',
  done:       '#7fa896',
  cancelled:  '#6e6760',
}
const STATUS_LABEL = computed(() => {
  if (lang.value === 'en') return { new: 'New', accepted: 'Accepted', done: 'Done', cancelled: 'Cancelled' }
  return { new: 'Нова', accepted: 'Прийнято', done: 'Готово', cancelled: 'Скасовано' }
})

const KIND_LABEL = computed(() => {
  if (lang.value === 'en') return { call: 'Bartender call', order: 'Order' }
  return { call: 'Виклик бармена', order: 'Замовлення' }
})

const TITLE = computed(() => lang.value === 'en' ? 'My orders' : 'Мої замовлення')
const EMPTY = computed(() => lang.value === 'en' ? "You haven't sent any orders yet." : 'Ви ще не надсилали замовлень.')

function ago(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return `${s}с`
  if (s < 3600) return `${Math.floor(s / 60)}хв`
  if (s < 86400) return `${Math.floor(s / 3600)}год`
  return `${Math.floor(s / 86400)}д`
}
</script>

<template>
  <teleport to="body">
    <template v-if="open">
      <div class="sheet-scrim" @click="emit('close')" />
      <div class="sheet" role="dialog" aria-modal="true" :aria-label="TITLE">
        <div class="sheet-head">
          <div class="head-text">
            <h2 class="head-title">{{ TITLE }}</h2>
            <p class="head-sub">
              {{ store.items.length }} {{ lang === 'en' ? 'records' : 'записів' }}
            </p>
          </div>
          <button class="close-btn" @click="emit('close')" :aria-label="t.close">
            <Icon name="close" :size="16" />
          </button>
        </div>

        <div class="sheet-body">
          <p v-if="!store.items.length" class="empty">{{ EMPTY }}</p>

          <ul v-else class="rq-list">
            <li
              v-for="r in store.items"
              :key="r.id"
              class="rq"
              :style="`--st: ${STATUS_COLOR[r.status]}`"
            >
              <div class="rq-head">
                <span class="rq-kind">{{ KIND_LABEL[r.kind] }}</span>
                <span class="rq-time">{{ ago(r.created_at) }} тому</span>
                <span class="rq-status" :style="`color: ${STATUS_COLOR[r.status]}`">
                  ● {{ STATUS_LABEL[r.status] }}
                </span>
              </div>

              <ul v-if="r.items?.length" class="rq-items">
                <li v-for="(it, i) in r.items" :key="i">
                  <span class="rq-qty">{{ it.qty }} ×</span>
                  <span class="rq-name">{{ it.name }}</span>
                  <span v-if="it.price" class="rq-price">{{ Math.round(it.price * it.qty) }}₴</span>
                </li>
              </ul>

              <p v-if="r.comment" class="rq-comment">💬 {{ r.comment }}</p>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </teleport>
</template>

<style scoped>
.sheet-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 8px;
}
.head-title {
  margin: 0;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.01em;
  color: var(--text);
}
.head-sub {
  margin: 4px 0 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.close-btn {
  flex: 0 0 auto;
  width: 36px; height: 36px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line-2);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text);
}

.sheet-body { padding: 0 18px 24px; }

.empty {
  margin: 16px 0;
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
  background: var(--surface);
  border: 1px dashed var(--line-2);
  border-radius: 8px;
}

.rq-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.rq {
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid var(--st, var(--accent));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rq-head {
  display: flex; align-items: center; gap: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}
.rq-kind { color: var(--text); font-weight: 700; }
.rq-time { color: var(--muted-2); }
.rq-status { margin-left: auto; font-weight: 600; }

.rq-items { list-style: none; margin: 0; padding: 6px 0 0; display: flex; flex-direction: column; gap: 4px; border-top: 1px dashed var(--line); }
.rq-items li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: baseline;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
}
.rq-qty { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; color: var(--muted); }
.rq-name { color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rq-price { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; color: var(--text); font-weight: 600; }

.rq-comment {
  margin: 0;
  font-size: 12px;
  color: var(--text);
  background: var(--surface-2);
  border: 1px dashed var(--line-2);
  padding: 8px 10px;
  border-radius: 4px;
}
</style>
