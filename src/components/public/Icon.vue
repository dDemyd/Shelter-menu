<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
</script>

<template>
  <svg :width="size ?? 18" :height="size ?? 18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'plus'">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </template>
    <template v-else-if="name === 'minus'">
      <line x1="5" y1="12" x2="19" y2="12" />
    </template>
    <template v-else-if="name === 'close'">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </template>
    <template v-else-if="name === 'check'">
      <polyline points="20 6 9 17 4 12" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </template>
    <template v-else-if="name === 'cart'">
      <circle cx="9" cy="21" r="1.5" /><circle cx="18" cy="21" r="1.5" /><path d="M3 3h2l2.7 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6" />
    </template>
    <template v-else-if="name === 'heart'">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </template>
    <template v-else-if="name === 'arrow-left'">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </template>
    <template v-else-if="name === 'arrow-up'">
      <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
    </template>
    <template v-else-if="name === 'arrow-down'">
      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
    </template>
    <template v-else-if="name === 'arrow-right'">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </template>
    <template v-else-if="name === 'bar'">
      <path d="M8 3h8v4l-4 7-4-7V3z" /><line x1="12" y1="14" x2="12" y2="21" /><line x1="8" y1="21" x2="16" y2="21" />
    </template>
    <template v-else-if="name === 'coffee'">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
    </template>
    <template v-else-if="name === 'kitchen'">
      <path d="M3 11h18" /><path d="M5 11V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" /><path d="M5 11v9a1 1 0 0 0 1 1h2v-5h8v5h2a1 1 0 0 0 1-1v-9" />
    </template>
    <template v-else-if="name === 'hookah'">
      <path d="M9 3h6v3h-6z" /><path d="M12 6v6" /><path d="M7 12h10l-1 4a4 4 0 0 1-4 3 4 4 0 0 1-4-3z" /><path d="M17 12c4 1 5 4 3 6" />
    </template>
    <template v-else-if="name === 'globe'">
      <circle cx="12" cy="12" r="9" /><line x1="3" y1="12" x2="21" y2="12" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
    </template>
    <template v-else-if="name === 'menu'">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </template>
    <template v-else-if="name === 'grid'">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </template>
    <template v-else-if="name === 'cards'">
      <rect x="4" y="3" width="16" height="14" rx="2" /><path d="M8 7h8M8 11h5" />
    </template>
    <template v-else-if="name === 'trash'">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </template>
    <template v-else-if="name === 'eye'">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" />
    </template>
    <template v-else-if="name === 'eye-off'">
      <path d="M1 1l22 22" /><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.46 18.46 0 0 1 5.06-5.94" /><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.45 18.45 0 0 1-2.16 3.19" />
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </template>
    <template v-else-if="name === 'drag'">
      <circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" />
    </template>
    <template v-else-if="name === 'phone'">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </template>
    <template v-else-if="name === 'map'">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </template>
    <template v-else-if="name === 'instagram'">
      <rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </template>
    <template v-else-if="name === 'tiktok'">
      <path d="M15 3v10.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M15 3a5 5 0 0 0 5 5" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="9" />
    </template>
  </svg>
</template>
