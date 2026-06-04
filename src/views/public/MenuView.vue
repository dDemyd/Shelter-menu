<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import { useCartStore } from '@/stores/cart'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { t, pickName } from '@/lib/i18n'
import type { Product } from '@/lib/database.types'

import AppHeader from '@/components/public/AppHeader.vue'
import AppFooter from '@/components/public/AppFooter.vue'
import BottomNav from '@/components/public/BottomNav.vue'
import ItemCard from '@/components/public/ItemCard.vue'
import ListRow from '@/components/public/ListRow.vue'
import CategoryBanner from '@/components/public/CategoryBanner.vue'
import HookahConstructorCTA from '@/components/public/HookahConstructorCTA.vue'
import CartSheet from '@/components/public/CartSheet.vue'
import DetailSheet from '@/components/public/DetailSheet.vue'
import SearchOverlay from '@/components/public/SearchOverlay.vue'
import MyRequestsSheet from '@/components/public/MyRequestsSheet.vue'
import EmptyState from '@/components/public/EmptyState.vue'
import Skeleton from '@/components/public/Skeleton.vue'
import Icon from '@/components/public/Icon.vue'

const router = useRouter()
const route = useRoute()
const menu = useMenuStore()
const cart = useCartStore()
const session = useSessionStore()
const toast = useToast()

const activeCategorySlug = ref<string | null>(null)
const activeSubId = ref<string | null>(null)
const favsOnly = ref(false)
const cartOpen = ref(false)
const searchOpen = ref(false)
const myRequestsOpen = ref(false)
const detailProduct = ref<Product | null>(null)

onMounted(async () => {
  await menu.load()
  if (!activeCategorySlug.value && menu.visibleCategories.length) {
    const fromQuery = typeof route.query.cat === 'string' ? route.query.cat : null
    activeCategorySlug.value = fromQuery && menu.visibleCategories.some(c => c.slug === fromQuery)
      ? fromQuery
      : menu.visibleCategories[0].slug
  }
})

watch(activeCategorySlug, () => { activeSubId.value = null; favsOnly.value = false })

const activeCategory = computed(() =>
  menu.visibleCategories.find(c => c.slug === activeCategorySlug.value) ?? null
)

const subs = computed(() => activeCategory.value ? menu.subsOf(activeCategory.value.id) : [])

const banner = computed(() => activeCategory.value ? menu.bannerOf(activeCategory.value.id) : null)

const products = computed(() => {
  if (!activeCategory.value) return []
  let list = menu.productsOf(activeCategory.value.id, activeSubId.value)
  if (favsOnly.value) {
    list = list.filter(p => session.isFav(p.id))
  }
  return list
})

const isHookah = computed(() => activeCategorySlug.value === 'hookah' || activeCategorySlug.value === 'kalyan')
const hookahUrl = computed(() => menu.setting('hookah_constructor_url', 'https://hookah-shelter.vercel.app/') as string)

const useListLayout = computed(() => {
  if (!products.value.length) return false
  const withImg = products.value.filter(p => !!p.image_url).length
  return withImg / products.value.length < 0.25
})

