<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMenuStore } from '@/stores/menu'
import { useToast } from '@/composables/useToast'
import { slugify } from '@/lib/format'
import type { Product, Category, Subcategory } from '@/lib/database.types'
import Icon from '@/components/public/Icon.vue'

const menu = useMenuStore()
const toast = useToast()

const products = ref<Product[]>([])
const cats = ref<Category[]>([])
const subs = ref<Subcategory[]>([])

const filterCat = ref<string>('')
const filterSub = ref<string>('')
const filterText = ref<string>('')
const onlyHidden = ref(false)
const onlyUnavailable = ref(false)

async function refresh() {
  const [c, s, p] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
    supabase.from('products').select('*').order('sort_order'),
  ])
  cats.value = (c.data as Category[]) ?? []
  subs.value = (s.data as Subcategory[]) ?? []
  products.value = (p.data as Product[]) ?? []
}
onMounted(refresh)

const subsOfFilter = computed(() => subs.value.filter(s => !filterCat.value || s.category_id === filterCat.value))

const filtered = computed(() => {
  const text = filterText.value.trim().toLowerCase()
  return products.value.filter(p => {
    if (filterCat.value && p.category_id !== filterCat.value) return false
    if (filterSub.value && p.subcategory_id !== filterSub.value) return false
    if (onlyHidden.value && p.is_active) return false
    if (onlyUnavailable.value && p.is_available) return false
    if (text) {
      const hay = `${p.name_uk} ${p.name_en ?? ''} ${p.slug}`.toLowerCase()
      if (!hay.includes(text)) return false
    }
    return true
  })
})

function nameOf(id: string | null): string {
  if (!id) return '—'
  return cats.value.find(c => c.id === id)?.name_uk ?? subs.value.find(s => s.id === id)?.name_uk ?? '—'
}

async function toggle(p: Product, key: 'is_active' | 'is_available') {
  const next = !p[key]
  await supabase.from('products').update({ [key]: next }).eq('id', p.id)
  p[key] = next
}

const newName = ref('')
const newCat = ref('')
const newSub = ref('')

async function create() {
  if (!newName.value.trim() || !newCat.value) return
  const slug = slugify(newName.value) || `prod-${Date.now()}`
  const last = products.value
    .filter(p => p.category_id === newCat.value && p.subcategory_id === (newSub.value || null))
    .sort((a, b) => b.sort_order - a.sort_order)[0]?.sort_order ?? 0
  const { data, error } = await supabase.from('products').insert({
    category_id: newCat.value,
    subcategory_id: newSub.value || null,
    slug,
    name_uk: newName.value.trim(),
    sort_order: last + 1,
    is_active: true,
    is_available: true,
  }).select('id').single()
  if (error) { toast.error(error.message); return }
  newName.value = ''
  await refresh()
  await menu.load()
  window.location.hash = `#${data!.id}`
}

async function remove(p: Product) {
  if (!confirm(`Видалити «${p.name_uk}»?`)) return
  const { error } = await supabase.from('products').delete().eq('id', p.id)
  if (error) { toast.error(error.message); return }
  await refresh()
  await menu.load()
}
</script>

<template>
  <section>
    <header class="flex items-center justify-between gap-4 mb-4 flex-wrap">
      <h1 class="section-title text-2xl">Товари</h1>
      <span class="font-mono text-[10px] tracking-widest text-shelter-muted">{{ filtered.length }} / {{ products.length }}</span>
    </header>

    <div class="filters">
      <select v-model="filterCat" class="input" @change="filterSub = ''">
        <option value="">всі категорії</option>
        <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.name_uk }}</option>
      </select>
      <select v-model="filterSub" class="input">
        <option value="">всі підкатегорії</option>
        <option v-for="s in subsOfFilter" :key="s.id" :value="s.id">{{ s.name_uk }}</option>
      </select>
      <input v-model="filterText" class="input" placeholder="пошук…" />
      <label class="check"><input v-model="onlyHidden" type="checkbox" /> прихов.</label>
      <label class="check"><input v-model="onlyUnavailable" type="checkbox" /> немає</label>
    </div>

    <div class="create-row">
      <select v-model="newCat" class="input">
        <option value="">— категорія —</option>
        <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.name_uk }}</option>
      </select>
      <select v-model="newSub" class="input">
        <option value="">— підкатегорія —</option>
        <option v-for="s in subs.filter(x => x.category_id === newCat)" :key="s.id" :value="s.id">{{ s.name_uk }}</option>
      </select>
      <input v-model="newName" class="input" placeholder="Назва нового товару…" @keyup.enter="create" />
      <button class="btn-primary" :disabled="!newName.trim() || !newCat" @click="create">
        <Icon name="plus" :size="14" />
      </button>
    </div>

    <ul class="list">
      <li v-for="p in filtered" :key="p.id" :id="p.id" class="row">
        <div class="thumb">
          <img v-if="p.image_url" :src="p.image_url" :alt="p.name_uk" loading="lazy" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-display uppercase tracking-wider text-sm truncate">{{ p.name_uk }}</div>
          <div class="font-mono text-[10px] text-shelter-muted-2 truncate">
            {{ nameOf(p.category_id) }} · {{ nameOf(p.subcategory_id) }} · /{{ p.slug }}
          </div>
        </div>
        <span class="font-mono tabular-nums text-sm whitespace-nowrap">
          {{ p.price_display ?? p.price ?? '—' }}{{ p.price ? '₴' : '' }}
        </span>
        <button class="chip" :class="{ 'is-active': p.is_available }" @click="toggle(p, 'is_available')">
          {{ p.is_available ? 'є' : 'немає' }}
        </button>
        <button class="chip" :class="{ 'is-active': p.is_active }" @click="toggle(p, 'is_active')">
          {{ p.is_active ? 'видно' : 'прихов.' }}
        </button>
        <RouterLink :to="`/admin/products/${p.id}`" class="hbtn"><Icon name="edit" :size="14" /></RouterLink>
        <button class="hbtn danger" @click="remove(p)"><Icon name="trash" :size="14" /></button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto auto;
  gap: 8px;
  margin-bottom: 10px;
}
.create-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 14px;
}
.row {
  display: grid;
  grid-template-columns: 48px 1fr auto auto auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.thumb { width: 48px; height: 48px; border-radius: 4px; overflow: hidden; background: var(--bg-2); border: 1px solid var(--line); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.list { display: flex; flex-direction: column; gap: 6px; }
.hbtn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 4px; color: var(--text); }
.hbtn.danger { color: #ff8b73; border-color: rgba(255, 100, 70, 0.35); }
.row .input { height: 36px; padding: 0 10px; }
.filters .input, .create-row .input { height: 36px; padding: 0 10px; }
.check {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--muted);
}
@media (max-width: 720px) {
  .filters { grid-template-columns: 1fr 1fr; }
  .create-row { grid-template-columns: 1fr 1fr; }
  .row { grid-template-columns: 48px 1fr; grid-auto-flow: row; }
}
</style>
