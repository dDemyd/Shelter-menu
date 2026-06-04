import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(null)
  const email = ref<string | null>(null)
  const profile = ref<Profile | null>(null)
  const ready = ref(false)

  const isStaff = computed(() => !!profile.value && ['admin', 'manager'].includes(profile.value.role))
  const isAdmin = computed(() => profile.value?.role === 'admin')

  async function init() {
    const { data } = await supabase.auth.getSession()
    await syncSession(data.session?.user?.id ?? null, data.session?.user?.email ?? null)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncSession(session?.user?.id ?? null, session?.user?.email ?? null)
    })
    ready.value = true
  }

  async function syncSession(id: string | null, mail: string | null) {
    userId.value = id
    email.value = mail
    if (!id) { profile.value = null; return }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) console.warn('[auth] profile load', error)
    profile.value = (data as Profile | null) ?? null
  }

  async function signIn(emailV: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: emailV, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    profile.value = null
    userId.value = null
    email.value = null
  }

  return { userId, email, profile, ready, isStaff, isAdmin, init, signIn, signOut }
})
