import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'

export const useSessionStore = defineStore('session', () => {
  const table = useStorage<string>('shelter:table', '')
  const phone = useStorage<string>('shelter:phone', '')
  const favs = useStorage<string[]>('shelter:favs', [])
  const swipeLiked = useStorage<string[]>('shelter:swipe-liked', [])
  const swipeHidden = useStorage<string[]>('shelter:swipe-hidden', [])
  const hiddenInSwipe = computed(() => new Set(swipeHidden.value))
  const viewMode = useStorage<'list' | 'swipe'>('shelter:view-mode', 'list')

  function setTable(v: string) {
    const cleaned = String(v ?? '').replace(/\D/g, '').slice(0, 3)
    table.value = cleaned
  }

  function isFav(id: string) {
    return favs.value.includes(id)
  }

  function toggleFav(id: string) {
    const idx = favs.value.indexOf(id)
    if (idx === -1) favs.value.push(id)
    else favs.value.splice(idx, 1)
  }

  function isSwipeLiked(id: string) {
    return swipeLiked.value.includes(id)
  }

  function likeInSwipe(id: string) {
    if (!swipeLiked.value.includes(id)) swipeLiked.value.push(id)
    swipeHidden.value = swipeHidden.value.filter(x => x !== id)
  }

  function hideInSwipe(id: string) {
    if (!swipeHidden.value.includes(id)) swipeHidden.value.push(id)
    swipeLiked.value = swipeLiked.value.filter(x => x !== id)
  }

  function resetHidden() {
    swipeHidden.value = []
  }

  function resetSwipeSelection() {
    swipeLiked.value = []
    swipeHidden.value = []
  }

  const hasTable = computed(() => !!table.value)

  return {
    table, phone, favs, swipeLiked, swipeHidden, hiddenInSwipe, viewMode, hasTable,
    setTable, isFav, toggleFav, isSwipeLiked, likeInSwipe, hideInSwipe, resetHidden, resetSwipeSelection,
  }
})
