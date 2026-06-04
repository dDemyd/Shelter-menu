<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, type CSSProperties } from 'vue'
import type { Product } from '@/lib/database.types'
import { pickName, pickDescription } from '@/lib/i18n'
import { priceWithCurrency } from '@/lib/format'
import { useSwipe } from '@/composables/useSwipe'
import Badges from './Badges.vue'

const props = defineProps<{
  product: Product
  depth: number
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'right'): void
  (e: 'left'): void
  (e: 'down'): void
}>()

const card = ref<HTMLElement | null>(null)
const { offsetX, offsetY, dragging, bind } = useSwipe(card, {
  threshold: 100,
  onRight: () => emit('right'),
  onLeft: () => emit('left'),
  onDown: () => emit('down'),
})

let unbind: (() => void) | undefined

function syncBinding() {
  unbind?.()
  unbind = props.active ? bind(card.value) : undefined
}

onMounted(syncBinding)
watch(() => props.active, syncBinding, { flush: 'post' })
onBeforeUnmount(() => unbind?.())

const style = computed<CSSProperties>(() => {
  const scale = 1 - props.depth * 0.04
  const ty = props.depth * 12
  if (dragging.value && props.active) {
    const rot = offsetX.value * 0.06
    return {
      transform: `translate(${offsetX.value}px, ${offsetY.value}px) rotate(${rot}deg) scale(${scale})`,
      transition: 'none',
      zIndex: 20,
      pointerEvents: 'auto',
    }
  }
  return {
    transform: `translateY(${ty}px) scale(${scale})`,
    zIndex: 10 - props.depth,
    pointerEvents: props.active ? 'auto' : 'none',
  }
})

const hint = computed(() => {
  if (!props.active || !dragging.value) return null
  if (Math.abs(offsetX.value) > 40 && Math.abs(offsetX.value) > Math.abs(offsetY.value)) {
    return offsetX.value > 0 ? 'right' : 'left'
  }
  if (offsetY.value > 60 && offsetY.value > Math.abs(offsetX.value)) return 'down'
  return null
})
</script>

<template>
  <article ref="card" class="swipe-card" :class="{ 'is-active': active, [`hint-${hint}`]: !!hint }" :style="style">
    <div class="img-wrap">
      <span class="corners" />
      <img v-if="product.image_url" :src="product.image_url" :alt="pickName(product)" loading="lazy" />
      <div v-else class="placeholder font-mono uppercase tracking-widest text-xs text-shelter-muted">{{ product.slug }}</div>
    </div>

    <div class="body">
      <div class="flex items-start justify-between gap-3">
        <h3 class="font-display uppercase tracking-wider text-xl leading-tight text-shadow-neon">{{ pickName(product) }}</h3>
        <span class="font-mono font-semibold tabular-nums text-lg">{{ priceWithCurrency(product) }}</span>
      </div>
      <Badges :list="product.badges" />
      <p class="text-sm leading-snug text-shelter-muted">{{ pickDescription(product) }}</p>
    </div>

    <span class="hint hint-r">♥ ОБРАНЕ</span>
    <span class="hint hint-l">× ПРИХОВАТИ</span>
    <span class="hint hint-d">+ ДО ЗАМОВЛЕННЯ</span>
  </article>
</template>

<style scoped>
.swipe-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  background: var(--bg-2);
  border: 1px solid var(--line-2);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.55);
  transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
  touch-action: none;
  user-select: none;
}
.swipe-card.is-active { cursor: grab; }
.img-wrap {
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--bg);
  border-bottom: 1px solid var(--line-2);
  overflow: hidden;
}
.img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.placeholder { display: flex; align-items: center; justify-content: center; height: 100%; }

.body { padding: 14px 16px 18px; display: flex; flex-direction: column; gap: 8px; }

.hint {
  position: absolute;
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 8px 14px;
  border: 2px solid currentColor;
  border-radius: 6px;
  opacity: 0;
  transition: opacity 140ms ease;
  pointer-events: none;
}
.hint-r { top: 16px; right: 16px; color: var(--accent); transform: rotate(8deg); text-shadow: 0 0 12px rgba(var(--accent-rgb), 0.55); }
.hint-l { top: 16px; left: 16px; color: #b3b3b3; transform: rotate(-8deg); }
.hint-d { bottom: 16px; left: 50%; transform: translateX(-50%); color: #ff8b73; }
.swipe-card.hint-right .hint-r { opacity: 1; }
.swipe-card.hint-left .hint-l { opacity: 1; }
.swipe-card.hint-down .hint-d { opacity: 1; }
</style>
