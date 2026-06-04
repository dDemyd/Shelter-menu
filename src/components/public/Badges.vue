<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/lib/i18n'
import type { BadgeKey } from '@/lib/database.types'

const props = defineProps<{ list: BadgeKey[] }>()

const META: Record<string, string> = {
  new: 'var(--accent)',
  signature: 'var(--accent)',
  hot: '#ff3a1f',
  strong: 'var(--accent)',
  na: '#7fa896',
}

const items = computed(() =>
  (props.list ?? []).map(k => ({ key: k, label: t.value.badges[k] ?? k.toUpperCase(), color: META[k] ?? 'var(--text)' }))
)
</script>

<template>
  <div v-if="items.length" class="flex flex-wrap gap-1.5">
    <span v-for="b in items" :key="b.key" class="badge" :style="{ color: b.color }">
      {{ b.label }}
    </span>
  </div>
</template>
