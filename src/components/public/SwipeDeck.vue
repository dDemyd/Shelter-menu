<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Product } from '@/lib/database.types'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import { t } from '@/lib/i18n'
import Icon from './Icon.vue'
import SwipeCard from './SwipeCard.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps<{ products: Product[] }>()

const session = useSessionStore()
const cart = useCartStore()
const toast = useToast()

const index = ref(0)

const visible = computed(() => {
  const list: Product[] = []
  let i = index.value
  while (list.length < 3 && i < props.products.length) {
    const p = props.products[i]
    if (!session.hiddenInSwipe.has(p.id)) list.push(p)
    i++
  }
  return list
})

const current = computed(() => visible.value[0] ?? null)
const total = computed(() => props.products.length)

function next() {
  index.value += 1
}

function swipeRight(p: Product) {
  if (!session.isFav(p.id)) session.toggleFav(p.id)
  cart.add(p)
  toast.success(t.value.added)
  next()
}

function swipeLeft(p: Product) {
  session.hideInSwipe(p.id)
  toast.show(t.value.hidden)
  next()
}

function swipeDown(p: Product) {
  cart.add(p)
  toast.success(t.value.added)
  next()
}
</script>

<template>
  <div class="swipe-wrap">
    <template v-if="current">
      <div class="counter font-mono text-[10px] tracking-widest uppercase text-shelter-muted text-center">
        {{ index + 1 }} / {{ total }} · {{ t.nextCard }}
      </div>

      <div class="deck">
        <SwipeCard
          v-for="(p, i) in visible"
          :key="p.id"
          :product="p"
          :depth="i"
          :active="i === 0"
          @right="swipeRight(p)"
          @left="swipeLeft(p)"
          @down="swipeDown(p)"
        />
      </div>

      <div class="actions">
        <button class="action-btn dismiss" @click="swipeLeft(current)" :title="t.hidden">
          <Icon name="close" :size="22" />
        </button>
        <button class="action-btn add" @click="swipeDown(current)" :title="t.addToOrder">
          <Icon name="plus" :size="26" />
        </button>
        <button class="action-btn fav" @click="swipeRight(current)" :title="t.addedFav">
          <Icon name="heart" :size="22" />
        </button>
      </div>
    </template>

    <EmptyState
      v-else
      :title="t.noResults"
      :description="t.nextCard"
    >
      <button class="btn-ghost mt-2" @click="session.resetHidden(); index = 0">
        ↻ {{ t.swipeMode }}
      </button>
    </EmptyState>
  </div>
</template>

<style scoped>
.swipe-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 12px 12px;
  position: relative;
}
.counter { padding: 2px 0; }
.deck {
  position: relative;
  height: min(560px, calc(100dvh - 320px));
  min-height: 380px;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 8px 0;
}
.action-btn {
  width: 56px; height: 56px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--bg-2);
  color: var(--text);
  display: inline-flex; align-items: center; justify-content: center;
  transition: all 160ms ease;
}
.action-btn:active { transform: scale(0.95); }
.action-btn.dismiss:hover { border-color: #6e6760; color: #b6b1a8; }
.action-btn.add {
  width: 64px; height: 64px;
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
  box-shadow: 0 8px 22px rgba(var(--accent-rgb), 0.55);
}
.action-btn.fav:hover { color: var(--accent); border-color: var(--accent); box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.4); }
</style>