function add(p: Product) {
  if (!p.is_available) return
  cart.add(p)
  toast.success(t.value.added)
}
function removeOne(p: Product) {
  cart.remove(p.id)
  toast.show(`− ${pickName(p)}`)
}
function fav(p: Product) {
  session.toggleFav(p.id)
}
function openDetail(p: Product) { detailProduct.value = p }
function selectCategory(slug: string) {
  activeCategorySlug.value = slug
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function goSwipe() {
  router.push({ name: 'swipe', query: { ...route.query, cat: activeCategorySlug.value ?? '' } })
}

const allItems = computed(() => menu.products.filter(p => p.is_active))
</script>

<template>
  <div class="page">
    <AppHeader @search="searchOpen = true" @my-requests="myRequestsOpen = true">
      <div v-if="subs.length" class="subs-bar">
        <div class="subs-row">
          <button
            class="chip"
            :class="{ 'is-active': activeSubId === null }"
            @click="activeSubId = null"
          >ALL</button>
          <button
            v-for="s in subs"
            :key="s.id"
            class="chip"
            :class="{ 'is-active': activeSubId === s.id }"
            @click="activeSubId = s.id"
          >{{ pickName(s) }}</button>
        </div>
      </div>
    </AppHeader>

    <main class="container">
      <!-- View mode toggle + favourites filter -->
      <div class="mode-row">
        <button
          class="mode-btn"
          :class="{ 'is-active': favsOnly }"
          :aria-pressed="favsOnly ? 'true' : 'false'"
          @click="favsOnly = !favsOnly"
        >
          <Icon name="heart" :size="14" /> ОБРАНЕ
        </button>
        <div class="mode-toggle" role="group" aria-label="View mode">
          <button class="mode-btn is-active" aria-pressed="true" disabled>
            <Icon name="menu" :size="14" /> {{ t.listMode }}
          </button>
          <button class="mode-btn" aria-pressed="false" @click="goSwipe">
            <Icon name="cards" :size="14" /> {{ t.swipeMode }}
          </button>
        </div>
      </div>

      <!-- Banner -->
      <CategoryBanner v-if="banner" :banner="banner" />

      <!-- Hookah constructor -->
      <HookahConstructorCTA v-if="isHookah && hookahUrl" :url="hookahUrl" />

      <!-- Items with fade transition on category/subcategory switch -->
      <Skeleton v-if="menu.loading && !products.length" :count="5" />

      <Transition v-else name="fade-list" mode="out-in">
        <div :key="`${activeCategorySlug}-${activeSubId ?? 'all'}-${favsOnly}`">
          <template v-if="products.length">
            <div v-if="useListLayout" class="list-stack">
              <ListRow
                v-for="p in products"
                :key="p.id"
                :product="p"
                :qty="cart.qtyOf(p.id)"
                @add="add"
                @open="openDetail"
              />
            </div>
            <div v-else class="card-stack">
              <ItemCard
                v-for="p in products"
                :key="p.id"
                :product="p"
                :qty="cart.qtyOf(p.id)"
                :is-fav="session.isFav(p.id)"
                @add="add"
                @remove="removeOne"
                @open="openDetail"
                @fav="fav"
              />
            </div>
          </template>

          <EmptyState
            v-else-if="menu.loaded"
            :title="favsOnly ? 'Поки що нічого не вподобано' : t.noResults"
            description=""
          />
        </div>
      </Transition>

      <p v-if="menu.error" class="text-center text-sm py-6 text-red-400">{{ menu.error }}</p>

      <AppFooter />

      <div class="footer-pad" />
    </main>

    <!-- FAB cart -->
    <button
      v-if="cart.count > 0"
      class="fab"
      :aria-label="`${t.yourOrder} · ${cart.count} · ${Math.round(cart.total)}₴`"
      @click="cartOpen = true"
    >
      <Icon name="cart" :size="16" />
      <span>{{ Math.round(cart.total) }}₴</span>
      <span class="badge-count" aria-hidden="true">{{ cart.count }}</span>
    </button>

    <BottomNav
      :categories="menu.visibleCategories"
      :active="activeCategorySlug"
      @select="selectCategory"
    />

    <SearchOverlay
      :open="searchOpen"
      :items="allItems"
      @close="searchOpen = false"
      @open="(p) => { searchOpen = false; openDetail(p) }"
      @add="add"
    />

    <DetailSheet
      :product="detailProduct"
      :qty="detailProduct ? cart.qtyOf(detailProduct.id) : 0"
      :is-fav="detailProduct ? session.isFav(detailProduct.id) : false"
      @close="detailProduct = null"
      @add="add"
      @remove="removeOne"
      @fav="fav"
    />

    <CartSheet :open="cartOpen" @close="cartOpen = false" />

    <MyRequestsSheet :open="myRequestsOpen" @close="myRequestsOpen = false" />
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.container {
  padding: 14px 14px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>

<style>
/* Slot content rendered inside AppHeader — needs global scope. */
.subs-bar {
  padding: 10px 14px 10px;
  background: rgba(13, 13, 13, 0.55);
  border-bottom: 1px solid var(--line);
}
.subs-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  max-width: 480px;
  margin: 0 auto;
}
.subs-row::-webkit-scrollbar { display: none; }
.mode-toggle {
  display: inline-flex;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}
.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 8px 12px;
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
.mode-toggle .mode-btn {
  border-radius: 0;
  border: 0;
  background: transparent;
}
.mode-btn:hover, .mode-btn:focus-visible { color: var(--text); }
.mode-btn.is-active { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.mode-btn:disabled { cursor: default; }

.list-stack { display: flex; flex-direction: column; }
.card-stack { display: flex; flex-direction: column; gap: 12px; }
.footer-pad { height: calc(120px + env(safe-area-inset-bottom)); }

/* ── Category / subcategory switch ────────────────────── */
.fade-list-enter-from, .fade-list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
.fade-list-enter-to, .fade-list-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-list-enter-active, .fade-list-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.fab .badge-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  margin-left: 4px;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgb(0, 0, 0);
  color: var(--accent);
}
</style>
