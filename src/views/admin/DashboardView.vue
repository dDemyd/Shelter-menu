<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { supabase } from '@/lib/supabase'
import { pickName } from '@/lib/i18n'
import { parseHours, isVenueOpen } from '@/lib/format'
import type { CallRequest, Product } from '@/lib/database.types'

const menu = useMenuStore()

type Period = 'today' | '7d' | '30d' | 'all'
const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Сьогодні' },
  { id: '7d',    label: '7 днів' },
  { id: '30d',   label: 'Місяць' },
  { id: 'all',   label: 'Весь час' },
]
const period = ref<Period>('7d')

function sinceFor(p: Period): string | null {
  const d = new Date()
  if (p === 'today') {
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  if (p === '7d')  return new Date(Date.now() -  7 * 86_400_000).toISOString()
  if (p === '30d') return new Date(Date.now() - 30 * 86_400_000).toISOString()
  return null
}

const newCalls = ref(0)
const last24h  = ref(0)
const last7d   = ref(0)

const statusBreakdown = ref<Record<string, number>>({ new: 0, accepted: 0, done: 0, cancelled: 0 })
const hourlyHistogram = ref<number[]>(Array(24).fill(0))
const topLiked        = ref<Product[]>([])
const topOrdered      = ref<{ product_id: string; name: string; qty: number }[]>([])
const recent          = ref<CallRequest[]>([])
const totalLikes      = ref(0)
const totalRevenue    = ref(0)
const sessionPeakHour = ref<number | null>(null)

const now = ref(new Date())
let tick: number | undefined

const hoursStr = computed(() => menu.setting('venue_hours', '10:00 — 02:00') as string)
const isOpen = computed(() => isVenueOpen(parseHours(hoursStr.value), now.value))

async function load() {
  await menu.load()

  const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const sincePeriod = sinceFor(period.value)

  let periodQuery = supabase.from('call_requests').select('*')
  if (sincePeriod) periodQuery = periodQuery.gte('created_at', sincePeriod)

  let periodCountQuery = supabase.from('call_requests').select('id', { count: 'exact', head: true })
  if (sincePeriod) periodCountQuery = periodCountQuery.gte('created_at', sincePeriod)

  const [{ count: newC }, { count: c24 }, { count: cPer }, periodData, liked] = await Promise.all([
    supabase.from('call_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('call_requests').select('id', { count: 'exact', head: true }).gte('created_at', since24),
    periodCountQuery,
    periodQuery,
    supabase.from('products').select('id, name_uk, name_en, slug, image_url, likes_count, category_id, subcategory_id, description_uk, description_en, price, price_display, badges, tags, is_available, is_active, sort_order').gt('likes_count', 0).order('likes_count', { ascending: false }).limit(6),
  ])

  newCalls.value = newC ?? 0
  last24h.value  = c24 ?? 0
  last7d.value   = cPer ?? 0
  topLiked.value = (liked.data as Product[]) ?? []
  totalLikes.value = menu.products.reduce((s, p) => s + (p.likes_count ?? 0), 0)

  const rows = (periodData.data as CallRequest[]) ?? []
  recent.value = rows.slice(0, 6)

  // Status breakdown
  const status: Record<string, number> = { new: 0, accepted: 0, done: 0, cancelled: 0 }
  // Hourly histogram (last 24h)
  const hourly = Array(24).fill(0)
  // Top ordered aggregation
  const ordered = new Map<string, { name: string; qty: number }>()
  let revenue = 0

  for (const r of rows) {
    status[r.status] = (status[r.status] ?? 0) + 1
    const created = new Date(r.created_at)
    if (Date.now() - created.getTime() < 24 * 60 * 60 * 1000) {
      hourly[created.getHours()] += 1
    }
    for (const it of (r.items ?? [])) {
      const key = it.product_id ?? it.name
      const cur = ordered.get(key) ?? { name: it.name, qty: 0 }
      cur.qty += it.qty
      ordered.set(key, cur)
      if (it.price) revenue += it.price * it.qty
    }
  }
  statusBreakdown.value = status
  hourlyHistogram.value = hourly
  totalRevenue.value = Math.round(revenue)
  topOrdered.value = [...ordered.entries()]
    .map(([product_id, v]) => ({ product_id, name: v.name, qty: v.qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6)

  // peak hour
  if (hourly.some(x => x > 0)) {
    let peak = 0, peakIdx = 0
    hourly.forEach((v, i) => { if (v > peak) { peak = v; peakIdx = i } })
    sessionPeakHour.value = peakIdx
  } else {
    sessionPeakHour.value = null
  }
}

onMounted(() => {
  tick = window.setInterval(() => { now.value = new Date() }, 30_000)
  load()
})
onBeforeUnmount(() => { if (tick) clearInterval(tick) })

watch(period, () => load())

const periodLabel = computed(() => PERIODS.find(p => p.id === period.value)?.label ?? '')

const maxHourly = computed(() => Math.max(1, ...hourlyHistogram.value))
const statusColors: Record<string, string> = {
  new: '#ff5a1f',
  accepted: '#ffd166',
  done: '#7fa896',
  cancelled: '#6e6760',
}
const statusLabel: Record<string, string> = {
  new: 'НОВІ',
  accepted: 'ПРИЙНЯТО',
  done: 'ГОТОВО',
  cancelled: 'СКАСОВАНО',
}

function pad(n: number) { return String(n).padStart(2, '0') }
function ago(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return `${s}с`
  if (s < 3600) return `${Math.floor(s / 60)}хв`
  if (s < 86400) return `${Math.floor(s / 3600)}год`
  return `${Math.floor(s / 86400)}д`
}
</script>

<template>
  <section class="dash">
    <!-- ── Hero strip ─────────────────────────────────── -->
    <div class="hero">
      <div class="hero-meta">
        <span class="hero-label">SHELTER · CONTROL ROOM</span>
        <h1 class="hero-title">Зведення ніч-{{ Math.floor((Date.now() - new Date('2021-01-01').getTime()) / 86_400_000) }}</h1>
      </div>
      <div class="hero-status" :class="{ closed: !isOpen }">
        <span class="hero-dot" />
        <div>
          <div class="hero-status-label">{{ isOpen ? 'ВІДЧИНЕНО' : 'ЗАЧИНЕНО' }}</div>
          <div class="hero-status-sub">{{ hoursStr }}</div>
        </div>
      </div>
    </div>

    <!-- ── Period picker ───────────────────────────────── -->
    <div class="period-row" role="group" aria-label="Період зведення">
      <button
        v-for="p in PERIODS"
        :key="p.id"
        class="period-chip"
        :class="{ 'is-active': period === p.id }"
        :aria-pressed="period === p.id ? 'true' : 'false'"
        @click="period = p.id"
      >{{ p.label }}</button>
    </div>

    <!-- ── KPI cards ──────────────────────────────────── -->
    <div class="kpi-row">
      <div class="kpi accent" :class="{ pulse: newCalls > 0 }">
        <span class="kpi-label">Активні заявки</span>
        <span class="kpi-val">{{ newCalls }}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">За 24 години</span>
        <span class="kpi-val">{{ last24h }}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">{{ periodLabel }} · заявок</span>
        <span class="kpi-val">{{ last7d }}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">{{ periodLabel }} · виторг</span>
        <span class="kpi-val">{{ totalRevenue }}₴</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Загалом сердець</span>
        <span class="kpi-val">{{ totalLikes }}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Пік активності</span>
        <span class="kpi-val">{{ sessionPeakHour !== null ? `${pad(sessionPeakHour)}:00` : '—' }}</span>
      </div>
    </div>

    <div class="grid-main">
      <!-- ── Hourly histogram (24h) ───────────────────── -->
      <section class="card chart-card">
        <header class="card-head">
          <h2>Активність · 24 години</h2>
          <span class="card-sub">{{ last24h }} заявок</span>
        </header>
        <div class="histogram">
          <div
            v-for="(v, i) in hourlyHistogram"
            :key="i"
            class="bar-cell"
          >
            <div class="bar" :style="{ height: `${(v / maxHourly) * 100}%` }">
              <span v-if="v > 0" class="bar-val">{{ v }}</span>
            </div>
            <span class="bar-label">{{ pad(i) }}</span>
          </div>
        </div>
      </section>

      <!-- ── Status breakdown ─────────────────────────── -->
      <section class="card status-card">
        <header class="card-head">
          <h2>Стани заявок</h2>
          <span class="card-sub">{{ periodLabel }}</span>
        </header>
        <ul class="status-list">
          <li v-for="(label, key) in statusLabel" :key="key">
            <span class="status-dot" :style="{ background: statusColors[key] }" />
            <span class="status-name">{{ label }}</span>
            <span class="status-num">{{ statusBreakdown[key] ?? 0 }}</span>
          </li>
        </ul>
      </section>

      <!-- ── Top liked ────────────────────────────────── -->
      <section class="card list-card">
        <header class="card-head">
          <h2>♥ ТОП за лайками</h2>
          <span class="card-sub">{{ topLiked.length }} позицій</span>
        </header>
        <ul v-if="topLiked.length" class="rank-list">
          <li v-for="(p, i) in topLiked" :key="p.id">
            <span class="rank-num">#{{ i + 1 }}</span>
            <span class="rank-thumb">
              <img v-if="p.image_url" :src="p.image_url" :alt="pickName(p)" loading="lazy" />
            </span>
            <span class="rank-name">{{ pickName(p) }}</span>
            <span class="rank-meta">{{ p.likes_count }}</span>
          </li>
        </ul>
        <p v-else class="empty-state">Лайків поки немає</p>
      </section>

      <!-- ── Top ordered ──────────────────────────────── -->
      <section class="card list-card">
        <header class="card-head">
          <h2>🍸 ТОП за замовленнями</h2>
          <span class="card-sub">{{ periodLabel }}</span>
        </header>
        <ul v-if="topOrdered.length" class="rank-list">
          <li v-for="(p, i) in topOrdered" :key="p.product_id">
            <span class="rank-num">#{{ i + 1 }}</span>
            <span class="rank-name">{{ p.name }}</span>
            <span class="rank-meta">×{{ p.qty }}</span>
          </li>
        </ul>
        <p v-else class="empty-state">Замовлень поки немає</p>
      </section>

      <!-- ── Recent feed ──────────────────────────────── -->
      <section class="card list-card feed-card">
        <header class="card-head">
          <h2>Останні заявки</h2>
          <RouterLink to="/admin/call-requests" class="link-all">всі →</RouterLink>
        </header>
        <ul v-if="recent.length" class="feed-list">
          <li v-for="r in recent" :key="r.id" :style="`--st: ${statusColors[r.status]}`">
            <div class="feed-head">
              <span class="feed-dot" />
              <span class="feed-table">{{ r.table_number }}</span>
              <span class="feed-time">{{ ago(r.created_at) }} тому</span>
              <span class="feed-status">{{ statusLabel[r.status] }}</span>
            </div>
            <p v-if="r.items?.length" class="feed-items">
              {{ r.items.map(i => `${i.qty}× ${i.name}`).join(', ') }}
            </p>
            <p v-else class="feed-items muted">Просто покликати</p>
          </li>
        </ul>
        <p v-else class="empty-state">Заявок поки немає</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ── Hero ──────────────────────────────────────── */
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(600px 200px at 0% 0%, rgba(var(--accent-rgb), 0.10), transparent 60%),
    var(--bg-2);
  border: 1px solid var(--line-2);
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--accent);
  box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.7);
}
.hero-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
}
.hero-title {
  margin: 6px 0 0;
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 28px;
  letter-spacing: -0.015em;
  color: var(--text);
}
.hero-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: 6px;
}
.hero-dot {
  width: 10px; height: 10px;
  border-radius: 999px;
  background: #3ddc8b;
  box-shadow: 0 0 14px rgba(61, 220, 139, 0.85);
  animation: pulse 2.4s ease-in-out infinite;
}
.hero-status.closed .hero-dot {
  background: #ff3a4d;
  box-shadow: 0 0 14px rgba(255, 58, 77, 0.85);
  animation: none;
}
.hero-status-label {
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text);
}
.hero-status.closed .hero-status-label { color: #ff8b73; }
.hero-status-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.3); opacity: 1; }
}

