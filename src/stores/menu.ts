import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, hasSupabase } from '@/lib/supabase'
import type { Category, Subcategory, Product, CategoryBanner, Setting } from '@/lib/database.types'

export const useMenuStore = defineStore('menu', () => {
  const categories = ref<Category[]>([])
  const subcategories = ref<Subcategory[]>([])
  const products = ref<Product[]>([])
  const banners = ref<CategoryBanner[]>([])
  const settings = ref<Record<string, unknown>>({})

  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    if (loading.value) return
    loading.value = true
    error.value = null
    try {
      if (!hasSupabase) {
        loaded.value = true
        return
      }
      const [cats, subs, prods, bans, setts] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('subcategories').select('*').order('sort_order'),
        supabase.from('products').select('*').order('sort_order'),
        supabase.from('category_banners').select('*').order('sort_order'),
        supabase.from('settings').select('*'),
      ])
      if (cats.error) throw cats.error
      if (subs.error) throw subs.error
      if (prods.error) throw prods.error
      if (bans.error) throw bans.error
      if (setts.error) throw setts.error

      categories.value = cats.data ?? []
      subcategories.value = subs.data ?? []
      products.value = prods.data ?? []
      banners.value = bans.data ?? []
      settings.value = Object.fromEntries(((setts.data ?? []) as Setting[]).map(s => [s.key, s.value]))
      loaded.value = true
    } catch (e: any) {
      console.error('[menu]', e)
      error.value = e?.message ?? 'load failed'
    } finally {
      loading.value = false
    }
  }

  function setting<T = unknown>(key: string, fallback: T): T {
    const v = settings.value[key]
    return (v as T) ?? fallback
  }

  const visibleCategories = computed(() =>
    categories.value.filter(c => c.is_active)
  )

  function subsOf(categoryId: string): Subcategory[] {
    return subcategories.value
      .filter(s => s.category_id === categoryId && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  function productsOf(categoryId: string, subId: string | null): Product[] {
    return products.value
      .filter(p =>
        p.is_active &&
        p.category_id === categoryId &&
        (subId == null || p.subcategory_id === subId)
      )
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  function bannerOf(categoryId: string): CategoryBanner | null {
    const now = Date.now()
    return banners.value.find(b => {
      if (b.category_id !== categoryId) return false
      if (!b.is_active) return false
      if (b.starts_at) {
        const start = new Date(b.starts_at).getTime()
        if (Number.isFinite(start) && start > now) return false
      }
      if (b.ends_at) {
        const end = new Date(b.ends_at).getTime()
        if (Number.isFinite(end) && end < now) return false
      }
      return true
    }) ?? null
  }

  function productById(id: string): Product | undefined {
    return products.value.find(p => p.id === id)
  }

  async function refreshBanners() {
    if (!hasSupabase) return
    const { data } = await supabase.from('category_banners').select('*').order('sort_order')
    banners.value = data ?? []
  }

  return {
    categories, subcategories, products, banners, settings,
    loading, loaded, error,
    load, setting, refreshBanners,
    visibleCategories, subsOf, productsOf, bannerOf, productById,
  }
})
