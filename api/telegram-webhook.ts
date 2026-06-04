import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const TG_TOKEN     = process.env.TG_BOT_TOKEN ?? ''
const TG_SECRET    = process.env.TG_WEBHOOK_SECRET ?? ''

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const VALID_STATUS = new Set(['accepted', 'done', 'cancelled', 'new'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') { res.status(405).end(); return }

  if (TG_SECRET) {
    const got = req.headers['x-telegram-bot-api-secret-token']
    if (got !== TG_SECRET) {
      res.status(401).json({ error: 'bad secret' })
      return
    }
  }

  const update: any = req.body
  const cb = update?.callback_query
  if (!cb) { res.status(200).json({ ok: true }); return }

  const data: string = cb.data ?? ''
  const m = /^req:([0-9a-f-]+):(accepted|done|cancelled|new)$/i.exec(data)

  if (!m) {
    await answerCallback(cb.id, 'Unknown action')
    res.status(200).json({ ok: true })
    return
  }

  const [, id, status] = m
  if (!VALID_STATUS.has(status)) {
    await answerCallback(cb.id, 'Invalid status')
    res.status(200).json({ ok: true })
    return
  }

  const { error } = await supabase
    .from('call_requests')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('[tg-webhook] db', error)
    await answerCallback(cb.id, 'DB error')
    res.status(200).json({ ok: true })
    return
  }

  const statusLabel: Record<string, string> = {
    accepted: '✅ Прийнято',
    done: '🍹 Готово',
    cancelled: '✖️ Скасовано',
    new: '📣 Нове',
  }

  // Edit reply markup to show only the new state.
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: cb.message?.chat?.id,
        message_id: cb.message?.message_id,
        reply_markup: {
          inline_keyboard: [[{ text: statusLabel[status], callback_data: `req:${id}:${status}` }]],
        },
      }),
    })
  } catch (e) {
    console.warn('[tg-webhook] edit markup', e)
  }

  await answerCallback(cb.id, statusLabel[status])
  res.status(200).json({ ok: true })
}

async function answerCallback(id: string, text: string) {
  if (!TG_TOKEN || !id) return
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callback_query_id: id, text }),
    })
  } catch {}
}
