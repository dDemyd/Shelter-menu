<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { t } from '@/lib/i18n'
import Icon from '@/components/public/Icon.vue'
import HazardStripe from '@/components/public/HazardStripe.vue'

const auth = useAuthStore()
const menu = useMenuStore()
const router = useRouter()
const route = useRoute()

const navOpen = ref(false)

onMounted(async () => {
  if (!auth.ready) await auth.init()
  await menu.load()
})

// Close drawer when navigating to a new route on mobile.
watch(() => route.fullPath, () => { navOpen.value = false })

async function signOut() {
  await auth.signOut()
  router.push({ name: 'admin-login' })
}

const links = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
  { to: '/admin/categories', label: 'Категорії', icon: 'grid' },
  { to: '/admin/subcategories', label: 'Підкатегорії', icon: 'menu' },
  { to: '/admin/products', label: 'Товари', icon: 'cards' },
  { to: '/admin/banners', label: 'Банери', icon: 'eye' },
  { to: '/admin/call-requests', label: 'Заявки', icon: 'bell' },
  { to: '/admin/settings', label: 'Налаштування', icon: 'edit' },
]
</script>

<template>
  <div class="admin-shell">
    <HazardStripe />
    <header class="admin-header">
      <button
        class="hamburger"
        :aria-label="navOpen ? t.close : 'Меню'"
        :aria-expanded="navOpen ? 'true' : 'false'"
        @click="navOpen = !navOpen"
      >
        <Icon :name="navOpen ? 'close' : 'menu'" :size="20" />
      </button>

      <div class="brand-block">
        <span class="brand-name">SHELTER</span>
        <span class="brand-sub">admin · бункер</span>
      </div>

      <div class="user-block">
        <span class="user-meta">
          {{ auth.email }} · {{ auth.profile?.role ?? '—' }}
        </span>
        <button class="hbtn" @click="signOut" :title="t.logout" :aria-label="t.logout">
          <Icon name="logout" :size="14" />
        </button>
      </div>
    </header>

    <div class="admin-body">
      <!-- Drawer backdrop on mobile -->
      <div v-if="navOpen" class="nav-backdrop" @click="navOpen = false" />

      <aside class="admin-nav" :class="{ open: navOpen }">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav-link"
          :active-class="'is-active'"
          :exact-active-class="'is-active'"
        >
          <Icon :name="l.icon" :size="14" />
          <span>{{ l.label }}</span>
        </RouterLink>
      </aside>

      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ── Header ────────────────────────────────────────────── */
.admin-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(13, 13, 13, 0.94);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.hamburger {
  width: 44px; height: 44px;
  display: none;
  align-items: center; justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--line);
  color: var(--text);
}
.hamburger:hover, .hamburger:focus-visible { border-color: var(--accent); color: var(--accent); }

.brand-block {
  display: flex; flex-direction: column;
  gap: 2px;
  flex: 1; min-width: 0;
}
.brand-name {
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text);
  text-shadow: 0 0 12px rgba(var(--accent-rgb), 0.4);
}
.brand-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.user-block { display: flex; align-items: center; gap: 10px; }
.user-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.hbtn {
  width: 36px; height: 36px;
  border-radius: 4px;
  border: 1px solid var(--line);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text);
}
.hbtn:hover, .hbtn:focus-visible { color: var(--accent); border-color: var(--accent); }

/* ── Body layout ───────────────────────────────────────── */
.admin-body {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 18px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 18px 20px 60px;
  flex: 1;
  position: relative;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  height: fit-content;
  position: sticky;
  top: 70px;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  font-family: 'Unbounded', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  border-radius: 4px;
  transition: all 140ms ease;
}
.nav-link:hover, .nav-link:focus-visible { color: var(--text); background: var(--surface-2); }
.nav-link.is-active {
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.4);
}

.admin-content {
  min-width: 0;
}

.nav-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 25;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: fadeIn 180ms ease-out;
}

/* ── Mobile ────────────────────────────────────────────── */
@media (max-width: 900px) {
  .hamburger { display: inline-flex; }
  .user-meta { display: none; }

  .admin-body {
    grid-template-columns: 1fr;
    padding: 16px 16px 80px;
    gap: 0;
  }
  .admin-nav {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 86vw;
    height: 100dvh;
    z-index: 26;
    border-radius: 0;
    border: 0;
    border-right: 1px solid var(--line-2);
    background: var(--bg-2);
    padding: 80px 14px 16px;
    transform: translateX(-100%);
    transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
    overflow-y: auto;
  }
  .admin-nav.open { transform: translateX(0); box-shadow: 8px 0 32px rgba(0, 0, 0, 0.5); }
  .nav-backdrop { display: block; }
  .nav-link { padding: 14px 12px; font-size: 12px; }
}

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
</style>
