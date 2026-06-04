<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useSessionStore } from '@/stores/session'
import { useMyRequestsStore } from '@/stores/myRequests'
import { useToast } from '@/composables/useToast'
import { t, pickName } from '@/lib/i18n'
import { callBartender } from '@/lib/api'
import Icon from './Icon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const cart = useCartStore()
const session = useSessionStore()
const myRequests = useMyRequestsStore()
const toast = useToast()
const submitting = ref(false)
const sent = ref(false)

const total = computed(() => Math.round(cart.total))
const hasTable = computed(() => !!session.table)
const hasItems = computed(() => !cart.isEmpty)

const phoneValid = computed(() => /^[+\d][\d\s\-()]{4,}$/.test(session.phone.trim()))
const canSubmit = computed(() => hasTable.value || phoneValid.value)

async function submit(kind: 'call' | 'order') {
  if (submitting.value) return
  if (kind === 'order' && !hasItems.value) return
  if (!canSubmit.value) {
    toast.error(t.value.contactRequired)
    return
  }
  submitting.value = true
  const res = await callBartender({
    kind,
    table: session.table || undefined,
    phone: !session.table ? session.phone.trim() : undefined,
    items: cart.toRequestItems(),
    comment: cart.comment || undefined,
  })
  submitting.value = false
  if (!res.ok) {
    toast.error(res.error)
    return
  }
  // Track the request locally so the guest sees it in «Мої замовлення».
  myRequests.add({
    id: res.id,
    kind,
    total: Math.round(cart.total),
    count: cart.count,
    ts: new Date().toISOString(),
  })
  myRequests.refresh()

  sent.value = true
  toast.success(kind === 'order' ? t.value.orderSent : t.value.barmanCalled)
  setTimeout(() => {
    if (kind === 'order') cart.clear()
    sent.value = false
    emit('close')
  }, 1400)
}
</script>

<template>
  <teleport to="body">
    <template v-if="open">
      <div class="sheet-scrim" @click="emit('close')" />
      <div class="sheet">
        <!-- Header -->
        <div class="sheet-head">
          <div class="head-text">
            <h2 class="head-title">{{ t.yourOrder }}</h2>
            <p class="head-sub">
              <span v-if="hasItems">{{ cart.count }} pos</span>
              <span v-if="hasItems && hasTable" class="dot-sep">·</span>
              <span v-if="hasTable" class="table-badge">{{ t.table }} №{{ session.table }}</span>
            </p>
          </div>
          <button class="close-btn" @click="emit('close')" :title="t.close" :aria-label="t.close">
            <Icon name="close" :size="16" />
          </button>
        </div>

        <div class="sheet-body">
          <!-- Items -->
          <ul v-if="hasItems" class="lines">
            <li v-for="line in cart.lines" :key="line.id" class="cart-line">
              <div class="cart-thumb">
                <img v-if="line.image_url" :src="line.image_url" :alt="pickName(line)" loading="lazy" />
              </div>
              <div class="cart-meta">
                <div class="cart-name">{{ pickName(line) }}</div>
                <div class="cart-price">
                  {{ line.qty }} × {{ line.price ?? '—' }}{{ line.price ? '₴' : '' }}
                </div>
              </div>
              <div class="cart-controls" role="group" :aria-label="pickName(line)">
                <button class="qty-btn" aria-label="−1" @click="cart.remove(line.id)"><Icon name="minus" :size="12" /></button>
                <span class="qty-val" aria-live="polite">{{ line.qty }}</span>
                <button class="qty-btn" aria-label="+1" @click="cart.add({
                  id: line.id, name_uk: line.name_uk, name_en: line.name_en,
                  price: line.price, price_display: line.price_display, image_url: line.image_url,
                  badges: [], tags: [], is_available: true, is_active: true, sort_order: 0,
                  category_id: '', subcategory_id: null, slug: '',
                  description_uk: null, description_en: null,
                } as any)">
                  <Icon name="plus" :size="12" />
                </button>
                <button class="trash-btn" :aria-label="t.delete" @click="cart.removeAll(line.id)"><Icon name="trash" :size="14" /></button>
              </div>
            </li>
          </ul>

          <p v-else class="empty-cart">{{ t.emptyCart }}</p>

          <!-- Total row -->
          <div v-if="hasItems" class="total-row">
            <span class="total-lbl">{{ t.total }}</span>
            <span class="total-val">{{ total }}₴</span>
          </div>

          <!-- Comment -->
          <div class="field">
            <label class="label" for="cart-comment">{{ t.addComment }}</label>
            <textarea
              id="cart-comment"
              v-model="cart.comment"
              class="input"
              :placeholder="t.commentPh"
              rows="2"
            />
          </div>

          <!-- Phone (only when no table) -->
          <div v-if="!hasTable" class="field">
            <label class="label" for="cart-phone">
              {{ t.contact }}
              <span class="req">*</span>
            </label>
            <input
              id="cart-phone"
              v-model="session.phone"
              class="input"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              :placeholder="t.contactPh"
            />
            <p v-if="!phoneValid && session.phone" class="field-hint">{{ t.contactRequired }}</p>
          </div>
        </div>

        <!-- Actions: vertical stack, call bartender first, submit order second -->
        <div class="actions">
          <button
            v-if="hasTable || phoneValid"
            class="btn-stack btn-ghost"
            :disabled="submitting"
            @click="submit('call')"
          >
            <Icon name="bell" :size="16" />
            {{ t.callBartender }}
          </button>

          <button
            v-if="hasItems"
            class="btn-stack btn-primary"
            :disabled="submitting || !canSubmit"
            @click="submit('order')"
          >
            <Icon name="check" :size="16" />
            {{ t.submitOrder }}
          </button>

          <p v-if="!hasTable && !hasItems && !phoneValid" class="hint-text">
            {{ t.contactRequired }}
          </p>
        </div>

        <transition name="fade">
          <div v-if="sent" class="success-veil">
            <Icon name="check" :size="48" />
            <p class="success-text">{{ t.orderSent }}</p>
          </div>
        </transition>
      </div>
    </template>
  </teleport>
