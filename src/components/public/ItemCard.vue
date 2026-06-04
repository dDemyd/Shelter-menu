<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import type { Product } from '@/lib/database.types'
import { pickName, pickDescription, t } from '@/lib/i18n'
import { priceWithCurrency } from '@/lib/format'
import { toggleLike } from '@/lib/api'
import Icon from './Icon.vue'
import Badges from './Badges.vue'

const props = defineProps<{
  product: Product
  qty?: number
  isFav?: boolean
}>()

const emit = defineEmits<{
  (e: 'open', p: Product): void
  (e: 'preview', p: Product): void
  (e: 'preview-end'): void
  (e: 'add', p: Product): void
  (e: 'remove', p: Product): void
  (e: 'fav', p: Product): void
}>()

const root = ref<HTMLElement | null>(null)
const name = computed(() => pickName(props.product))
const desc = computed(() => pickDescription(props.product))
const price = computed(() => priceWithCurrency(props.product))
const unavailable = computed(() => !props.product.is_available)

// Likes — optimistic counter, RPC commits to DB.
const likes = ref<number>(props.product.likes_count ?? 0)
watch(() => props.product.likes_count, v => { if (typeof v === 'number') likes.value = v })

async function onFav(e: Event) {
  e.stopPropagation()
  const willLike = !props.isFav
  // optimistic
  likes.value = Math.max(0, likes.value + (willLike ? 1 : -1))
  emit('fav', props.product)
  const updated = await toggleLike(props.product.id, willLike)
  if (updated != null) likes.value = updated
}

// ── Gesture state ───────────────────────────────────────────────
// - swipe right: +1 to cart (orange stripe slides in from left)
// - swipe left:  -1 from cart (red stripe slides in from right)
// - long-press 2s: preview, 4s: open full
// - tap / short press: no-op
const HOLD_PREVIEW_MS = 2000
const HOLD_OPEN_MS = 4000
const SWIPE_COMMIT = 100      // px to actually commit a +/- swipe
const MOVE_CANCEL  = 12       // any move past this cancels long-press
const TAP_MAX_MS   = 350      // anything shorter than this with no movement = tap

const stripeProgress = ref(0)         // -1 .. +1 (signed)
const inPreview = ref(false)
let pressTimer: number | undefined
let openTimer: number | undefined
let startX = 0
let startY = 0
let startTime = 0
let active = false
let didSwipe = false
let didHoldOpen = false       // set true when openTimer fires

function clearTimers() {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = undefined }
  if (openTimer)  { clearTimeout(openTimer);  openTimer  = undefined }
}

function endPreview() {
  if (inPreview.value) {
    inPreview.value = false
    emit('preview-end')
  }
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 && e.pointerType === 'mouse') return
  active = true
  didSwipe = false
  didHoldOpen = false
  startX = e.clientX
  startY = e.clientY
  startTime = Date.now()
  stripeProgress.value = 0
  root.value?.setPointerCapture?.(e.pointerId)
  pressTimer = window.setTimeout(() => {
    if (active && !didSwipe) {
      inPreview.value = true
      emit('preview', props.product)
    }
  }, HOLD_PREVIEW_MS)
  openTimer = window.setTimeout(() => {
    if (active && !didSwipe) {
      didHoldOpen = true
      inPreview.value = false
      emit('open', props.product)
      active = false
      clearTimers()
    }
  }, HOLD_OPEN_MS)
}

function onPointerMove(e: PointerEvent) {
  if (!active) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  // vertical scroll → cancel everything
  if (Math.abs(dy) > MOVE_CANCEL && Math.abs(dy) > Math.abs(dx)) {
    clearTimers()
    endPreview()
    stripeProgress.value = 0
    active = false
    return
  }
  if (Math.abs(dx) > MOVE_CANCEL) {
    didSwipe = true
    clearTimers()
    endPreview()
    // clamp progress to ±SWIPE_COMMIT*1.4
    const clamped = Math.max(-SWIPE_COMMIT * 1.4, Math.min(SWIPE_COMMIT * 1.4, dx))
    stripeProgress.value = clamped / SWIPE_COMMIT
  }
}

function onPointerUp(e: PointerEvent) {
  if (didHoldOpen) {
    // open was already fired by openTimer; just cleanup
    didHoldOpen = false
    return
  }
  if (!active && !didSwipe) return
  const elapsed = Date.now() - startTime
  const wasInPreview = inPreview.value
  active = false
  clearTimers()
  endPreview()
  root.value?.releasePointerCapture?.(e.pointerId)

  if (didSwipe) {
    if (stripeProgress.value >= 1) {
      emit('add', props.product)
    } else if (stripeProgress.value <= -1 && (props.qty ?? 0) > 0) {
      emit('remove', props.product)
    }
  } else if (!wasInPreview && elapsed <= TAP_MAX_MS) {
    // Plain tap → open detail.
    emit('open', props.product)
  }
  // else: released during preview without reaching open threshold → silent cancel.

  stripeProgress.value = 0
}

function onPointerCancel(e: PointerEvent) {
  active = false
  didSwipe = false
  clearTimers()
  endPreview()
  stripeProgress.value = 0
  root.value?.releasePointerCapture?.(e.pointerId)
}

function bumpQty(e: Event) {
  e.stopPropagation()
  if (unavailable.value) return
  emit('add', props.product)
}

onBeforeUnmount(clearTimers)

const stripeStyle = computed(() => {
  const p = stripeProgress.value
  const w = Math.min(100, Math.abs(p) * 100)
  return {
    width: `${w}%`,
    background: p > 0
      ? 'linear-gradient(90deg, rgba(255,90,31,0.15) 0%, rgba(255,90,31,0.55) 100%)'
      : 'linear-gradient(-90deg, rgba(255,58,31,0.15) 0%, rgba(255,58,31,0.55) 100%)',
    left: p >= 0 ? '0' : 'auto',
    right: p < 0 ? '0' : 'auto',
  }
})

