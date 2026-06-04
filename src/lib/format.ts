import type { Product, CallRequestItem } from './database.types'

/** Parse a "HH:MM — HH:MM" venue-hours string into open/close minutes. */
export function parseHours(s: string | null | undefined): { open: number; close: number } | null {
  if (!s) return null
  const m = String(s).match(/(\d{1,2}):(\d{2})\s*[—–-]\s*(\d{1,2}):(\d{2})/)
  if (!m) return null
  return {
    open:  Number(m[1]) * 60 + Number(m[2]),
    close: Number(m[3]) * 60 + Number(m[4]),
  }
}

/** Returns true if the venue is currently open. Handles past-midnight hours. */
export function isVenueOpen(hours: { open: number; close: number } | null, now = new Date()): boolean {
  if (!hours) return true
  const mins = now.getHours() * 60 + now.getMinutes()
  if (hours.close > hours.open) {
    return mins >= hours.open && mins < hours.close
  }
  // closing rolls over midnight (e.g. 10:00 — 02:00)
  return mins >= hours.open || mins < hours.close
}


export function formatPrice(p: Product | { price: number | null; price_display: string | null }): string {
  if (p.price_display) return p.price_display
  if (p.price != null) return Math.round(Number(p.price)).toString()
  return '—'
}

export function priceWithCurrency(p: { price: number | null; price_display: string | null }): string {
  const v = formatPrice(p)
  if (v === '—') return v
  return `${v}₴`
}

export function calcTotal(items: { qty: number; price: number | null }[]): number {
  return items.reduce((sum, it) => sum + (it.price ? it.price * it.qty : 0), 0)
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[іїє]/g, m => ({ і: 'i', ї: 'i', є: 'e' }[m] ?? m))
    .replace(/[ґ]/g, 'g')
    .replace(/[а-я]/g, m => {
      const map: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z',
        и: 'y', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
        р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch',
        ш: 'sh', щ: 'shch', ы: 'y', э: 'e', ю: 'yu', я: 'ya', ь: '', ъ: '',
      }
      return map[m] ?? m
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildTelegramItems(items: CallRequestItem[]): string {
  if (!items.length) return ''
  return items
    .map(i => `• ${i.qty} × ${i.name}${i.price ? ` — ${Math.round(i.price * i.qty)}₴` : ''}`)
    .join('\n')
}
