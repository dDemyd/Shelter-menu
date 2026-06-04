<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/lib/database.types'
import { pickName, t } from '@/lib/i18n'
import { priceWithCurrency } from '@/lib/format'
import Icon from './Icon.vue'

const props = defineProps<{
  product: Product
  qty?: number
}>()

const emit = defineEmits<{
  (e: 'add', p: Product): void
  (e: 'open', p: Product): void
}>()

const name = computed(() => pickName(props.product))
const price = computed(() => priceWithCurrency(props.product))
const tag = computed(() => props.product.tags?.[0] ?? '')
const unavailable = computed(() => !props.product.is_available)

function add(e: Event) {
  e.stopPropagation()
  if (unavailable.value) return
  emit('add', props.product)
}
</script>

<template>
  <div class="list-row" :class="{ 'is-unavailable': unavailable }" @click="emit('open', product)">
    <span class="name">{{ name }}</span>
    <span v-if="tag" class="row-tag">{{ tag }}</span>
    <span class="price">{{ price }}</span>
    <button
      v-if="(qty ?? 0) === 0"
      class="qty-add"
      :disabled="unavailable"
      :title="t.addToOrder"
      :aria-label="`${t.addToOrder} — ${name}`"
      @click="add"
    >
      <Icon name="plus" :size="16" />
    </button>
    <button
      v-else
      class="qty-add qty-active"
      :title="t.addToOrder"
      :aria-label="`${qty} pcs`"
      @click="add"
    >
      {{ qty }}
    </button>
  </div>
</template>

<style scoped>
.list-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  border-bottom: 1px dashed var(--line);
  cursor: pointer;
}
.list-row.is-unavailable { opacity: 0.5; cursor: not-allowed; }
.name {
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: -0.005em;
  color: var(--text);
  text-align: left;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--muted);
}
.price {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--text);
}
.qty-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 44px;
  padding: 0 10px;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--line-2);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  transition: all 140ms ease;
}
.qty-add:hover, .qty-add:focus-visible { border-color: var(--accent); color: var(--accent); }
.qty-add:active { transform: scale(0.94); }
.qty-add.qty-active {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
  box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.4);
}
</style>
