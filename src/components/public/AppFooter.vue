<script setup lang="ts">
import { computed } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { lang } from '@/lib/i18n'
import Icon from './Icon.vue'

const menu = useMenuStore()

const allergyNotice = computed(() => {
  const k = lang.value === 'en' ? 'allergy_notice_en' : 'allergy_notice_uk'
  return menu.setting(k, 'Алергії або щось не з меню? Просто запитайте бармена.') as string
})

const venueAddress    = computed(() => menu.setting('venue_address',    'вул. Я. Мудрого 17') as string)
const venueCity       = computed(() => menu.setting('venue_city',       'Біла Церква')      as string)
const venueHours      = computed(() => menu.setting('venue_hours',      '10:00 — 02:00')    as string)
const venueHoursNote  = computed(() => menu.setting('venue_hours_note', 'щодня')            as string)
const wifiSsid        = computed(() => menu.setting('wifi_ssid',        'shelter_guest')    as string)
const wifiPassword    = computed(() => menu.setting('wifi_password',    'sh3lt3r2024')      as string)
const phone           = computed(() => menu.setting('phone',            '+380677525089')    as string)
const mapsUrl         = computed(() => menu.setting('maps_url',         'https://maps.google.com') as string)
const instagram       = computed(() => menu.setting('instagram',        'https://instagram.com/shelter_bc') as string)
const tiktok          = computed(() => menu.setting('tiktok',           'https://tiktok.com/@shelter_bc')   as string)
const yearFrom        = computed(() => menu.setting('copyright_year_from', 2021) as number)
const yearNow = new Date().getFullYear()
const copyright = computed(() =>
  `СХОВИЩЕ © ${yearFrom.value}-${yearNow} · ALL RIGHTS RESERVED`
)

const LABELS = computed(() => lang.value === 'en'
  ? { address: 'ADDRESS', hours: 'HOURS', wifi: 'WI-FI', password: 'PASSWORD' }
  : { address: 'АДРЕСА', hours: 'ГОДИНИ', wifi: 'WI-FI', password: 'ПАРОЛЬ' }
)
</script>

<template>
  <footer class="app-footer">
    <!-- Allergy notice -->
    <div class="allergy" role="note">
      <span class="dot" aria-hidden="true" />
      <span class="allergy-text">{{ allergyNotice }}</span>
    </div>

    <!-- Address + Hours -->
    <div class="info-grid">
      <section>
        <span class="label">{{ LABELS.address }}</span>
        <p class="info-main">{{ venueAddress }}</p>
        <p class="info-sub">{{ venueCity }}</p>
      </section>
      <section>
        <span class="label">{{ LABELS.hours }}</span>
        <p class="info-main info-hours">{{ venueHours }}</p>
        <p class="info-sub">{{ venueHoursNote }}</p>
      </section>
    </div>

    <!-- Wi-Fi -->
    <div class="info-grid wifi-grid">
      <section>
        <span class="label">{{ LABELS.wifi }}</span>
        <p class="info-main wifi-creds">{{ wifiSsid }}</p>
      </section>
      <section>
        <span class="label">{{ LABELS.password }}</span>
        <p class="info-main wifi-creds">{{ wifiPassword }}</p>
      </section>
    </div>

    <!-- Socials -->
    <div class="socials" role="group" aria-label="Контакти">
      <a v-if="mapsUrl"   :href="mapsUrl"           target="_blank" rel="noopener" aria-label="Map">    <Icon name="map"       :size="18" /></a>
      <a v-if="phone"     :href="`tel:${phone}`"                                    aria-label="Phone"> <Icon name="phone"     :size="18" /></a>
      <a v-if="instagram" :href="instagram"         target="_blank" rel="noopener" aria-label="Instagram"><Icon name="instagram" :size="18" /></a>
      <a v-if="tiktok"    :href="tiktok"            target="_blank" rel="noopener" aria-label="TikTok"><Icon name="tiktok"    :size="18" /></a>
    </div>

    <!-- Legal -->
    <div class="legal">
      <p class="copy">{{ copyright }}</p>
      <a class="credit" href="https://www.instagram.com/helldemid/" target="_blank" rel="noopener">
        Designed and Created by <span class="credit-name">helldemid</span>
      </a>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 28px 4px 32px;
  margin-top: 12px;
}

/* ── Allergy ──────────────────────────────────────────── */
.allergy {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px dashed rgba(var(--accent-rgb), 0.55);
  border-radius: 8px;
  background: rgba(var(--accent-rgb), 0.04);
}
.allergy .dot {
  flex: 0 0 auto;
  width: 8px; height: 8px;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.8);
  animation: pulseDot 2.4s ease-in-out infinite;
}
.allergy-text {
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text);
}

/* ── Info grid ────────────────────────────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.label {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 8px;
}
.info-main {
  margin: 0;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.005em;
  color: var(--text);
}
.info-hours {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
.info-sub {
  margin: 2px 0 0;
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  color: var(--muted);
}

/* ── Wi-Fi ────────────────────────────────────────────── */
.wifi-creds {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--text);
}

/* ── Socials ──────────────────────────────────────────── */
.socials {
  display: flex;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px dashed var(--line);
}
.socials > * {
  margin-top: 18px;
}
.socials a {
  width: 44px; height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line-2);
  color: var(--text);
  transition: all 160ms ease;
}
.socials a:hover, .socials a:focus-visible {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
  box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.55);
}

/* ── Legal ────────────────────────────────────────────── */
.legal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
  text-align: center;
}
.copy {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted-2);
}
.credit {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  transition: color 140ms ease;
}
.credit-name {
  color: var(--accent);
  font-weight: 700;
  text-shadow: 0 0 8px rgba(var(--accent-rgb), 0.5);
  transition: text-shadow 160ms ease;
}
.credit:hover .credit-name,
.credit:focus-visible .credit-name {
  text-shadow: 0 0 14px rgba(var(--accent-rgb), 0.9);
}
.credit:hover, .credit:focus-visible {
  color: var(--text);
}

@keyframes pulseDot {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.3); opacity: 1; }
}
</style>