/* ── Period picker ─────────────────────────────── */
.period-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.period-chip {
  padding: 8px 14px;
  font-family: 'Unbounded', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  transition: all 140ms ease;
}
.period-chip:hover, .period-chip:focus-visible { color: var(--text); border-color: var(--line-2); }
.period-chip.is-active {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.45);
}

/* ── KPI row ──────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.kpi {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  transition: border-color 160ms ease;
}
.kpi:hover { border-color: var(--line-2); }
.kpi.accent {
  border-color: var(--accent);
  box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.25);
}
.kpi.pulse { animation: pulse-border 2.4s ease-in-out infinite; }
@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.22); }
  50%      { box-shadow: 0 0 22px rgba(var(--accent-rgb), 0.55); }
}
.kpi-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}
.kpi-val {
  margin-top: 8px;
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 30px;
  letter-spacing: -0.01em;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* ── Main grid ────────────────────────────────── */
.grid-main {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  grid-auto-rows: min-content;
  gap: 14px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
}
.card-head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.card-head h2 {
  margin: 0;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text);
}
.card-sub, .link-all {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}
.link-all { color: var(--accent); }
.link-all:hover { text-shadow: 0 0 8px rgba(var(--accent-rgb), 0.55); }
.empty-state {
  padding: 20px 0;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted-2);
}

