<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'
import { useMenuStore } from '@/stores/menu'

interface Setting { key: string; value: any; is_public: boolean }

const toast = useToast()
const menu = useMenuStore()
const settings = ref<Setting[]>([])
const saving = ref<Record<string, boolean>>({})

const KNOWN: { key: string; label: string; placeholder?: string; type?: string; isPublic: boolean }[] = [
  { key: 'venue_name',          label: 'Назва закладу',                placeholder: 'SHELTER',                  isPublic: true },
  { key: 'venue_address',       label: 'Адреса',                       placeholder: 'вул. Я. Мудрого 17',       isPublic: true },
  { key: 'venue_city',          label: 'Місто',                        placeholder: 'Біла Церква',              isPublic: true },
  { key: 'venue_hours',         label: 'Години роботи',                placeholder: '10:00 — 02:00',            isPublic: true },
  { key: 'venue_hours_note',    label: 'Примітка про години',          placeholder: 'щодня',                    isPublic: true },
  { key: 'venue_coords',        label: 'Координати (текст у шапці)',                                              isPublic: true },
  { key: 'wifi_ssid',           label: 'Wi-Fi мережа',                 placeholder: 'shelter_guest',            isPublic: true },
  { key: 'wifi_password',       label: 'Wi-Fi пароль',                 placeholder: 'sh3lt3r2024',              isPublic: true },
  { key: 'allergy_notice_uk',   label: 'Підпис про алергії (UA)',      placeholder: 'Алергії або щось не з меню?', isPublic: true },
  { key: 'allergy_notice_en',   label: 'Allergy notice (EN)',          placeholder: 'Allergies or off-menu?',   isPublic: true },
  { key: 'hookah_constructor_url', label: 'URL конструктора кальянів', placeholder: 'https://hookah-shelter.vercel.app/', isPublic: true },
  { key: 'phone',               label: 'Телефон',                                                                 isPublic: true },
  { key: 'instagram',           label: 'Instagram URL',                                                           isPublic: true },
  { key: 'tiktok',              label: 'TikTok URL',                                                              isPublic: true },
  { key: 'maps_url',            label: 'Google Maps URL',                                                         isPublic: true },
  { key: 'copyright_year_from', label: 'Рік початку (для © у футері)', placeholder: '2021',                     isPublic: true },
  { key: 'telegram_chat_id_override', label: 'Telegram chat_id (override env)',                                  isPublic: false },
]

async function load() {
  const { data } = await supabase.from('settings').select('*')
  const map = new Map<string, Setting>(((data as Setting[]) ?? []).map(s => [s.key, s]))
  settings.value = KNOWN.map(k => map.get(k.key) ?? { key: k.key, value: '', is_public: k.isPublic })
}
onMounted(load)

async function save(s: Setting) {
  saving.value[s.key] = true
  const value = typeof s.value === 'string' ? s.value : s.value
  const { error } = await supabase
    .from('settings')
    .upsert({ key: s.key, value: value === '' ? null : value, is_public: s.is_public }, { onConflict: 'key' })
  saving.value[s.key] = false
  if (error) { toast.error(error.message); return }
  toast.success('Збережено')
  await menu.load()
}

function metaFor(key: string) {
  return KNOWN.find(k => k.key === key) ?? { label: key, placeholder: '', isPublic: true }
}
</script>

<template>
  <section>
    <h1 class="section-title text-2xl mb-2">Налаштування</h1>
    <p class="text-sm text-shelter-muted mb-6">
      Telegram bot token зберігається у Vercel env vars як <code>TG_BOT_TOKEN</code>. Тут — лише override chat_id та публічні параметри.
    </p>

    <ul class="list">
      <li v-for="s in settings" :key="s.key" class="row">
        <div class="min-w-0 flex-1">
          <div class="font-display uppercase tracking-wider text-xs text-shelter-muted">{{ metaFor(s.key).label }}</div>
          <input v-model="s.value" class="input mt-1" :placeholder="metaFor(s.key).placeholder" />
        </div>
        <button class="btn-primary !h-10 !px-4" :disabled="!!saving[s.key]" @click="save(s)">Save</button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 10px; }
.row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 10px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
}
code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--surface-2);
  padding: 1px 6px;
  border-radius: 3px;
}
</style>
