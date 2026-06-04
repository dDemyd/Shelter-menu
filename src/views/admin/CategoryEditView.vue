<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useMenuStore } from '@/stores/menu'
import { useToast } from '@/composables/useToast'
import { slugify } from '@/lib/format'
import type { Category } from '@/lib/database.types'

const route = useRoute()
const router = useRouter()
const menu = useMenuStore()
const toast = useToast()

const item = ref<Partial<Category>>({})
const loading = ref(true)
const saving = ref(false)

async function load() {
  loading.value = true
  const { data } = await supabase.from('categories').select('*').eq('id', route.params.id).maybeSingle()
  if (!data) { router.push('/admin/categories'); return }
  item.value = data as Category
  loading.value = false
}
onMounted(load)

function syncSlug() {
  if (!item.value.slug || item.value.slug === '') {
    item.value.slug = slugify(item.value.name_uk ?? '')
  }
}

async function save() {
  saving.value = true
  const { error } = await supabase
    .from('categories')
    .update({
      slug: item.value.slug,
      code: item.value.code ?? null,
      name_uk: item.value.name_uk,
      name_en: item.value.name_en ?? null,
      description_uk: item.value.description_uk ?? null,
      description_en: item.value.description_en ?? null,
      image_url: item.value.image_url ?? null,
      is_active: item.value.is_active,
    })
    .eq('id', route.params.id)
  saving.value = false
  if (error) { toast.error(error.message); return }
  await menu.load()
  toast.success('Збережено')
  router.push('/admin/categories')
}
</script>

<template>
  <section v-if="!loading">
    <h1 class="section-title text-2xl mb-4">Категорія: {{ item.name_uk }}</h1>

    <form class="grid grid-cols-1 md:grid-cols-2 gap-3" @submit.prevent="save">
      <div>
        <label class="label">slug</label>
        <input v-model="item.slug" class="input" required />
      </div>
      <div>
        <label class="label">code · ярлик</label>
        <input v-model="item.code" class="input" placeholder="01" maxlength="4" />
      </div>
      <div>
        <label class="label">назва UA *</label>
        <input v-model="item.name_uk" class="input" required @blur="syncSlug" />
      </div>
      <div>
        <label class="label">name EN</label>
        <input v-model="item.name_en" class="input" />
      </div>
      <div class="md:col-span-2">
        <label class="label">опис UA</label>
        <textarea v-model="item.description_uk" class="input" rows="2" />
      </div>
      <div class="md:col-span-2">
        <label class="label">description EN</label>
        <textarea v-model="item.description_en" class="input" rows="2" />
      </div>
      <div class="md:col-span-2">
        <label class="label">image url</label>
        <input v-model="item.image_url" class="input" placeholder="https://…" />
      </div>
      <div class="md:col-span-2 flex items-center gap-2">
        <input id="active" v-model="item.is_active" type="checkbox" />
        <label for="active" class="text-sm text-shelter-muted">Категорія активна (видима гостям)</label>
      </div>

      <div class="md:col-span-2 flex gap-2 mt-2">
        <button type="button" class="btn-ghost" @click="router.back()">Скасувати</button>
        <button class="btn-primary" :disabled="saving">Зберегти</button>
      </div>
    </form>
  </section>
</template>
