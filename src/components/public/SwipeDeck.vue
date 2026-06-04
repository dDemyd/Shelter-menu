<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const passedIds = ref<string[]>([])
const mode = ref<'all' | 'liked'>('all')

const deckProducts = computed(() => {
  if (mode.value === 'liked') {
    return props.products.filter(p => session.isSwipeLiked(p.id))
  }
  return props.products
})

const visible = computed(() => {
  return deckProducts.value
    .filter(p => !passedIds.value.includes(p.id) && !session.hiddenInSwipe.has(p.id))
    .slice(0, 3)
})

const current = computed(() => visible.value[0] ?? null)
const total = computed(() => deckProducts.value.length)
const likedCount = computed(() => session.swipeLiked.length)
const currentPosition = computed(() => Math.min(passedIds.value.length + 1, total.value))

watch(() => props.products, () => {
  mode.value = 'all'
  passedIds.value = []
})

function next(p: Product) {
  if (!passedIds.value.includes(p.id)) passedIds.value.push(p.id)
}

function swipeRight(p: Product) {
  session.likeInSwipe(p.id)
  toast.success(t.value.addedFav)
  next(p)
}

function swipeLeft(p: Product) {
  session.hideInSwipe(p.id)
  toast.show(t.value.hidden)
  next(p)
}

function swipeDown(p: Product) {
  cart.add(p)
  toast.success(t.value.added)
  next(p)
}

function reviewLiked() {
  if (!likedCount.value) return
  mode.value = 'liked'
  passedIds.value = []
}

function restartSwipe() {
  session.resetSwipeSelection()
  mode.value = 'all'
  passedIds.value = []
}
</script>

<template>
  <div class="swipe-wrap">
    <template v-if="current">
      <div class="counter font-mono text-[10px] tracking-widest uppercase text-shelter-muted text-center">
        {{ currentPosition }} / {{ total }} · {{ t.nextCard }}
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
      :title="likedCount ? t.swipeDone : t.noSwipeLikes"
      :description="t.swipeDoneSub"
    >
      <div class="done-actions">
        <button class="btn-primary done-btn" :disabled="likedCount === 0" @click="reviewLiked">
          <Icon name="heart" :size="16" />
          {{ t.reviewSwipeLiked }}
        </button>
        <button class="btn-ghost done-btn" @click="restartSwipe">
          ↻ {{ t.clearSwipeSelection }}
        </button>
      </div>
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
.done-actions {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}
.done-btn {
  width: 100%;
  min-height: 48px;
  white-space: normal;
  text-align: center;
}
</style>
