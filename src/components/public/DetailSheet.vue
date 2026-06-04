<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/lib/database.types'
import { pickName, pickDescription, t } from '@/lib/i18n'
import { priceWithCurrency } from '@/lib/format'
import Icon from './Icon.vue'
import Badges from './Badges.vue'

const props = defineProps<{
  product: Product | null
  qty: number
  isFav: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add', p: Product): void
  (e: 'remove', p: Product): void
  (e: 'fav', p: Product): void
}>()

const name = computed(() => pickName(props.product))
const desc = computed(() => pickDescription(props.product))
const price = computed(() => props.product ? priceWithCurrency(props.product) : '')
</script>

<template>
  <teleport to="body">
    <template v-if="product">
      <div class="sheet-scrim" @click="emit('close')" />
      <div class="sheet" role="dialog" aria-modal="true" :aria-label="name">
        <button class="close-btn" @click="emit('close')" :title="t.close" :aria-label="t.close">
          <Icon name="close" :size="16" />
        </button>

        <div v-if="product.image_url" class="detail-img" :style="`background-image: url('${product.image_url}')`" />
        <div v-else class="detail-img placeholder">
          <span class="ph-oops">OOPS…</span>
          <span class="ph-sub">no photo</span>
        </div>

        <div class="px-4 pt-4 pb-6 flex flex-col gap-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-display font-semibold text-2xl leading-tight" style="letter-spacing: -0.015em">{{ name }}</h2>
              <p v-if="product.tags?.length" class="mt-1 font-mono text-[10px] tracking-widest uppercase text-shelter-muted">
                {{ product.tags.join(' · ') }}
              </p>
            </div>
            <span class="font-mono font-semibold tabular-nums text-lg whitespace-nowrap">{{ price }}</span>
          </div>

          <Badges :list="product.badges" />

          <p v-if="desc" class="text-sm leading-relaxed text-shelter-muted">{{ desc }}</p>

          <div class="flex items-center gap-2 mt-2">
            <button class="fav-btn" :aria-pressed="isFav ? 'true' : 'false'" :aria-label="t.addedFav" @click="emit('fav', product)">
              <Icon name="heart" :size="16" />
            </button>

            <div class="qty-control" role="group" :aria-label="t.addToOrder">
              <button class="qty-btn" :disabled="qty <= 0" aria-label="−1" @click="emit('remove', product)">
                <Icon name="minus" :size="14" />
              </button>
              <span class="qty-val font-mono tabular-nums" aria-live="polite">{{ qty }}</span>
              <button class="qty-btn" :disabled="!product.is_available" aria-label="+1" @click="emit('add', product)">
                <Icon name="plus" :size="14" />
              </button>
            </div>

            <button class="btn-primary flex-1" :disabled="!product.is_available" @click="emit('add', product)">
              {{ t.addToOrder }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </teleport>
</template>

<style scoped>
.close-btn {
  position: absolute;
  top: 10px; right: 10px;
  width: 36px; height: 36px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--line-2);
  color: var(--text);
  display: inline-flex; align-items: center; justify-content: center;
  z-index: 2;
}
.detail-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 360px;
  background-color: var(--bg-2);
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid var(--line-2);
  filter: saturate(1.05);
}
.detail-img.placeholder {
  background:
    radial-gradient(60% 60% at 50% 30%, rgba(var(--accent-rgb), 0.08), transparent 70%),
    linear-gradient(135deg, var(--bg-2), var(--bg));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.ph-oops {
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 32px;
  letter-spacing: 0.18em;
  color: var(--accent);
  text-shadow: 0 0 18px rgba(var(--accent-rgb), 0.5);
}
.ph-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--muted-2);
}
.qty-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  height: 48px;
  overflow: hidden;
}
.qty-btn {
  width: 44px; height: 48px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--surface);
  color: var(--text);
}
.qty-btn:hover:not(:disabled),
.qty-btn:focus-visible:not(:disabled) { background: var(--surface-2); color: var(--accent); }
.qty-btn:disabled { opacity: 0.4; }
.qty-val { padding: 0 14px; min-width: 40px; text-align: center; font-weight: 600; }
</style>
