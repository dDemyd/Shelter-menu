import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const ItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  name: z.string().min(1).max(120),
  qty: z.number().int().positive().max(99),
  price: z.number().nullable().optional(),
})

const BodySchema = z.object({
  table: z.string().regex(/^\d{1,3}$/).optional(),
  phone: z.string().min(5).max(32).optional(),
  items: z.array(ItemSchema).max(40).default([]),
  comment: z.string().max(500).optional(),
  kind: z.enum(['call', 'order']).default('call'),
}).refine(
  (v) => !!v.table || !!v.phone,
  { message: 'either table or phone is required' },
)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const TG_TOKEN     = process.env.TG_BOT_TOKEN ?? ''
const TG_CHAT_ID   = process.env.TG_CHAT_ID ?? ''

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Very lightweight in-memory rate limiter (per warm instance).
const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 10
const buckets = new Map<string, number[]>()
function checkRate(ip: string): boolean {
  const now = Date.now()
  const arr = (buckets.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS)
  if (arr.length >= RATE_LIMIT) {
    buckets.set(ip, arr)
    return false
  }
  arr.push(now)
  buckets.set(ip, arr)
  return true
}

function esc(s: string): string {
  return s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, m => `\\${m}`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown'
  if (!checkRate(ip)) {
    res.status(429).json({ error: 'too many requests' })
    return
  }

  const parsed = BodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid payload', details: parsed.error.flatten() })
    return
  }
  const { table, phone, items, comment, kind } = parsed.data

  // 1) Resolve chat_id (env or override).
  let chatId = TG_CHAT_ID
  try {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'telegram_chat_id_override')
      .maybeSingle()
    if (setting?.value && typeof setting.value === 'string' && setting.value.length) {
      chatId = setting.value
    }
  } catch (e) {
    console.warn('[call-bartender] settings lookup failed', e)
  }

  // 2) Persist the request.
  const tableLabel = table || (phone ? `📞 ${phone}` : '?')
  const { data: row, error: dbErr } = await supabase
    .from('call_requests')
    .insert({
      table_number: tableLabel,
      items: items,
      comment: [
        comment,
        !table && phone ? `Контакт: ${phone}` : null,
      ].filter(Boolean).join(' · ') || null,
      status: 'new',
      kind,
    })
    .select('id, created_at')
    .single()

  if (dbErr || !row) {
    console.error('[call-bartender] db insert', dbErr)
    res.status(500).json({ error: 'db insert failed' })
    return
  }

  // 3) Compose Telegram message.
  const lines: string[] = []
  const who = table ? `Стіл №${esc(table)}` : phone ? `Контакт: ${esc(phone)}` : '—'

  if (kind === 'call') {
    lines.push(`📣 *Гість просить бармена* · ${who}`)
  } else {
    lines.push(`🍸 *Замовлення* · ${who}`)
  }

  if (items.length) {
    lines.push('────────────')
    let total = 0
    for (const it of items) {
      const sum = it.price ? Math.round(it.price * it.qty) : 0
      total += sum
      lines.push(`• ${it.qty} × ${esc(it.name)}${it.price ? ` — ${sum}₴` : ''}`)
    }
    lines.push('────────────')
    if (total > 0) lines.push(`*Сума:* ${total}₴`)
  }
  if (comment) lines.push(`💬 _${esc(comment)}_`)
  const text = lines.join('\n')

  // 4) Send to Telegram (if configured).
  let messageId: number | null = null
  if (TG_TOKEN && chatId) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Прийнято', callback_data: `req:${row.id}:accepted` },
              { text: '🍹 Готово',   callback_data: `req:${row.id}:done` },
              { text: '✖️ Скасувати', callback_data: `req:${row.id}:cancelled` },
            ]],
          },
        }),
      })
      const tgJson: any = await tgRes.json().catch(() => ({}))
      if (tgJson?.ok) {
        messageId = tgJson.result?.message_id ?? null
      } else {
        console.warn('[call-bartender] telegram response', tgJson)
      }
    } catch (e) {
      console.error('[call-bartender] telegram', e)
    }
  } else {
    console.warn('[call-bartender] TG_BOT_TOKEN / TG_CHAT_ID not configured — skipping send')
  }

  if (messageId != null) {
    await supabase
      .from('call_requests')
      .update({ telegram_message_id: messageId })
      .eq('id', row.id)
  }

  res.status(200).json({ ok: true, id: row.id })
}
