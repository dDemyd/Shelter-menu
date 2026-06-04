/**
 * One-shot seed: reads design-handoff/shelter-menu/project/data.js, evaluates it in a sandbox,
 * and inserts categories / subcategories / products into Supabase via the service role key.
 *
 * Usage:
 *   $ cp .env.example .env  # fill in VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   $ npm run seed
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface RawItem {
  id: string
  name: string
  nameEn?: string
  price: number | string
  desc?: string
  img?: string
  badges?: string[]
  tags?: string[]
  tag?: string
}
interface RawSub {
  id: string
  label: string
  labelEn?: string
  note?: string
  items: RawItem[]
}
interface RawCat {
  label: string
  labelEn?: string
  code?: string
  subs: RawSub[]
}

function loadMenuData(): { menu: Record<string, RawCat>; order: string[] } {
  const src = readFileSync(resolve(ROOT, 'design-handoff/shelter-menu/project/data.js'), 'utf8')
  const sandbox: any = { window: {}, console }
  vm.createContext(sandbox)
  vm.runInContext(src, sandbox)
  return { menu: sandbox.window.MENU, order: sandbox.window.TAB_ORDER }
}

function parsePrice(p: number | string): { price: number | null; price_display: string | null } {
  if (typeof p === 'number') return { price: p, price_display: null }
  // strings like "180 / 240" — keep as display, store first number for sort/calc
  const m = /^(\d+(?:[.,]\d+)?)/.exec(p)
  return {
    price: m ? Number(m[1].replace(',', '.')) : null,
    price_display: p,
  }
}

async function clearExisting() {
  console.log('· clearing existing products / subcategories / categories…')
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('subcategories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}

async function main() {
  const { menu, order } = loadMenuData()
  await clearExisting()

  let catSort = 0
  for (const slug of order) {
    const cat = menu[slug]
    if (!cat) continue
    catSort += 1

    const { data: insertedCat, error: catErr } = await supabase
      .from('categories')
      .insert({
        slug,
        code: cat.code ?? null,
        name_uk: cat.label,
        name_en: cat.labelEn ?? null,
        sort_order: catSort,
        is_active: true,
      })
      .select('id')
      .single()
    if (catErr || !insertedCat) {
      console.error('  ✕ category', slug, catErr); continue
    }
    console.log(`· ${slug} (${cat.label})`)

    let subSort = 0
    for (const sub of cat.subs) {
      subSort += 1
      const { data: insertedSub, error: subErr } = await supabase
        .from('subcategories')
        .insert({
          category_id: insertedCat.id,
          slug: sub.id,
          name_uk: sub.label,
          name_en: sub.labelEn ?? null,
          note_uk: sub.note ?? null,
          sort_order: subSort,
          is_active: true,
        })
        .select('id')
        .single()
      if (subErr || !insertedSub) {
        console.error('   ✕ subcategory', sub.id, subErr); continue
      }
      console.log(`   · ${sub.id} (${sub.label}) — ${sub.items.length} items`)

      let prodSort = 0
      const rows = sub.items.map(it => {
        prodSort += 1
        const { price, price_display } = parsePrice(it.price)
        return {
          category_id: insertedCat.id,
          subcategory_id: insertedSub.id,
          slug: it.id,
          name_uk: it.name,
          name_en: it.nameEn ?? null,
          description_uk: it.desc ?? null,
          price,
          price_display,
          image_url: it.img ?? null,
          badges: it.badges ?? [],
          tags: it.tags ?? (it.tag ? [it.tag] : []),
          is_available: true,
          is_active: true,
          sort_order: prodSort,
        }
      })

      // Batch insert
      const { error: prodErr } = await supabase.from('products').insert(rows)
      if (prodErr) console.error('     ✕ products', sub.id, prodErr)
    }
  }

  console.log('✓ seed done')
}

main().catch(e => { console.error(e); process.exit(1) })