const showStripe = computed(() => Math.abs(stripeProgress.value) > 0.01)
const stripeIcon = computed(() => stripeProgress.value > 0 ? '+' : '−')
const stripeReady = computed(() => Math.abs(stripeProgress.value) >= 1)
</script>

<template>
  <article
    ref="root"
    class="item-card"
    :class="{
      'is-unavailable': unavailable,
      'is-preview':     inPreview,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <!-- Swipe stripe overlay (visual feedback, card itself doesn't move) -->
    <div v-show="showStripe" class="swipe-stripe" :style="stripeStyle">
      <span class="stripe-icon" :class="{ ready: stripeReady }">{{ stripeIcon }}</span>
    </div>

    <div class="img" :aria-hidden="true">
      <span class="corners" />
      <img v-if="product.image_url" :src="product.image_url" :alt="name" loading="lazy" width="120" height="120" draggable="false" />
      <div v-else class="placeholder">
        <span class="ph-oops">OOPS</span>
        <span class="ph-oops">...</span>
        <span class="ph-sub">no photo</span>
      </div>
    </div>

    <div class="body">
      <header class="title-row">
        <h3 class="name">{{ name }}</h3>
        <span class="price">{{ price }}</span>
      </header>

      <p v-if="desc" class="desc">{{ desc }}</p>

      <footer class="actions">
        <Badges :list="product.badges" />

        <button
          type="button"
          class="fav-counter"
          :class="{ liked: isFav }"
          :aria-pressed="isFav ? 'true' : 'false'"
          :aria-label="t.addedFav"
          @click="onFav"
          @pointerdown.stop
        >
          <Icon name="heart" :size="16" />
          <span v-if="likes > 0" class="fav-num">{{ likes }}</span>
        </button>

        <span class="spacer" aria-hidden="true" />

        <button
          v-if="(qty ?? 0) === 0"
          type="button"
          class="qty-add"
          :disabled="unavailable"
          :title="t.addToOrder"
          :aria-label="`${t.addToOrder} — ${name}`"
          @click="bumpQty"
          @pointerdown.stop
        >
          <Icon name="plus" :size="18" />
        </button>
        <button
          v-else
          type="button"
          class="qty-add qty-active"
          :title="t.addToOrder"
          :aria-label="`${t.addToOrder} — ${name}, ${qty} pcs`"
          @click="bumpQty"
          @pointerdown.stop
        >
          {{ qty }}
        </button>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.item-card {
  position: relative;
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 14px;
  padding: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
  transition: border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease;
}
.item-card.is-unavailable { opacity: 0.5; }
.item-card.is-preview {
  border-color: var(--accent);
  transform: scale(1.015);
  box-shadow: 0 12px 36px rgba(var(--accent-rgb), 0.35), 0 0 0 1px rgba(var(--accent-rgb), 0.45);
}

/* ── Image ─────────────────────────────────────────────── */
.img {
  position: relative;
  width: 112px;
  height: 112px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;
  flex: 0 0 112px;
}
.img img {
  width: 100%; height: 100%;
  object-fit: cover;
  -webkit-user-drag: none;
  transition: transform 320ms ease;
}
.item-card:hover .img img,
.item-card.is-preview .img img { transform: scale(1.06); }

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 4px;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(var(--accent-rgb), 0.10), transparent 70%),
    var(--bg-2);
  border: 1px dashed var(--line-2);
  border-radius: 4px;
}
.ph-oops {
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--accent);
  text-shadow: 0 0 10px rgba(var(--accent-rgb), 0.45);
}
.ph-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted-2);
}

/* ── Right body ────────────────────────────────────────── */
.body {
  display: flex; flex-direction: column; gap: 8px;
  min-width: 0;
}
.title-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 10px;
}
.name {
  margin: 0;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
  line-height: 1.15;
  color: var(--text);
}
.price {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  white-space: nowrap;
  padding-top: 2px;
}
.desc {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Actions row ───────────────────────────────────────── */
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}
.spacer { flex: 1; }

.fav-counter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 6px;
  color: #ff4d6d;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  transition: filter 140ms ease, transform 140ms ease;
}
.fav-counter svg { stroke: currentColor; fill: transparent; transition: fill 160ms ease; }
.fav-counter.liked svg { fill: currentColor; filter: drop-shadow(0 0 8px rgba(255, 77, 109, 0.55)); }
.fav-counter:hover, .fav-counter:focus-visible { filter: drop-shadow(0 0 6px rgba(255, 77, 109, 0.5)); }
.fav-counter:active { transform: scale(0.92); }
.fav-num { color: var(--text); }

.qty-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0 12px;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--line-2);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  transition: all 140ms ease;
}
.qty-add:hover, .qty-add:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
  box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.4);
}
.qty-add:active { transform: scale(0.94); }
.qty-add.qty-active {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.5);
}
.qty-add:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Swipe stripe overlay (paints over card, doesn't move card) ── */
.swipe-stripe {
  position: absolute;
  top: 0; bottom: 0;
  z-index: 4;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 80ms linear;
  will-change: width;
}
.stripe-icon {
  font-family: 'Unbounded', sans-serif;
  font-weight: 800;
  font-size: 28px;
  color: rgba(255,255,255,0.92);
  text-shadow: 0 0 12px rgba(0,0,0,0.5);
  transform: scale(0.85);
  transition: transform 160ms ease;
}
.stripe-icon.ready { transform: scale(1.15); }
</style>
