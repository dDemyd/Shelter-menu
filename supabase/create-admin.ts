/**
 * Create an admin user (or promote an existing one) using the Supabase service-role key.
 *
 * Usage:
 *   ADMIN_EMAIL=you@local ADMIN_PASSWORD=secret npm run admin:create
 *
 * Defaults — useful for local dev:
 *   ADMIN_EMAIL=admin@shelter.local
 *   ADMIN_PASSWORD=shelter1234
 */
import { createClient } from '@supabase/supabase-js'

const URL  = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@shelter.local'
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'shelter1234'

if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`· creating / promoting admin: ${EMAIL}`)

  // 1) Try to create the user. Ignore "already registered" errors.
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  })

  let userId = created?.user?.id ?? null

  if (createErr) {
    if (/already (registered|exists)/i.test(createErr.message)) {
      console.log('  · user exists, looking up…')
      const { data: list } = await supabase.auth.admin.listUsers()
      userId = list?.users.find(u => u.email === EMAIL)?.id ?? null
    } else {
      console.error(createErr)
      process.exit(1)
    }
  }

  if (!userId) {
    console.error('could not resolve user id')
    process.exit(1)
  }

  // 2) Upsert profile with role = 'admin'.
  const { error: profErr } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: EMAIL, role: 'admin' }, { onConflict: 'id' })

  if (profErr) {
    console.error('profile upsert', profErr)
    process.exit(1)
  }

  console.log(`✓ admin ready · email: ${EMAIL} · password: ${PASSWORD}`)
}

main().catch(e => { console.error(e); process.exit(1) })
