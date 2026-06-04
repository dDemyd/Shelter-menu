import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { getMyRequests, type MyRequestRecord } from '@/lib/api'
import type { CallRequest } from '@/lib/database.types'

/**
 * Tracks call_requests submitted by the current guest.
 * IDs are stored in localStorage; the server-side RPC `get_my_requests`
 * returns rows for those IDs (unguessable UUIDs act as access tokens).
 */
export const useMyRequestsStore = defineStore('myRequests', () => {
  const records = useStorage<MyRequestRecord[]>('shelter:my_requests', [])
  const remote = ref<CallRequest[]>([])
  const loading = ref(false)
  let pollTimer: number | undefined

  function add(rec: MyRequestRecord) {
    // newest first, dedup by id
    records.value = [rec, ...records.value.filter(r => r.id !== rec.id)].slice(0, 50)
  }

  async function refresh() {
    if (loading.value) return
    loading.value = true
    try {
      const rows = await getMyRequests(records.value.map(r => r.id))
      remote.value = rows
    } finally {
      loading.value = false
    }
  }

  function startPolling() {
    refresh()
    if (pollTimer) return
    pollTimer = window.setInterval(refresh, 15_000)
  }
  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = undefined }
  }

  const activeCount = computed(() =>
    remote.value.filter(r => r.status === 'new' || r.status === 'accepted').length
  )

  // Merge local records (so a row appears immediately) with remote data.
  const items = computed(() => {
    const map = new Map<string, CallRequest>()
    for (const rec of records.value) {
      // placeholder so UI shows the new entry even before server roundtrip
      map.set(rec.id, {
        id: rec.id,
        table_number: '—',
        items: [],
        comment: null,
        status: 'new',
        kind: rec.kind,
        telegram_message_id: null,
        source: 'qr',
        created_at: rec.ts,
        updated_at: rec.ts,
      } as CallRequest)
    }
    for (const row of remote.value) map.set(row.id, row)
    return [...map.values()].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  })

  return { records, remote, items, loading, activeCount, add, refresh, startPolling, stopPolling }
})