</template>

<style scoped>
/* ── Header ──────────────────────────────────────────────── */
.sheet-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 8px;
}
.head-text { min-width: 0; }
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
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.dot-sep { opacity: 0.4; }
.table-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(var(--accent-rgb), 0.15);
  border: 1px solid rgba(var(--accent-rgb), 0.45);
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.16em;
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

/* ── Body ────────────────────────────────────────────────── */
.sheet-body {
  padding: 0 18px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.lines { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.cart-line {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.cart-thumb {
  width: 56px; height: 56px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;
}
.cart-thumb img { width: 100%; height: 100%; object-fit: cover; }
.cart-meta { min-width: 0; }
.cart-name {
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.005em;
  color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cart-price {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  margin-top: 2px;
}
.cart-controls { display: flex; align-items: center; gap: 4px; }
.qty-btn {
  min-width: 44px; min-height: 44px;
  width: 30px; height: 30px;
  border-radius: 4px;
  background: var(--surface-2);
  color: var(--text);
  display: inline-flex; align-items: center; justify-content: center;
}
.qty-btn:hover, .qty-btn:focus-visible { background: var(--accent); color: var(--accent-ink); }
.qty-val { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 13px; width: 22px; text-align: center; }
.trash-btn {
  min-width: 44px; min-height: 44px;
  width: 34px; height: 34px;
  border-radius: 4px;
  color: var(--muted);
  margin-left: 4px;
  display: inline-flex; align-items: center; justify-content: center;
}
.trash-btn:hover, .trash-btn:focus-visible { color: #ff8b73; }

.empty-cart {
  margin: 4px 0;
  padding: 18px 14px;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
  background: var(--surface);
  border: 1px dashed var(--line-2);
  border-radius: 6px;
}

.total-row {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid var(--line);
}
.total-lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}
.total-val {
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  text-shadow: 0 0 12px rgba(var(--accent-rgb), 0.35);
}

.field { display: flex; flex-direction: column; gap: 6px; }
.req { color: var(--accent); margin-left: 3px; }
.field-hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: #ff8b73;
}

/* ── Actions ─────────────────────────────────────────────── */
.actions {
  padding: 12px 18px calc(18px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--line);
  background:
    linear-gradient(180deg, transparent 0%, rgba(13, 13, 13, 0.6) 100%),
    var(--bg-2);
}
.btn-stack {
  width: 100%;
  min-height: 52px;
}
.hint-text {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 12px 8px;
}

.success-veil {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  background: rgba(13, 13, 13, 0.92);
  backdrop-filter: blur(10px);
  z-index: 5;
}
.success-text {
  margin-top: 12px;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  letter-spacing: -0.005em;
  font-size: 18px;
}
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
</style>
