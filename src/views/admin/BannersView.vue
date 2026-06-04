<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMenuStore } from '@/stores/menu'
import { useToast } from '@/composables/useToast'
import type { Category, CategoryBanner } from '@/lib/database.types'
import Icon from '@/components/public/Icon.vue'

const menu = useMenuStore()
const toast = useToast()
const banners = ref<CategoryBanner[]>([])
const cats = ref<Category[]>([])
const editing = ref<Partial<CategoryBanner> | null>(null)
const filter = ref('')

async function refresh() {
  const [c, b] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('category_banners').select('*').order('sort_order'),
  ])
  cats.value = (c.data as Category[]) ?? []
  banners.value = (b.data as CategoryBanner[]) ?? []
}
onMounted(refresh)

const filtered = computed(() => banners.value.filter(b => !filter.value || b.category_id === filter.value))

function startCreate() {
  editing.value = {
    category_id: cats.value[0]?.id,
    title_uk: '',
    is_active: true,
    sort_order: 1,
  }
}
function edit(b: CategoryBanner) { editing.value = { ...b } }
function cancel() { editing.value = null }

// Trim empty strings to null so Postgres timestamptz accepts the insert
// and the public bannerOf() filter doesn't choke on `new Date("")`.
function clean<T>(v: T): T | null {
  if (v === undefined || v === null) return null
  if (typeof v === 'string' && v.trim() === '') return null
  return v
}

async function save() {
  if (!editing.value) return
  const b = editing.value
  if (!b.title_uk || !b.category_id) { toast.error('заповніть назву та категорію'); return }
  const payload = {
    category_id: b.category_id,
    title_uk: b.title_uk,
    title_en: clean(b.title_en),
    description_uk: clean(b.description_uk),
    description_en: clean(b.description_en),
    image_url: clean(b.image_url),
    cta_label_uk: clean(b.cta_label_uk),
    cta_label_en: clean(b.cta_label_en),
    cta_url: clean(b.cta_url),
    is_active: b.is_active ?? true,
    starts_at: clean(b.starts_at),
    ends_at: clean(b.ends_at),
    sort_order: b.sort_order ?? 1,
  }
  const { error } = b.id
    ? await supabase.from('category_banners').update(payload).eq('id', b.id)
    : await supabase.from('category_banners').insert(payload)
  if (error) {
    console.error('[banner save]', error)
    toast.error(error.message)
    return
  }
  await refresh()
  await menu.load()
  editing.value = null
  toast.success('Збережено')
}

async function remove(b: CategoryBanner) {
  if (!confirm(`Видалити банер «${b.title_uk}»?`)) return
  await supabase.from('category_banners').delete().eq('id', b.id)
  await refresh()
}

async function toggle(b: CategoryBanner) {
  await supabase.from('category_banners').update({ is_active: !b.is_active }).eq('id', b.id)
  b.is_active = !b.is_active
}
</script>

<template>
  <section>
    <header class="flex items-center justify-between gap-4 mb-4 flex-wrap">
      <h1 class="section-title text-2xl">Hero / Event-блоки</h1>
      <button class="btn-primary" @click="startCreate"><Icon name="plus" :size="14" /> Новий</button>
    </header>

    <div class="mb-3">
      <select v-model="filter" class="input">
        <option value="">всі категорії</option>
        <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.name_uk }}</option>
      </select>
    </div>

    <ul class="list">
      <li v-for="b in filtered" :key="b.id" class="row">
        <div class="thumb" :style="b.image_url ? `background-image: url('${b.image_url}')` : ''" />
        <div class="min-w-0 flex-1">
          <div class="font-display uppercase tracking-wider text-sm truncate">{{ b.title_uk }}</div>
          <div class="font-mono text-[10px] text-shelter-muted truncate">
            {{ cats.find(c => c.id === b.category_id)?.name_uk ?? '—' }} · {{ b.cta_url ?? '—' }}
          </div>
        </div>
        <button class="chip" :class="{ 'is-active': b.is_active }" @click="toggle(b)">
          {{ b.is_active ? 'активно' : 'прихов.' }}
        </button>
        <button class="hbtn" @click="edit(b)"><Icon name="edit" :size="14" /></button>
        <button class="hbtn danger" @click="remove(b)"><Icon name="trash" :size="14" /></button>
      </li>
    </ul>

    <div v-if="editing" class="modal-backdrop" @click.self="cancel">
      <div class="modal">
        <h2 class="font-display uppercase tracking-wider text-lg mb-4">{{ editing.id ? 'Редагувати' : 'Новий' }} банер</h2>

        <form class="grid grid-cols-1 md:grid-cols-2 gap-3" @submit.prevent="save">
          <div class="md:col-span-2">
            <label class="label">категорія *</label>
            <select v-model="editing.category_id" class="input" required>
              <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.name_uk }}</option>
            </select>
          </div>
          <div>
            <label class="label">title UA *</label>
            <input v-model="editing.title_uk" class="input" required />
          </div>
          <div>
            <label class="label">title EN</label>
            <input v-model="editing.title_en" class="input" />
          </div>
          <div class="md:col-span-2">
            <label class="label">image url</label>
            <input v-model="editing.image_url" class="input" placeholder="https://…" />
          </div>
          <div class="md:col-span-2">
            <label class="label">опис UA</label>
            <textarea v-model="editing.description_uk" class="input" rows="2" />
          </div>
          <div class="md:col-span-2">
            <label class="label">description EN</label>
            <textarea v-model="editing.description_en" class="input" rows="2" />
          </div>
          <div>
            <label class="label">CTA UA</label>
            <input v-model="editing.cta_label_uk" class="input" />
          </div>
          <div>
            <label class="label">CTA EN</label>
            <input v-model="editing.cta_label_en" class="input" />
          </div>
          <div class="md:col-span-2">
            <label class="label">CTA URL</label>
            <input v-model="editing.cta_url" class="input" placeholder="https://…" />
          </div>
          <div>
            <label class="label">starts_at</label>
            <input v-model="editing.starts_at" type="datetime-local" class="input" />
          </div>
          <div>
            <label class="label">ends_at</label>
            <input v-model="editing.ends_at" type="datetime-local" class="input" />
          </div>
          <div class="md:col-span-2 flex items-center gap-2">
            <input id="ba" v-model="editing.is_active" type="checkbox" />
            <label for="ba" class="text-sm text-shelter-muted">Активний</label>
          </div>

          <div class="md:col-span-2 flex gap-2 mt-2 justify-end">
            <button type="button" class="btn-ghost" @click="cancel">Скасувати</button>
            <button class="btn-primary">Зберегти</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.list { display: flex; flex-direction: column; gap: 6px; }
.thumb { width: 80px; height: 50px; background: var(--bg-2) center / cover; border-radius: 4px; border: 1px solid var(--line); }
.hbtn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 4px; }
.hbtn.danger { color: #ff8b73; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 100; display: flex; padding: 20px; align-items: flex-start; justify-content: center; overflow-y: auto; }
.modal { width: 100%; max-width: 600px; background: var(--bg-2); border: 1px solid var(--line-2); border-radius: var(--radius-lg); padding: 24px; margin-top: 40px; }
</style>
