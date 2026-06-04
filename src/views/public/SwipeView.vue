<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import { useCartStore } from '@/stores/cart'
import { useSessionStore } from '@/stores/session'
import { t, pickName } from '@/lib/i18n'

import AppHeader from '@/components/public/AppHeader.vue'
import AppFooter from '@/components/public/AppFooter.vue'
import BottomNav from '@/components/public/BottomNav.vue'
import SwipeDeck from '@/components/public/SwipeDeck.vue'
import CartSheet from '@/components/public/CartSheet.vue'
import Icon from '@/components/public/Icon.vue'

import { ref } from 'vue'

const router = useRouter()
const route = useRoute()
const menu = useMenuStore()
const cart = useCartStore()
const session = useSessionStore()
const cartOpen = ref(false)

onMounted(() => menu.load())

const slug = computed(() => (route.query.cat as string) || menu.visibleCategories[0]?.slug || '')
const category = computed(() => menu.visibleCategories.find(c => c.slug === slug.value) ?? null)

const products = computed(() => {
  if (!category.value) return []
  return menu.productsOf(category.value.id, null).filter(p => p.is_available)
})

function backToList() {
  router.push({ name: 'menu', query: { ...route.query, cat: slug.value } })
}

function selectCategory(s: string) {
  router.push({ name: 'menu', query: { ...route.query, cat: s } })
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <div class="topline">
      <button class="btn-ghost !h-9 !px-3 !text-xs" @click="backToList">
        <Icon name="arrow-left" :size="14" />
        {{ t.listMode }}
      </button>
      <h2 class="font-display uppercase tracking-wider text-sm text-shadow-neon">
        {{ category ? pickName(category) : '' }}
      </h2>
      <span class="font-mono text-[10px] tracking-widest uppercase text-shelter-muted">{{ t.swipeMode }}</span>
    </div>

    <SwipeDeck :products="products" />

    <div class="container">
      <AppFooter />
      <div style="height: 100px" />
    </div>

    <button
      v-if="cart.count > 0"
      class="fab"
      :aria-label="`${t.yourOrder} · ${cart.count} pos · ${Math.round(cart.total)}₴`"
      @click="cartOpen = true"
    >
      <Icon name="cart" :size="16" />
      <span>{{ Math.round(cart.total) }}₴</span>
    </button>

    <BottomNav :categories="menu.visibleCategories" :active="slug" @select="selectCategory" />

    <CartSheet :open="cartOpen" @close="cartOpen = false" />
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.topline {
  margin: 14px 0 6px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.container {
  padding: 14px;
}
</style>
