<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMenuStore } from '@/stores/menu'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { slugify } from '@/lib/format'
import type { Category } from '@/lib/database.types'
import Icon from '@/components/public/Icon.vue'

const menu = useMenuStore()
const router = useRouter()
const toast = useToast()
const items = ref<Category[]>([])
const loading = ref(true)
const creating = ref(false)
const newName = ref('')

async function refresh() {
  loading.value = true
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  items.value = (data as Category[]) ?? []
  loading.value = false
}

onMounted(refresh)

async function toggleActive(c: Category) {
  await supabase.from('categories').update({ is_active: !c.is_active }).eq('id', c.id)
  c.is_active = !c.is_active
}

async function move(c: Category, dir: -1 | 1) {
  const i = items.value.indexOf(c)
  const j = i + dir
  if (j < 0 || j >= items.value.length) return
  const a = items.value[i], b = items.value[j]
  await supabase.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id)
  await supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id)
  await refresh()
}

async function createCategory() {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  const slug = slugify(name) || `cat-${Date.now()}`
  const sort = (items.value[items.value.length - 1]?.sort_order ?? 0) + 1
  const { data, error } = await supabase
    .from('categories')
    .insert({ slug, name_uk: name, sort_order: sort, is_active: true })
    .select('id')
    .single()
  creating.value = false
  if (error) { toast.error(error.message); return }
  newName.value = ''
  await menu.load()
  router.push({ name: 'admin-category-edit', params: { id: data!.id } })
}

async function remove(c: Category) {
  if (!confirm(`Видалити «${c.name_uk}»?`)) return
  const { error } = await supabase.from('categories').delete().eq('id', c.id)
  if (error) { toast.error(error.message); return }
  await refresh()
  await menu.load()
}
</script>

<template>
  <section>
    <header class="flex items-center justify-between gap-4 mb-4">
      <h1 class="section-title text-2xl">Категорії</h1>
    </header>

    <div class="row create">
      <input v-model="newName" class="input" placeholder="Назва нової категорії…" @keyup.enter="createCategory" />
      <button class="btn-primary" :disabled="creating || !newName.trim()" @click="createCategory">
        <Icon name="plus" :size="14" /> Створити
      </button>
    </div>

    <div v-if="loading" class="empty">Завантаження…</div>

    <ul class="list">
      <li v-for="(c, i) in items" :key="c.id" class="row">
        <div class="ord">
          <button :disabled="i === 0" @click="move(c, -1)"><Icon name="arrow-up" :size="12" /></button>
          <button :disabled="i === items.length - 1" @click="move(c, 1)"><Icon name="arrow-down" :size="12" /></button>
        </div>
        <span class="font-mono text-[10px] tracking-widest text-shelter-muted">{{ c.code ?? '· ·' }}</span>
        <div class="min-w-0 flex-1">
          <div class="font-display uppercase tracking-wider text-sm truncate">{{ c.name_uk }}</div>
          <div class="font-mono text-[10px] text-shelter-muted-2 truncate">/{{ c.slug }} · {{ c.name_en ?? '—' }}</div>
        </div>
        <button class="chip" :class="{ 'is-active': c.is_active }" @click="toggleActive(c)">
          {{ c.is_active ? 'активна' : 'прихов.' }}
        </button>
        <RouterLink :to="`/admin/categories/${c.id}`" class="hbtn"><Icon name="edit" :size="14" /></RouterLink>
        <button class="hbtn danger" @click="remove(c)"><Icon name="trash" :size="14" /></button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: auto auto 1fr auto auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.row.create {
  grid-template-columns: 1fr auto;
  margin-bottom: 14px;
  background: transparent;
  border: 0;
  padding: 0;
}
.list { display: flex; flex-direction: column; gap: 6px; }
.ord { display: flex; flex-direction: column; gap: 2px; }
.ord button { width: 22px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 3px; color: var(--muted); }
.ord button:hover:not(:disabled) { color: var(--accent); border-color: var(--accent); }
.ord button:disabled { opacity: 0.3; }
.hbtn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 4px; color: var(--text); }
.hbtn.danger { color: #ff8b73; border-color: rgba(255, 100, 70, 0.35); }
.hbtn:hover { border-color: var(--accent); }
.empty { padding: 40px; text-align: center; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
</style>
