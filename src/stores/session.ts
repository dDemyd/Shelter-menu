import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

export const useSessionStore = defineStore('session', () => {
  const table = useStorage<string>('shelter:table', '')
  const phone = useStorage<string>('shelter:phone', '')
  const favs = useStorage<string[]>('shelter:favs', [])
  const hiddenInSwipe = ref(new Set<string>())
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

  function hideInSwipe(id: string) {
    hiddenInSwipe.value.add(id)
  }

  function resetHidden() {
    hiddenInSwipe.value.clear()
  }

  const hasTable = computed(() => !!table.value)

  return {
    table, phone, favs, hiddenInSwipe, viewMode, hasTable,
    setTable, isFav, toggleFav, hideInSwipe, resetHidden,
  }
})