/* Chart card spans both cols on top */
.chart-card { grid-column: 1 / -1; }

/* ── Histogram ────────────────────────────────── */
.histogram {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 4px;
  height: 140px;
  align-items: end;
}
.bar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.bar {
  width: 100%;
  background: linear-gradient(180deg, var(--accent) 0%, rgba(var(--accent-rgb), 0.4) 100%);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  position: relative;
  transition: filter 120ms ease;
  display: flex; align-items: flex-start; justify-content: center;
}
.bar:hover { filter: brightness(1.3); }
.bar-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  color: var(--accent-ink);
  font-weight: 700;
  padding-top: 1px;
}
.bar-label {
  margin-top: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
}
@media (max-width: 720px) {
  .histogram { grid-template-columns: repeat(12, 1fr); gap: 3px; }
  .bar-cell:nth-child(2n) { display: none; }
}

/* ── Status list ──────────────────────────────── */
.status-list, .rank-list, .feed-list {
  list-style: none; margin: 0; padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.status-list li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.status-dot { width: 10px; height: 10px; border-radius: 999px; box-shadow: 0 0 8px currentColor; }
.status-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--muted);
}
.status-num {
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

/* ── Rank lists ───────────────────────────────── */
.rank-list li {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  min-width: 0;
}
.rank-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--muted-2);
  font-weight: 700;
}
.rank-thumb {
  width: 32px; height: 32px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--line);
}
.rank-thumb img { width: 100%; height: 100%; object-fit: cover; }
.rank-name {
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  min-width: 0;
}
.rank-meta {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 13px;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

/* ── Feed ──────────────────────────────────────── */
.feed-card { grid-column: 1 / -1; }
.feed-list li {
  padding: 10px 12px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-left: 2px solid var(--st, var(--accent));
  border-radius: 6px;
}
.feed-head {
  display: flex; align-items: center; gap: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}
.feed-dot {
  width: 8px; height: 8px;
  border-radius: 999px;
  background: var(--st, var(--accent));
  box-shadow: 0 0 8px var(--st, var(--accent));
}
.feed-table {
  font-weight: 700;
  color: var(--text);
}
.feed-time { color: var(--muted-2); }
.feed-status { margin-left: auto; color: var(--st, var(--accent)); }
.feed-items {
  margin: 6px 0 0;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  color: var(--text);
}
.feed-items.muted { color: var(--muted); font-style: italic; }

@media (max-width: 900px) {
  .grid-main { grid-template-columns: 1fr; }
  .hero-title { font-size: 22px; }
  .hero { flex-direction: column; align-items: flex-start; }
}
</style>
