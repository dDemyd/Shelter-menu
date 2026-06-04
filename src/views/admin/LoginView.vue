<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/lib/i18n'
import HazardStripe from '@/components/public/HazardStripe.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

onMounted(async () => {
  if (!auth.ready) await auth.init()
  if (auth.isStaff) router.replace((route.query.redirect as string) || '/admin')
})

async function submit() {
  error.value = null
  submitting.value = true
  try {
    await auth.signIn(email.value, password.value)
    await auth.init()
    if (!auth.isStaff) {
      error.value = 'Аккаунт не має прав адміністратора'
      submitting.value = false
      return
    }
    router.replace((route.query.redirect as string) || '/admin')
  } catch (e: any) {
    error.value = e?.message ?? 'Помилка входу'
    submitting.value = false
  }
}
</script>

<template>
  <div class="login">
    <HazardStripe />
    <div class="card">
      <span class="font-mono text-[10px] tracking-widest uppercase text-shelter-accent">SHELTER · CONTROL ROOM</span>
      <h1 class="font-display uppercase tracking-wider text-2xl mt-2 text-shadow-neon">{{ t.login }}</h1>

      <form class="mt-5 flex flex-col gap-3" @submit.prevent="submit">
        <div>
          <label class="label">email</label>
          <input v-model="email" type="email" autocomplete="email" required class="input" />
        </div>
        <div>
          <label class="label">password</label>
          <input v-model="password" type="password" autocomplete="current-password" required class="input" />
        </div>

        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

        <button class="btn-primary mt-2" :disabled="submitting">{{ t.login }}</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: 100dvh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 24px;
}
.card {
  width: 100%;
  max-width: 380px;
  padding: 28px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  border-radius: var(--radius-lg);
}
</style>
