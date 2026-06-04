<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMenuStore } from '@/stores/menu'
import { useToast } from '@/composables/useToast'
import { slugify } from '@/lib/format'
import type { Subcategory, Category } from '@/lib/database.types'
import Icon from '@/components/public/Icon.vue'

const menu = useMenuStore()
const toast = useToast()
const subs = ref<Subcategory[]>([])
const cats = ref<Category[]>([])
const filter = ref<string>('')
const newName = ref('')

async function refresh() {
  const [c, s] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
  ])
  cats.value = (c.data as Category[]) ?? []
  subs.value = (s.data as Subcategory[]) ?? []
  if (!filter.value && cats.value[0]) filter.value = cats.value[0].id
}
onMounted(refresh)

const filtered = computed(() => subs.value.filter(s => !filter.value || s.category_id === filter.value))

async function toggleActive(s: Subcategory) {
  await supabase.from('subcategories').update({ is_active: !s.is_active }).eq('id', s.id)
  s.is_active = !s.is_active
}

async function move(s: Subcategory, dir: -1 | 1) {
  const list = filtered.value
  const i = list.indexOf(s)
  const j = i + dir
  if (j < 0 || j >= list.length) return
  await supabase.from('subcategories').update({ sort_order: list[j].sort_order }).eq('id', s.id)
  await supabase.from('subcategories').update({ sort_order: s.sort_order }).eq('id', list[j].id)
  await refresh()
}

async function create() {
  const name = newName.value.trim()
  if (!name || !filter.value) return
  const slug = slugify(name) || `sub-${Date.now()}`
  const last = filtered.value[filtered.value.length - 1]?.sort_order ?? 0
  const { error } = await supabase.from('subcategories').insert({
    category_id: filter.value,
    slug,
    name_uk: name,
    sort_order: last + 1,
    is_active: true,
  })
  if (error) { toast.error(error.message); return }
  newName.value = ''
  await refresh()
  await menu.load()
}

async function update(s: Subcategory, key: keyof Subcategory, value: any) {
  ;(s as any)[key] = value
  await supabase.from('subcategories').update({ [key]: value }).eq('id', s.id)
}

async function remove(s: Subcategory) {
  if (!confirm(`Видалити «${s.name_uk}»?`)) return
  const { error } = await supabase.from('subcategories').delete().eq('id', s.id)
  if (error) { toast.error(error.message); return }
  await refresh()
  await menu.load()
}
</script>

<template>
  <section>
    <h1 class="section-title text-2xl mb-4">Підкатегорії</h1>

    <div class="row create">
      <select v-model="filter" class="input">
        <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.name_uk }}</option>
      </select>
      <input v-model="newName" class="input" placeholder="Нова підкатегорія…" @keyup.enter="create" />
      <button class="btn-primary" :disabled="!newName.trim()" @click="create"><Icon name="plus" :size="14" /></button>
    </div>

    <ul class="list">
      <li v-for="(s, i) in filtered" :key="s.id" class="row">
        <div class="ord">
          <button :disabled="i === 0" @click="move(s, -1)"><Icon name="arrow-up" :size="12" /></button>
          <button :disabled="i === filtered.length - 1" @click="move(s, 1)"><Icon name="arrow-down" :size="12" /></button>
        </div>
        <input :value="s.name_uk" class="input" @blur="(e) => update(s, 'name_uk', (e.target as HTMLInputElement).value)" />
        <input :value="s.name_en ?? ''" class="input" placeholder="EN" @blur="(e) => update(s, 'name_en', (e.target as HTMLInputElement).value)" />
        <input :value="s.note_uk ?? ''" class="input note" placeholder="прим." @blur="(e) => update(s, 'note_uk', (e.target as HTMLInputElement).value)" />
        <button class="chip" :class="{ 'is-active': s.is_active }" @click="toggleActive(s)">
          {{ s.is_active ? 'активна' : 'прихов.' }}
        </button>
        <button class="hbtn danger" @click="remove(s)"><Icon name="trash" :size="14" /></button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: auto 1fr 1fr 140px auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.row.create {
  grid-template-columns: 220px 1fr auto;
  background: transparent;
  border: 0;
  margin-bottom: 14px;
  padding: 0;
}
.list { display: flex; flex-direction: column; gap: 6px; }
.ord { display: flex; flex-direction: column; gap: 2px; }
.ord button { width: 22px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 3px; color: var(--muted); }
.ord button:hover:not(:disabled) { color: var(--accent); }
.ord button:disabled { opacity: 0.3; }
.hbtn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 4px; color: var(--text); }
.hbtn.danger { color: #ff8b73; border-color: rgba(255, 100, 70, 0.35); }
.row .input { height: 36px; padding: 0 10px; }
</style>
