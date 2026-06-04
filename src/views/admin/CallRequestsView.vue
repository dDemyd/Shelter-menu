<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'
import type { CallRequest } from '@/lib/database.types'
import Icon from '@/components/public/Icon.vue'

const toast = useToast()
const items = ref<CallRequest[]>([])
const filter = ref<'new' | 'all'>('new')
const audio = typeof Audio !== 'undefined'
  ? new Audio('data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
  : null

async function load() {
  let q = supabase.from('call_requests').select('*').order('created_at', { ascending: false }).limit(200)
  if (filter.value === 'new') q = q.in('status', ['new', 'accepted'])
  const { data } = await q
  items.value = (data as CallRequest[]) ?? []
}

let channel: any
onMounted(async () => {
  await load()
  channel = supabase
    .channel('call_requests-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'call_requests' }, async (payload) => {
      if (payload.eventType === 'INSERT') {
        items.value = [(payload.new as CallRequest), ...items.value]
        toast.success(`Нова заявка · Стіл №${(payload.new as any).table_number}`)
        try { audio?.play() } catch {}
      } else {
        await load()
      }
    })
    .subscribe()
})
onBeforeUnmount(() => { if (channel) supabase.removeChannel(channel) })

async function updateStatus(c: CallRequest, status: CallRequest['status']) {
  const { error } = await supabase.from('call_requests').update({ status }).eq('id', c.id)
  if (error) { toast.error(error.message); return }
  c.status = status
}

const STATUS_COLOR: Record<string, string> = {
  new: '#ff5a1f', accepted: '#ffd166', done: '#7fa896', cancelled: '#6e6760',
}

function ago(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return `${s}с`
  if (s < 3600) return `${Math.floor(s / 60)}хв`
  if (s < 86400) return `${Math.floor(s / 3600)}год`
  return `${Math.floor(s / 86400)}д`
}

const filtered = computed(() => items.value)
</script>

<template>
  <section>
    <header class="flex items-center justify-between gap-4 mb-4 flex-wrap">
      <h1 class="section-title text-2xl">Заявки</h1>
      <div class="flex gap-2">
        <button class="chip" :class="{ 'is-active': filter === 'new' }" @click="filter = 'new'; load()">активні</button>
        <button class="chip" :class="{ 'is-active': filter === 'all' }" @click="filter = 'all'; load()">всі</button>
      </div>
    </header>

    <ul class="list">
      <li v-for="c in filtered" :key="c.id" class="row" :style="`--st: ${STATUS_COLOR[c.status]}`">
        <div class="head">
          <div class="flex items-center gap-3">
            <span class="status-dot" />
            <span class="font-display text-lg tabular-nums">№{{ c.table_number }}</span>
            <span class="font-mono text-[10px] tracking-widest uppercase text-shelter-muted">{{ ago(c.created_at) }} тому</span>
          </div>
          <span class="font-mono text-[10px] tracking-widest uppercase" :style="`color: ${STATUS_COLOR[c.status]}`">
            {{ c.status }}
          </span>
        </div>

        <ul v-if="c.items?.length" class="items">
          <li v-for="(it, i) in c.items" :key="i">
            <span class="font-mono tabular-nums">{{ it.qty }} ×</span>
            <span>{{ it.name }}</span>
            <span v-if="it.price" class="font-mono tabular-nums text-shelter-muted">{{ Math.round(it.price * it.qty) }}₴</span>
          </li>
        </ul>
        <p v-else class="empty-line font-mono text-[10px] tracking-widest uppercase text-shelter-muted">
          Просто покликати
        </p>

        <p v-if="c.comment" class="comment">💬 {{ c.comment }}</p>

        <div class="actions">
          <button class="btn-ghost !h-9" :disabled="c.status === 'accepted'" @click="updateStatus(c, 'accepted')">✅ Прийнято</button>
          <button class="btn-ghost !h-9" :disabled="c.status === 'done'" @click="updateStatus(c, 'done')">🍹 Готово</button>
          <button class="btn-ghost !h-9" :disabled="c.status === 'cancelled'" @click="updateStatus(c, 'cancelled')">✖ Скасувати</button>
        </div>
      </li>
    </ul>

    <p v-if="!items.length" class="empty">Заявок поки немає</p>
  </section>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 10px; }
.row {
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid var(--st, var(--accent));
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.head { display: flex; align-items: center; justify-content: space-between; }
.status-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--st); box-shadow: 0 0 10px var(--st); }
.items { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; border-top: 1px dashed var(--line); }
.items li { display: flex; gap: 8px; font-size: 13px; }
.empty-line { padding-top: 6px; border-top: 1px dashed var(--line); }
.comment { font-size: 13px; color: var(--text); background: var(--surface-2); border: 1px dashed var(--line-2); padding: 8px; border-radius: 4px; }
.actions { display: flex; gap: 6px; flex-wrap: wrap; }
.empty { padding: 40px; text-align: center; color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; }
</style>
