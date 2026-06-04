import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { Product } from '@/lib/database.types'
import { pickName } from '@/lib/i18n'

export interface CartLine {
  id: string
  qty: number
  name_uk: string
  name_en: string | null
  price: number | null
  price_display: string | null
  image_url: string | null
}

export const useCartStore = defineStore('cart', () => {
  const lines = useStorage<CartLine[]>('shelter:cart', [])
  const comment = useStorage<string>('shelter:comment', '')

  const count = computed(() => lines.value.reduce((s, l) => s + l.qty, 0))
  const total = computed(() =>
    lines.value.reduce((s, l) => s + (l.price ? l.price * l.qty : 0), 0)
  )
  const isEmpty = computed(() => lines.value.length === 0)

  function add(product: Product, qty = 1) {
    const existing = lines.value.find(l => l.id === product.id)
    if (existing) {
      existing.qty += qty
    } else {
      lines.value.push({
        id: product.id,
        qty,
        name_uk: product.name_uk,
        name_en: product.name_en,
        price: product.price != null ? Number(product.price) : null,
        price_display: product.price_display,
        image_url: product.image_url,
      })
    }
  }

  function remove(id: string) {
    const idx = lines.value.findIndex(l => l.id === id)
    if (idx === -1) return
    if (lines.value[idx].qty > 1) lines.value[idx].qty -= 1
    else lines.value.splice(idx, 1)
  }

  function removeAll(id: string) {
    lines.value = lines.value.filter(l => l.id !== id)
  }

  function clear() {
    lines.value = []
    comment.value = ''
  }

  function qtyOf(id: string): number {
    return lines.value.find(l => l.id === id)?.qty ?? 0
  }

  function toRequestItems() {
    return lines.value.map(l => ({
      product_id: l.id,
      name: pickName({ name_uk: l.name_uk, name_en: l.name_en }),
      qty: l.qty,
      price: l.price,
    }))
  }

  return { lines, comment, count, total, isEmpty, add, remove, removeAll, clear, qtyOf, toRequestItems }
})
