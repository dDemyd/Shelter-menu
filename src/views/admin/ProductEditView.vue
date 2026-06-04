<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useMenuStore } from '@/stores/menu'
import { useToast } from '@/composables/useToast'
import { slugify } from '@/lib/format'
import type { Product, Category, Subcategory, BadgeKey } from '@/lib/database.types'

const route = useRoute()
const router = useRouter()
const menu = useMenuStore()
const toast = useToast()

const item = ref<Partial<Product>>({})
const cats = ref<Category[]>([])
const subs = ref<Subcategory[]>([])
const loading = ref(true)
const saving = ref(false)

const BADGES: BadgeKey[] = ['new', 'signature', 'hot', 'strong', 'na']

async function load() {
  loading.value = true
  const [p, c, s] = await Promise.all([
    supabase.from('products').select('*').eq('id', route.params.id).maybeSingle(),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
  ])
  if (!p.data) { router.push('/admin/products'); return }
  item.value = p.data as Product
  cats.value = (c.data as Category[]) ?? []
  subs.value = (s.data as Subcategory[]) ?? []
  loading.value = false
}
onMounted(load)

const subsForCat = computed(() => subs.value.filter(s => s.category_id === item.value.category_id))

function toggleBadge(b: BadgeKey) {
  const cur = (item.value.badges ?? []) as BadgeKey[]
  item.value.badges = cur.includes(b) ? cur.filter(x => x !== b) : [...cur, b]
}

function syncSlug() {
  if (!item.value.slug) item.value.slug = slugify(item.value.name_uk ?? '')
}

async function save() {
  saving.value = true
  const tags = (item.value.tags as any) ?? []
  const payload = {
    category_id: item.value.category_id,
    subcategory_id: item.value.subcategory_id || null,
    slug: item.value.slug,
    name_uk: item.value.name_uk,
    name_en: item.value.name_en ?? null,
    description_uk: item.value.description_uk ?? null,
    description_en: item.value.description_en ?? null,
    price: item.value.price != null && item.value.price !== ('' as any) ? Number(item.value.price) : null,
    price_display: item.value.price_display ?? null,
    image_url: item.value.image_url ?? null,
    badges: item.value.badges ?? [],
    tags: typeof tags === 'string' ? (tags as string).split(',').map(t => t.trim()).filter(Boolean) : tags,
    is_available: item.value.is_available ?? true,
    is_active: item.value.is_active ?? true,
  }
  const { error } = await supabase.from('products').update(payload).eq('id', route.params.id)
  saving.value = false
  if (error) { toast.error(error.message); return }
  await menu.load()
  toast.success('Збережено')
  router.push('/admin/products')
}

const tagsCsv = computed({
  get: () => (item.value.tags ?? []).join(', '),
  set: (v: string) => { item.value.tags = v.split(',').map(t => t.trim()).filter(Boolean) },
})
</script>

<template>
  <section v-if="!loading">
    <h1 class="section-title text-2xl mb-4">Товар: {{ item.name_uk }}</h1>

    <form class="grid grid-cols-1 md:grid-cols-2 gap-3" @submit.prevent="save">
      <div>
        <label class="label">категорія *</label>
        <select v-model="item.category_id" class="input" required>
          <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.name_uk }}</option>
        </select>
      </div>
      <div>
        <label class="label">підкатегорія</label>
        <select v-model="item.subcategory_id" class="input">
          <option :value="null">— нема —</option>
          <option v-for="s in subsForCat" :key="s.id" :value="s.id">{{ s.name_uk }}</option>
        </select>
      </div>

      <div>
        <label class="label">назва UA *</label>
        <input v-model="item.name_uk" class="input" required @blur="syncSlug" />
      </div>
      <div>
        <label class="label">name EN</label>
        <input v-model="item.name_en" class="input" />
      </div>

      <div>
        <label class="label">slug</label>
        <input v-model="item.slug" class="input" required />
      </div>
      <div>
        <label class="label">image url</label>
        <input v-model="item.image_url" class="input" placeholder="https://…" />
      </div>

      <div>
        <label class="label">ціна (₴)</label>
        <input v-model.number="item.price" type="number" step="1" class="input" />
      </div>
      <div>
        <label class="label">або відображення «180 / 240»</label>
        <input v-model="item.price_display" class="input" placeholder="180 / 240" />
      </div>

      <div class="md:col-span-2">
        <label class="label">опис UA</label>
        <textarea v-model="item.description_uk" class="input" rows="3" />
      </div>
      <div class="md:col-span-2">
        <label class="label">description EN</label>
        <textarea v-model="item.description_en" class="input" rows="3" />
      </div>

      <div class="md:col-span-2">
        <label class="label">бейджі</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="b in BADGES" :key="b" type="button"
            class="chip" :class="{ 'is-active': (item.badges as any)?.includes(b) }"
            @click="toggleBadge(b)"
          >{{ b }}</button>
        </div>
      </div>

      <div class="md:col-span-2">
        <label class="label">теги (через кому)</label>
        <input v-model="tagsCsv" class="input" placeholder="tequila, smoky" />
      </div>

      <div class="md:col-span-2 flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm text-shelter-muted">
          <input v-model="item.is_available" type="checkbox" /> в наявності
        </label>
        <label class="flex items-center gap-2 text-sm text-shelter-muted">
          <input v-model="item.is_active" type="checkbox" /> видимий
        </label>
      </div>

      <div class="md:col-span-2 flex gap-2 mt-2">
        <button type="button" class="btn-ghost" @click="router.back()">Скасувати</button>
        <button class="btn-primary" :disabled="saving">Зберегти</button>
      </div>
    </form>

    <div v-if="item.image_url" class="mt-6">
      <span class="label">прев'ю</span>
      <img :src="item.image_url" class="preview" :alt="item.name_uk" />
    </div>
  </section>
</template>

<style scoped>
.preview {
  width: 220px; height: 220px; object-fit: cover;
  border: 1px solid var(--line-2);
  border-radius: var(--radius-lg);
}
</style>
