import type { CallRequestItem } from './database.types'
import { supabase } from './supabase'

export async function toggleLike(productId: string, liked: boolean): Promise<number | null> {
  const { data, error } = await supabase.rpc('toggle_like', {
    p_product_id: productId,
    p_liked: liked,
  })
  if (error) {
    console.warn('[toggleLike]', error)
    return null
  }
  return typeof data === 'number' ? data : null
}

export interface CallBartenderPayload {
  table?: string
  phone?: string
  items: CallRequestItem[]
  comment?: string
  kind: 'call' | 'order'
}

export async function callBartender(payload: CallBartenderPayload): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/call-bartender', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: body.error ?? `HTTP ${res.status}` }
    }
    return { ok: true, id: body.id as string }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'network error' }
  }
}

export interface MyRequestRecord {
  id: string
  kind: 'call' | 'order'
  total: number
  count: number
  ts: string
}

import type { CallRequest } from './database.types'

export async function getMyRequests(ids: string[]): Promise<CallRequest[]> {
  if (!ids.length) return []
  const { data, error } = await supabase.rpc('get_my_requests', { ids })
  if (error) {
    console.warn('[getMyRequests]', error)
    return []
  }
  return (data as CallRequest[]) ?? []
}
